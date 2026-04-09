import { NextRequest, NextResponse } from 'next/server';
import { generateCsrfToken } from './core/crypto';
import { buildSecurityHeaders } from './core/security-context';

export function applySecurityHeaders(response: NextResponse, isDev: boolean = false): void {
  const headers = buildSecurityHeaders(isDev);
  
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  response.headers.set('X-Powered-By', '');
  response.headers.set('Cache-Control', 'private, no-cache, max-age=0, must-revalidate');
}

export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set('csrf-token', token, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function ensureCsrfToken(request: NextRequest, response: NextResponse): void {
  if (!request.cookies.get('csrf-token')) {
    const token = generateCsrfToken();
    setCsrfCookie(response, token);
  }
}

export function createSecurityMiddlewareResponse(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const isDev = process.env.NODE_ENV === 'development';

  ensureCsrfToken(request, response);
  applySecurityHeaders(response, isDev);

  return response;
}

export function checkRequestSize(request: NextRequest, maxSize: number = 2 * 1024 * 1024): NextResponse | null {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > maxSize) {
    return new NextResponse('Requête trop volumineuse', { status: 413 });
  }
  return null;
}
