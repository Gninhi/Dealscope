import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { isRateLimited, getClientIp, rateLimitedResponse, sanitizeInput, safeErrorResponse } from '@/lib/security';
import { getWorkspace } from '@/lib/workspace';
import { passwordSchema } from '@/lib/validators';

const registerSchema = z.object({
  email: z.string().email('Email invalide').max(254).toLowerCase().trim(),
  password: passwordSchema,
  firstName: z.string().min(1, 'Le prénom est requis').max(100).trim(),
  lastName: z.string().min(1, 'Le nom est requis').max(100).trim(),
});

export async function POST(request: NextRequest) {
  // Rate limiting: 5 req/min per IP
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 5, 60 * 1000)) {
    return rateLimitedResponse();
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName } = parsed.data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 },
      );
    }

    const { user } = await db.$transaction(async (tx) => {
      const workspace = await getWorkspace();

      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: sanitizeInput(firstName, 100),
          lastName: sanitizeInput(lastName, 100),
          role: 'member',
          workspaceId: workspace.id,
        },
      });

      // Update AppSetting if this is the first user
      await tx.appSetting.upsert({
        where: { id: 'app' },
        update: {},
        create: { id: 'app', isFirstSetup: false },
      });

      return { user };
    });

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
      { status: 201 },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return safeErrorResponse('Échec de la création du compte', 500);
  }
}
