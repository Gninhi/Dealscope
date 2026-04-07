import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from '@/lib/security';

/**
 * Middleware — security headers and CSP compatible with iframe embedding.
 *
 * Critical rules for Z.ai iframe preview:
 *   - frame-ancestors allows all parents (including Z.ai)
 *   - NO require-trusted-types-for 'script' (breaks JS)
 *   - NO HSTS in dev (problematic for iframe / dev)
 *   - X-Frame-Options kept for older browsers alongside frame-ancestors CSP
 *   - script-src allows 'unsafe-inline' and 'unsafe-eval' in dev
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === 'development';

  // ── CSRF Token Cookie (double-submit pattern) ─────────────
  // Set csrf-token cookie if it doesn't exist, so client-side
  // apiFetch can read it and send it as X-CSRF-Token header.
  if (!request.cookies.get('csrf-token')) {
    const token = generateCsrfToken();
    response.cookies.set('csrf-token', token, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // JS needs to read this cookie
      secure: process.env.NODE_ENV === 'production',
    });
  }

  // ── Content Security Policy ──────────────────────────────────
  // NOTE: 'unsafe-inline' is required in both dev and production because
  // Next.js injects inline scripts/styles at runtime for HMR, RSC payloads,
  // and styled-jsx. Nonce-based CSP is possible but requires significant
  // Next.js config changes (experimental.cspNonce) which is out of scope here.
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'self' https://*.z.ai https://z.ai http://localhost:3000",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '));

  // ── Security headers ──────────────────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Powered-By', '');

  // X-Frame-Options for older browsers (alongside frame-ancestors CSP above)
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // Strict-Transport-Security — NOT in development (breaks iframe / HTTP)
  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }

  // Cache-Control: no-cache for dynamic pages (static assets excluded by matcher)
  response.headers.set('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');

  // Taille maximale des requêtes (défense en profondeur)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
    return new NextResponse('Request too large', { status: 413 });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
