import type { NextRequest } from 'next/server';
import type { SecurityContext } from './types';
import { SECURITY_CONSTANTS, SECURITY_HEADERS } from './constants';
import { generateRequestId } from './crypto';
import { sanitizeString } from './sanitizer';

export function extractClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0].slice(0, SECURITY_CONSTANTS.IP.MAX_LENGTH);
    }
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim().slice(0, SECURITY_CONSTANTS.IP.MAX_LENGTH);
  }

  return 'unknown';
}

export function extractUserAgent(request: NextRequest): string {
  const ua = request.headers.get('user-agent');
  return ua ? sanitizeString(ua, { maxLength: 500 }) : '';
}

export function extractOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (origin) {
    return sanitizeString(origin, { maxLength: 200 });
  }
  
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return null;
    }
  }
  
  return null;
}

export function createSecurityContext(request: NextRequest, userId?: string, workspaceId?: string): SecurityContext {
  return {
    ip: extractClientIp(request),
    userId,
    workspaceId,
    userAgent: extractUserAgent(request),
    requestId: generateRequestId(),
  };
}

export function validateRequestOrigin(request: NextRequest, allowedOrigins: string[]): boolean {
  const origin = extractOrigin(request);
  if (!origin) return true;

  if (allowedOrigins.length === 0) return true;

  return allowedOrigins.includes(origin) || allowedOrigins.includes('*');
}

export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;

  if (!headerToken || !cookieToken) return false;
  if (headerToken.length !== cookieToken.length) return false;

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return result === 0;
}

export function isBodySizeValid(request: NextRequest, maxSize: number = SECURITY_CONSTANTS.BODY.MAX_SIZE_BYTES): boolean {
  const contentLength = request.headers.get('content-length');
  if (!contentLength) return true;
  
  const size = parseInt(contentLength, 10);
  if (isNaN(size)) return false;
  
  return size <= maxSize;
}

export function buildSecurityHeaders(isDev: boolean = false): Record<string, string> {
  const directives = { ...SECURITY_HEADERS.CSP_DIRECTIVES };
  
  // Override script-src for dev mode
  if (isDev) {
    directives['script-src'] = "'self' 'unsafe-inline' 'unsafe-eval'";
  }

  const cspDirectives = Object.entries(directives)
    .map(([directive, value]) => `${directive} ${value}`)
    .join('; ');

  const headers: Record<string, string> = {
    'Content-Security-Policy': cspDirectives,
    ...SECURITY_HEADERS.STATIC_HEADERS,
  };

  if (!isDev) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }

  return headers;
}
