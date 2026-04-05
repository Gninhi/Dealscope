import { NextRequest, NextResponse } from 'next/server';

// ── Rate Limiter (in-memory, per IP) ──────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit check — returns true if the request should be blocked.
 * @param ip Client IP address
 * @param maxRequests Max requests in the window
 * @param windowMs Window duration in milliseconds
 */
export function isRateLimited(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000,
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}

/**
 * Get remaining requests and reset time for rate limit headers.
 */
export function getRateLimitInfo(ip: string, maxRequests: number = 10, windowMs: number = 60 * 1000) {
  const entry = rateLimitMap.get(ip);
  const now = Date.now();
  const resetAt = entry?.resetAt || now + windowMs;
  const remaining = Math.max(0, maxRequests - (entry?.count || 0));

  return {
    remaining,
    resetAt: Math.ceil((resetAt - now) / 1000),
  };
}

// ── CSRF Token (double-submit cookie pattern) ────────────────────

/**
 * Generate a random CSRF token.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 32; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from header against cookie.
 */
export function validateCsrf(request: NextRequest): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;

  if (!headerToken || !cookieToken) return false;
  return headerToken === cookieToken;
}

// ── Security Headers ─────────────────────────────────────────────

export function getSecurityHeaders(): HeadersInit {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

/**
 * Create a security-enhanced NextResponse.
 */
export function securityResponse(
  body?: BodyInit | null,
  init?: ResponseInit,
): NextResponse {
  const response = NextResponse.json(body, init);
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
