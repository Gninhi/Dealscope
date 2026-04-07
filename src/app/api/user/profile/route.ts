import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { validateCsrf, safeErrorResponse, getClientIp, isRateLimited, rateLimitedResponse, sanitizeInput } from '@/lib/security';
import { passwordSchema } from '@/lib/validators';
import { hashPassword, verifyPassword } from '@/lib/password';

/**
 * GET /api/user/profile
 * Récupérer le profil de l'utilisateur connecté.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    // Rate limit profile reads
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 60, 60 * 1000)) {
      return rateLimitedResponse();
    }

    const user = await db.user.findUnique({
      where: { id: authResult.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        workspace: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    if (!user) {
      return safeErrorResponse('Utilisateur non trouvé', 404);
    }

    return NextResponse.json({
      user: {
        ...user,
        displayName: `${user.firstName} ${user.lastName}`.trim() || user.email,
      },
    });
  } catch (error) {
    console.error('[GET /api/user/profile]', error);
    return safeErrorResponse('Erreur serveur', 500);
  }
}

/**
 * PATCH /api/user/profile
 * Mettre à jour le profil de l'utilisateur connecté.
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;

    if (!validateCsrf(request)) {
      return NextResponse.json({ error: 'Token CSRF invalide' }, { status: 403 });
    }

    // Rate limit profile mutations
    const clientIp = getClientIp(request);
    if (isRateLimited(clientIp, 10, 60 * 1000)) {
      return rateLimitedResponse();
    }

    const body = await request.json();

    // Validation des champs autorisés
    const allowedFields = ['firstName', 'lastName', 'email'];
    const updates: Record<string, string> = {};
    const errors: string[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const value = String(body[field]).trim();
        if (field === 'email') {
          // Validation email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors.push('Format d\'email invalide');
            continue;
          }
        }
        if (field === 'firstName' || field === 'lastName') {
          if (value.length > 100) {
            errors.push(`${field} ne peut pas dépasser 100 caractères`);
            continue;
          }
        }
        // Sanitize string inputs before DB write
        updates[field] = sanitizeInput(value, 254);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 });
    }

    if (Object.keys(updates).length === 0 && !body.currentPassword) {
      return NextResponse.json(
        { error: 'Aucune modification à appliquer' },
        { status: 400 },
      );
    }

    // Gestion du changement de mot de passe
    if (body.currentPassword || body.newPassword) {
      if (!body.currentPassword || !body.newPassword) {
        return NextResponse.json(
          { error: 'Mot de passe actuel et nouveau mot de passe requis' },
          { status: 400 },
        );
      }

      // Validate new password using shared passwordSchema
      try {
        passwordSchema.parse(body.newPassword);
      } catch (err: any) {
        return NextResponse.json(
          { error: err.issues?.[0]?.message || 'Mot de passe invalide' },
          { status: 400 },
        );
      }

      // Vérifier le mot de passe actuel
      const currentUser = await db.user.findUnique({
        where: { id: authResult.id },
        select: { password: true },
      });

      if (!currentUser) {
        return safeErrorResponse('Utilisateur non trouvé', 404);
      }

      const isCurrentValid = await verifyPassword(
        body.currentPassword,
        currentUser.password,
      );

      if (!isCurrentValid) {
        return NextResponse.json(
          { error: 'Mot de passe actuel incorrect' },
          { status: 401 },
        );
      }

      // Hasher le nouveau mot de passe
      updates.password = await hashPassword(body.newPassword);
    }

    // Vérifier l'unicité de l'email si modifié
    if (updates.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: updates.email.toLowerCase(),
          NOT: { id: authResult.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un autre compte' },
          { status: 409 },
        );
      }

      updates.email = updates.email.toLowerCase();
    }

    // Appliquer les modifications
    const updatedUser = await db.user.update({
      where: { id: authResult.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        workspace: {
          select: { id: true, name: true, slug: true, plan: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Profil mis à jour avec succès',
      user: {
        ...updatedUser,
        displayName: `${updatedUser.firstName} ${updatedUser.lastName}`.trim() || updatedUser.email,
      },
    });
  } catch (error) {
    console.error('[PATCH /api/user/profile]', error);
    return safeErrorResponse('Erreur serveur', 500);
  }
}
