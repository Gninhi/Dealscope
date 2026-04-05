import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware — headers de sécurité et CSP compatibles iframe.
 *
 * Règles critiques pour Z.ai iframe preview :
 *   - frame-ancestors autorise tous les parents (y compris Z.ai)
 *   - PAS de require-trusted-types-for 'script' (casse le JS)
 *   - PAS de HSTS (problématique en dev / iframe)
 *   - PAS de X-Frame-Options (redondant avec frame-ancestors)
 *   - script-src autorise 'unsafe-inline' et 'unsafe-eval' en dev
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const isDev = process.env.NODE_ENV === 'development';

  // ── Content Security Policy ──────────────────────────────────
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";

  response.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: http:",
    "frame-ancestors *", // ← autorise l'iframe Z.ai
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '));

  // ── Autres headers de sécurité (sans X-Frame-Options, sans HSTS) ──
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Powered-By', '');

  // Cache-Control permissif pour éviter les rechargements en boucle en iframe
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
