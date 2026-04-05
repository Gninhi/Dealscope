import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { isBodyTooLarge, safeErrorResponse, getClientIp } from '@/lib/security';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  workspaceId: string;
  workspaceSlug?: string;
}

/**
 * Require authentication for an API route.
 * Returns the authenticated user info or a 401 response.
 * Also checks request body size for mutating methods.
 */
export async function requireAuth(
  request: NextRequest,
): Promise<AuthenticatedUser | NextResponse> {
  // Check body size for mutating requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    if (isBodyTooLarge(request)) {
      return NextResponse.json(
        { error: 'Requête trop volumineuse (max 1 Mo)' },
        { status: 413 },
      );
    }
  }

  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 },
      );
    }

    const user = session.user as unknown as AuthenticatedUser;

    if (!user.id || !user.email || !user.workspaceId) {
      return NextResponse.json(
        { error: 'Session invalide' },
        { status: 401 },
      );
    }

    return user;
  } catch {
    return NextResponse.json(
      { error: "Erreur d'authentification" },
      { status: 401 },
    );
  }
}

/**
 * Require admin role for an API route.
 * Returns the authenticated user info or a 401/403 response.
 */
export async function requireAdmin(
  request: NextRequest,
): Promise<AuthenticatedUser | NextResponse> {
  // Check body size for mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    if (isBodyTooLarge(request)) {
      return NextResponse.json(
        { error: 'Requête trop volumineuse (max 1 Mo)' },
        { status: 413 },
      );
    }
  }

  const authResult = await requireAuth(request);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.role !== 'admin') {
    return NextResponse.json(
      { error: 'Accès refusé. Droits administrateur requis.' },
      { status: 403 },
    );
  }

  return authResult;
}

/**
 * Helper to unwrap requireAuth — throws if not authenticated.
 * Use in try/catch blocks for cleaner route code.
 */
export function unwrapAuth(
  result: AuthenticatedUser | NextResponse,
): AuthenticatedUser {
  if (result instanceof NextResponse) {
    throw new Error('Unauthorized');
  }
  return result;
}

// Re-export convenience functions
export { getClientIp, safeErrorResponse };
