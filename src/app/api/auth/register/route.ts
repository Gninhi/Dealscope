import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { isRateLimited, getClientIp, rateLimitedResponse, sanitizeInput, safeErrorResponse } from '@/lib/security';

const registerSchema = z.object({
  email: z.string().email('Email invalide').max(254).toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(128, 'Le mot de passe est trop long')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
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

    // Ensure workspace exists
    const existingWorkspace = await db.workspace.findFirst();
    let workspaceId: string;

    if (existingWorkspace) {
      workspaceId = existingWorkspace.id;
    } else {
      const workspace = await db.workspace.create({
        data: {
          name: 'DealScope Workspace',
          slug: 'dealscope',
          plan: 'pro',
        },
      });
      workspaceId = workspace.id;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: sanitizeInput(firstName, 100),
        lastName: sanitizeInput(lastName, 100),
        role: 'member',
        workspaceId,
      },
    });

    // Update AppSetting if this is the first user
    await db.appSetting.upsert({
      where: { id: 'app' },
      update: {},
      create: { id: 'app', isFirstSetup: false },
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
