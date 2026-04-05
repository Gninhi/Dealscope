import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, generateCsrfToken } from '@/lib/security';

// Security middleware: CSP, HSTS, CSRF cookie, request size guard.
// Auth protection is handled by requireAuth() on API routes
// and useSession() client-side on pages.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Content Security Policy — tightened for production
  // Note: 'unsafe-inline' for styles is required by Tailwind/shadcn at build time
  // In production, nonce-based CSP should be used instead
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'" // Dev needs eval for HMR
    : "'self'"; // Production: strict CSP

  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "require-trusted-types-for 'script'",
  ].join('; '));

  // Strict Transport Security
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-XSS Protection (legacy, but helps older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Remove server identification
  response.headers.set('X-Powered-By', '');

  // CSRF token as cookie (double-submit pattern)
  const existingCsrf = request.cookies.get('csrf-token')?.value;
  if (!existingCsrf) {
    const csrfToken = generateCsrfToken();
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false, // Required for double-submit pattern (JS must read it)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  // Block requests with suspiciously large Content-Length headers
  // (defense in depth — actual enforcement happens in route handlers)
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
