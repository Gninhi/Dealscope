import { NextRequest, NextResponse } from 'next/server';

// ── Rate Limiter (in-memory, per IP + per key) ──────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blockedUntil?: number; // For exponential backoff on repeated violations
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const MAX_MAP_SIZE = 10000; // Prevent memory exhaustion attacks

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }
  // Prevent map from growing unbounded
  if (rateLimitMap.size > MAX_MAP_SIZE) {
    const entries = Array.from(rateLimitMap.entries());
    entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toDelete = entries.slice(0, entries.length - MAX_MAP_SIZE);
    for (const [key] of toDelete) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limit check — returns true if the request should be blocked.
 * Implements exponential backoff: repeated violations increase the block duration.
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
  const key = ip;

  // Prevent memory exhaustion: reject if too many unique IPs
  if (rateLimitMap.size >= MAX_MAP_SIZE && !rateLimitMap.has(key)) {
    return true; // Silently reject when map is full
  }

  const entry = rateLimitMap.get(key);

  // Check if currently in exponential backoff penalty
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return true;
  }

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;

  if (entry.count > maxRequests) {
    // Exponential backoff: double the penalty window each violation
    const penaltyMs = Math.min(windowMs * Math.pow(2, Math.min(entry.count - maxRequests, 5)), 3600000); // Max 1 hour
    entry.blockedUntil = now + penaltyMs;
    entry.resetAt = now + penaltyMs; // Also reset the window
    return true;
  }

  return false;
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

// ── Request Body Size Limiter ───────────────────────────────────

const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB max request body

/**
 * Check if the request body exceeds the maximum allowed size.
 * Must be called BEFORE request.json() to be effective.
 */
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
 * Uses crypto.getRandomValues which is available in Node.js and modern browsers.
 * No fallback to Math.random() — we require crypto to be available.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  // crypto.getRandomValues is available in Node.js 15+ and all modern browsers
  // This is required — no Math.random fallback for security
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(array);
  } else {
    // Node.js fallback using require('crypto')
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const nodeCrypto = require('crypto');
      const bytes = nodeCrypto.randomBytes(32);
      for (let i = 0; i < 32; i++) {
        array[i] = bytes[i];
      }
    } catch {
      // Absolute last resort — this should never happen in a Node.js environment
      // Log a critical error if we reach this point
      console.error('[SECURITY CRITICAL] crypto.getRandomValues AND require("crypto") unavailable');
      throw new Error('Cryptographic random number generator not available');
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from header against cookie.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateCsrf(request: NextRequest): boolean {
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf-token')?.value;

  if (!headerToken || !cookieToken) return false;

  // Constant-time comparison to prevent timing attacks
  if (headerToken.length !== cookieToken.length) return false;

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }
  return result === 0;
}

// ── Input Sanitization ─────────────────────────────────────────

/**
 * Sanitize a string input: trim whitespace, limit length, remove null bytes.
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  return input
    .replace(/\0/g, '') // Remove null bytes
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a SIREN number: only digits, exactly 9 chars.
 */
export function sanitizeSiren(siren: string): string | null {
  const cleaned = siren.replace(/\D/g, '').slice(0, 9);
  return cleaned.length === 9 ? cleaned : null;
}

// ── Security Headers ─────────────────────────────────────────────

export function getSecurityHeaders(): HeadersInit {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
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

/**
 * Create a safe error response that doesn't leak internal details.
 */
export function safeErrorResponse(
  message: string = 'Erreur interne du serveur',
  status: number = 500,
): NextResponse {
  return NextResponse.json(
    { error: message },
    { status },
  );
}

/**
 * Rate limited response with standard headers.
 */
export function rateLimitedResponse(): NextResponse {
  return NextResponse.json(
    { error: 'Trop de requêtes. Réessayez plus tard.' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    },
  );
}

/**
 * Extract client IP from request headers.
 * Handles X-Forwarded-For, X-Real-IP, and falls back to connection IP.
 */
export function getClientIp(request: NextRequest): string {
  // X-Forwarded-For can contain multiple IPs: client, proxy1, proxy2
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    if (ips.length > 0 && ips[0]) {
      return ips[0].slice(0, 45); // Limit IP length to prevent header injection
    }
  }

  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp.trim().slice(0, 45);
  }

  return 'unknown';
}

/**
 * Validate that an ID parameter looks like a valid UUID/cuid.
 * Prevents injection through URL parameters.
 */
export function isValidId(id: string): boolean {
  // Accept UUIDs, CUIDs, and numeric IDs (at least 1 char)
  return /^[a-zA-Z0-9_-]+$/.test(id) && id.length > 0 && id.length <= 128;
}
