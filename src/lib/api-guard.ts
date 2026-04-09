import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logAuthFailure, logAuthorizationFailure } from './security/core/audit-logger';
import { extractClientIp } from './security/core/security-context';

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

export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const session = await auth();
    const user = session?.user as SessionUser | undefined;
    const ip = extractClientIp(request);

    if (!user?.id) {
      logAuthFailure(ip, 'login', 'No valid session');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    return {
      id: user.id,
      email: user.email ?? '',
      role: user.role ?? 'member',
      workspaceId: user.workspaceId ?? '',
    };
  } catch (error) {
    const ip = extractClientIp(request);
    logAuthFailure(ip, 'login', 'Session validation error');
    return NextResponse.json(
      { error: 'Erreur d\'authentification' },
      { status: 401 }
    );
  }
}

export async function requireAdmin(request: NextRequest): Promise<AuthResult> {
  const result = await requireAuth(request);

  if (result instanceof NextResponse) {
    return result;
  }

  if (result.role !== 'admin') {
    const ip = extractClientIp(request);
    logAuthorizationFailure(result.id, ip, 'admin');
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    );
  }

  return result;
}
