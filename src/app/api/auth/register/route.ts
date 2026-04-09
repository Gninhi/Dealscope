import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { performSecurityChecks, createErrorResponse } from '@/lib/security/core/security-check';
import { getWorkspace } from '@/lib/workspace';
import { sanitizeString, sanitizeEmail } from '@/lib/security/core/sanitizer';
import { logCrudOperation, logAuthSuccess } from '@/lib/security/core/audit-logger';
import { emailSchema, securePasswordSchema, nameSchema } from '@/lib/validators/schemas';
import { z } from 'zod';

const registerSchema = z.object({
  email: emailSchema,
  password: securePasswordSchema,
  firstName: nameSchema,
  lastName: nameSchema,
});

export async function POST(request: NextRequest) {
  const securityCheck = await performSecurityChecks(request, {
    requireCsrf: true,
    rateLimit: { maxRequests: 5, windowMs: 60000 },
  });

  if (!securityCheck.passed) return securityCheck.response!;

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName } = parsed.data;
    const sanitizedEmail = sanitizeEmail(email);

    const existingUser = await db.user.findUnique({ where: { email: sanitizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }

    const workspace = await getWorkspace();
    const hashedPassword = await hashPassword(password);

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: sanitizedEmail,
          password: hashedPassword,
          firstName: sanitizeString(firstName, { maxLength: 100 }),
          lastName: sanitizeString(lastName, { maxLength: 100 }),
          role: 'member',
          workspaceId: workspace.id,
        },
      });

      await tx.appSetting.upsert({
        where: { id: 'app' },
        update: {},
        create: { id: 'app', isFirstSetup: false },
      });

      return newUser;
    }, {
      maxWait: 10000,
      timeout: 15000,
    });

    logAuthSuccess(user.id, securityCheck.ip, 'register');
    logCrudOperation('create', user.id, workspace.id, securityCheck.ip, 'user', user.id, true);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return createErrorResponse('Échec de la création du compte', 500);
  }
}
