import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, type RateLimitConfig } from './rate-limiter';
import { logRateLimited, logCsrfFailure } from './audit-logger';
import { extractClientIp, validateCsrfToken, isBodySizeValid } from './security-context';
import { SECURITY_CONSTANTS } from './constants';

export interface SecurityCheckConfig {
  requireAuth?: boolean;
  requireCsrf?: boolean;
  rateLimit?: RateLimitConfig | false;
  maxBodySize?: number;
}

export interface SecurityCheckResult {
  passed: boolean;
  response?: NextResponse;
  ip: string;
}

export async function performSecurityChecks(
  request: NextRequest,
  config: SecurityCheckConfig = {}
): Promise<SecurityCheckResult> {
  const ip = extractClientIp(request);

  if (config.maxBodySize !== undefined && !isBodySizeValid(request, config.maxBodySize)) {
    return {
      passed: false,
      response: NextResponse.json(
        { error: 'Requête trop volumineuse' },
        { status: 413 }
      ),
      ip,
    };
  }

  if (!isBodySizeValid(request, SECURITY_CONSTANTS.BODY.MAX_SIZE_BYTES)) {
    return {
      passed: false,
      response: NextResponse.json(
        { error: 'Requête trop volumineuse' },
        { status: 413 }
      ),
      ip,
    };
  }

  if (config.requireCsrf !== false && isMutatingRequest(request)) {
    if (!validateCsrfToken(request)) {
      logCsrfFailure(ip);
      return {
        passed: false,
        response: NextResponse.json(
          { error: 'Token CSRF invalide' },
          { status: 403 }
        ),
        ip,
      };
    }
  }

  if (config.rateLimit !== false) {
    const rateLimitConfig: RateLimitConfig = config.rateLimit || {
      maxRequests: getDefaultRateLimit(request),
      windowMs: SECURITY_CONSTANTS.RATE_LIMIT.DEFAULT_WINDOW_MS,
    };

    const result = checkRateLimit(ip, rateLimitConfig);

    if (!result.allowed) {
      logRateLimited(ip, request.nextUrl.pathname);
      return {
        passed: false,
        response: NextResponse.json(
          { error: 'Trop de requêtes. Réessayez plus tard.' },
          {
            status: 429,
            headers: {
              'Retry-After': result.retryAfter?.toString() || '60',
              'X-RateLimit-Reset': result.resetAt.toString(),
            },
          }
        ),
        ip,
      };
    }
  }

  return { passed: true, ip };
}

function isMutatingRequest(request: NextRequest): boolean {
  const method = request.method.toUpperCase();
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function getDefaultRateLimit(request: NextRequest): number {
  const method = request.method.toUpperCase();
  const path = request.nextUrl.pathname;

  if (path.includes('/auth/')) {
    if (path.includes('register') || path.includes('reset-password') || path.includes('forgot-password')) {
      return 3;
    }
    return 10;
  }

  if (path.includes('/ai/') || path.includes('/chat')) {
    return 5;
  }

  if (path.includes('/enrich') || path.includes('/scan')) {
    return 10;
  }

  if (method === 'GET') {
    return 60;
  }

  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    return 30;
  }

  if (method === 'DELETE') {
    return 20;
  }

  return 30;
}

export function createErrorResponse(
  message: string,
  status: number = 500,
  isProduction: boolean = process.env.NODE_ENV === 'production'
): NextResponse {
  const safeMessage = status >= 500 && isProduction
    ? 'Erreur interne du serveur'
    : message;

  return NextResponse.json({ error: safeMessage }, { status });
}

export function createRateLimitResponse(retryAfter: number = 60): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}
