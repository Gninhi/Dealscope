import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/password';
import { z } from 'zod';
import { isRateLimited, getClientIp, rateLimitedResponse, sanitizeInput, safeErrorResponse } from '@/lib/security';
import { passwordSchema } from '@/lib/validators';

const setupSchema = z.object({
  email: z.string().email('Email invalide').max(254).toLowerCase().trim(),
  password: passwordSchema,
  firstName: z.string().min(1, 'Le prénom est requis').max(100).trim(),
  lastName: z.string().min(1, 'Le nom est requis').max(100).trim(),
  companyName: z.string().min(1, "Le nom de l'entreprise est requis").max(200).trim(),
});

// GET /api/auth/setup — Check if setup is needed
// Note: This endpoint reveals whether users exist. In production, consider
// removing this or requiring authentication.
export async function GET() {
  try {
    const userCount = await db.user.count();
    const isFirstSetup = userCount === 0;

    return NextResponse.json({ isFirstSetup });
  } catch {
    // Don't leak error details about database state
    return NextResponse.json({ isFirstSetup: false }, { status: 500 });
  }
}

// POST /api/auth/setup — Create first admin user (only when no users exist)
export async function POST(request: NextRequest) {
  // Rate limiting: 3 req/min per IP (setup is sensitive)
  const clientIp = getClientIp(request);
  if (isRateLimited(clientIp, 3, 60 * 1000)) {
    return rateLimitedResponse();
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

    // Wrap all DB operations in a transaction for atomicity
    const { user, workspace } = await db.$transaction(async (tx) => {
      // Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: sanitizeInput(companyName, 200),
          slug: 'dealscope',
          plan: 'pro',
        },
      });

      // Hash password and create admin user
      const hashedPassword = await hashPassword(password);
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName: sanitizeInput(firstName, 100),
          lastName: sanitizeInput(lastName, 100),
          role: 'admin',
          workspaceId: workspace.id,
          emailVerified: true,
        },
      });

      // Mark setup as done
      await tx.appSetting.upsert({
        where: { id: 'app' },
        update: { isFirstSetup: false },
        create: { id: 'app', isFirstSetup: false },
      });

      return { user, workspace };
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
    return safeErrorResponse('Échec de la configuration initiale', 500);
  }
}
