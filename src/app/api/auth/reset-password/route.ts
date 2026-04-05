import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { isRateLimited, getClientIp, rateLimitedResponse, safeErrorResponse } from '@/lib/security';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis').max(256),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe est trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
});

// POST /api/auth/reset-password
export async function POST(request: NextRequest) {
  // Rate limiting: 3 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 3, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    // Find user with valid reset token
    const user = await db.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 },
      );
    }

    // Hash new password and clear reset token
    const hashedPassword = await hashPassword(password);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Mot de passe mis à jour avec succès',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return safeErrorResponse('Erreur lors de la réinitialisation du mot de passe', 500);
  }
}
