import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import type { AuthenticatedUser, AuthResult } from './core/types';
import { logAuthFailure, logAuthorizationFailure } from './core/audit-logger';
import { extractClientIp } from './core/security-context';

export async function requireAuthentication(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  try {
    const session = await auth();
    const user = session?.user as AuthenticatedUser | undefined;

    if (!user?.id || !user.workspaceId) {
      const ip = extractClientIp(request);
      logAuthFailure(ip, 'login', 'No valid session');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      workspaceId: user.workspaceId,
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

export async function requireAdminRole(request: NextRequest): Promise<AuthenticatedUser | NextResponse> {
  const userResult = await requireAuthentication(request);

  if (userResult instanceof NextResponse) {
    return userResult;
  }

  if (userResult.role !== 'admin') {
    const ip = extractClientIp(request);
    logAuthorizationFailure(userResult.id, ip, 'admin-only', undefined);
    return NextResponse.json(
      { error: 'Accès réservé aux administrateurs' },
      { status: 403 }
    );
  }

  return userResult;
}

export async function requireWorkspaceMember(
  request: NextRequest,
  workspaceId: string
): Promise<AuthenticatedUser | NextResponse> {
  const userResult = await requireAuthentication(request);

  if (userResult instanceof NextResponse) {
    return userResult;
  }

  if (userResult.workspaceId !== workspaceId) {
    const ip = extractClientIp(request);
    logAuthorizationFailure(userResult.id, ip, 'workspace', workspaceId);
    return NextResponse.json(
      { error: 'Accès non autorisé à ce workspace' },
      { status: 403 }
    );
  }

  return userResult;
}

export function requireValidId(id: string | null, fieldName: string = 'ID'): string | NextResponse {
  if (!id) {
    return NextResponse.json(
      { error: `${fieldName} requis` },
      { status: 400 }
    );
  }

  const sanitized = id.trim();
  if (sanitized.length === 0 || sanitized.length > 128) {
    return NextResponse.json(
      { error: `${fieldName} invalide` },
      { status: 400 }
    );
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
    return NextResponse.json(
      { error: `${fieldName} invalide` },
      { status: 400 }
    );
  }

  return sanitized;
}

export type AuthGuardResult = AuthenticatedUser | NextResponse;

export { extractClientIp } from './core/security-context';
