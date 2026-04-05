import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { isRateLimited } from '@/lib/security';

const setupSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  companyName: z.string().min(1, 'Le nom de l\'entreprise est requis'),
});

// GET /api/auth/setup — Check if setup is needed
export async function GET() {
  try {
    const userCount = await db.user.count();
    const isFirstSetup = userCount === 0;

    return NextResponse.json({ isFirstSetup });
  } catch (error) {
    console.error('Setup check error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 },
    );
  }
}

// POST /api/auth/setup — Create first admin user (only when no users exist)
export async function POST(request: NextRequest) {
  // Rate limiting: 3 req/min per IP (setup is sensitive)
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || 'unknown';
  if (isRateLimited(clientIp, 3, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans une minute.' },
      { status: 429 },
    );
  }

  try {
    // Check if setup already done — this IS the admin guard for setup:
    // only the first user can be created via setup, and they become admin.
    // After setup is done, this route is locked.
    const userCount = await db.user.count();
    if (userCount > 0) {
      return NextResponse.json(
        { error: 'La configuration initiale a déjà été effectuée' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = setupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Données invalides' },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName, companyName } = parsed.data;

    // Create workspace
    const workspace = await db.workspace.create({
      data: {
        name: companyName,
        slug: 'dealscope',
        plan: 'pro',
      },
    });

    // Hash password and create admin user
    const hashedPassword = await hashPassword(password);
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        workspaceId: workspace.id,
        emailVerified: true,
      },
    });

    // Mark setup as done
    await db.appSetting.upsert({
      where: { id: 'app' },
      update: { isFirstSetup: false },
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
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Échec de la configuration initiale' },
      { status: 500 },
    );
  }
}
