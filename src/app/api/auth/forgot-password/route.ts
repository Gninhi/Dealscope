import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { isRateLimited } from '@/lib/security';
import { generateCsrfToken } from '@/lib/security';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  // Rate limiting: 3 req/min per IP
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(clientIp, 3, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans une minute.' },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { email } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      // Always return success to prevent email enumeration
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      });
    }

    // Generate reset token (32 random hex chars)
    const resetToken = generateCsrfToken();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // In production, this would send an email with the reset link.
    // For now, return the token in the response.
    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      // Development only: expose token
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la demande de réinitialisation' },
      { status: 500 },
    );
  }
}
