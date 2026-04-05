import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { isRateLimited, getClientIp, rateLimitedResponse, generateCsrfToken, safeErrorResponse } from '@/lib/security';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email invalide').max(254).toLowerCase().trim(),
});

// POST /api/auth/forgot-password
export async function POST(request: NextRequest) {
  // Rate limiting: 3 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 3, 60 * 1000)) {
    return rateLimitedResponse();
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
    // NEVER expose the token in production — only in development for testing
    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      // Development only: expose token for testing convenience
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return safeErrorResponse("Erreur lors de la demande de réinitialisation", 500);
  }
}
