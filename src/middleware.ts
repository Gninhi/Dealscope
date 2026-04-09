import { NextRequest, NextResponse } from 'next/server';
import { createSecurityMiddlewareResponse, checkRequestSize } from '@/lib/security/middleware-helpers';

export function middleware(request: NextRequest) {
  const sizeCheck = checkRequestSize(request, 2 * 1024 * 1024);
  if (sizeCheck) return sizeCheck;

  return createSecurityMiddlewareResponse(request);
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
