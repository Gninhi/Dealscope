import { NextRequest, NextResponse } from 'next/server';

// ── Rate Limiter (in-memory, per IP + per key) ──────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_MAP_SIZE = 10000;

// Lazy cleanup — only starts when first rate limit check happens
let cleanupStarted = false;
function scheduleCleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  if (typeof setInterval === 'function') {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetAt) {
          rateLimitMap.delete(key);
        }
      }
      if (rateLimitMap.size > MAX_MAP_SIZE) {
        const entries = Array.from(rateLimitMap.entries());
        entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
        const toDelete = entries.slice(0, entries.length - MAX_MAP_SIZE);
        for (const [key] of toDelete) {
          rateLimitMap.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }
}

/**
 * Rate limit check — returns true if the request should be blocked.
 */
export function isRateLimited(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60 * 1000,
): boolean {
  scheduleCleanup();

  const now = Date.now();
  const key = ip;

  if (rateLimitMap.size >= MAX_MAP_SIZE && !rateLimitMap.has(key)) {
    return true;
  }

  const entry = rateLimitMap.get(key);

  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return true;
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const penaltyMs = Math.min(windowMs * Math.pow(2, Math.min(entry.count - maxRequests, 5)), 3600000);
    entry.blockedUntil = now + penaltyMs;
    entry.resetAt = now + penaltyMs;
    return true;
  }

  return false;
}

// ── Request Body Size Limiter ───────────────────────────────────

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

export function isBodyTooLarge(request: NextRequest): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return true;
  }
  return false;
}

// ── CSRF Token (double-submit cookie pattern) ────────────────────

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(array);
  } else {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodeCrypto = require('crypto');
      const bytes = nodeCrypto.randomBytes(32);
      for (let i = 0; i < 32; i++) {
        array[i] = bytes[i];
      }
    } catch {
      console.error('[SECURITY CRITICAL] crypto.getRandomValues AND require("crypto") unavailable');
      throw new Error('Cryptographic random number generator not available');
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from header against cookie (constant-time).
 */
export function validateCsrf(request: NextRequest): boolean {
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

// ── Input Sanitization ─────────────────────────────────────────

export function sanitizeInput(input: string, maxLength: number = 10000): string {
  return input.replace(/\0/g, '').trim().slice(0, maxLength);
}

export function safeErrorResponse(
  message: string = 'Erreur interne du serveur',
  status: number = 500,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function rateLimitedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: { 'Retry-After': '60' },
    },
  );
}

export function getClientIp(request: NextRequest): string {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0].slice(0, 45);
    }
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim().slice(0, 45);
  }

  return 'unknown';
}

export function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 128;
}
