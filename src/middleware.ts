import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, generateCsrfToken } from '@/lib/security';

// In Next.js 16, middleware is deprecated in favor of "proxy".
// We keep it ONLY for security headers (CSP, HSTS, CSRF cookie).
// Auth protection is handled client-side via useSession() in page.tsx.
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  const securityHeaders = getSecurityHeaders();
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }

  // Content Security Policy
  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
  ].join('; '));

  // Strict Transport Security
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // X-XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // CSRF token as cookie (double-submit pattern)
  const existingCsrf = request.cookies.get('csrf-token')?.value;
  if (!existingCsrf) {
    const csrfToken = generateCsrfToken();
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
