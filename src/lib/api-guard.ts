// ─── API Auth Guard ─────────────────────────────────────────────
// Centralized authentication helpers for API routes.
// Uses NextAuth session to verify requests.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// NextAuth v5 augmentations — our JWT stores role/workspaceId/workspaceSlug
type SessionUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
  workspaceSlug?: string;
};

type AuthResult =
  | NextResponse
  | { id: string; email: string; role: string; workspaceId: string };

/**
 * Require authenticated session. Returns NextResponse on error,
 * or the authenticated user payload on success.
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 },
      );
    }

    return {
      id: user.id,
      email: user.email ?? '',
      role: user.role ?? 'member',
      workspaceId: user.workspaceId ?? '',
    };
  } catch {
    return NextResponse.json(
      { error: 'Erreur d\'authentification' },
      { status: 401 },
    );
  }
}

/**
 * Require admin role. Returns NextResponse on error (401 or 403),
 * or the authenticated admin payload on success.
 */
export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await requireAuth(request);

  if (result instanceof NextResponse) {
    return result;
  }

  if (result.role !== 'admin') {
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 },
    );
  }

  return result;
}
