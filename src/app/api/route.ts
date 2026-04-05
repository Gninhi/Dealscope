import { NextResponse } from "next/server";
import { isRateLimited, rateLimitedResponse } from '@/lib/security';

// GET /api - health check (rate limited to prevent abuse)
export async function GET(request: Request) {
  // Rate limit health checks to prevent information disclosure abuse
  const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(clientIp, 30, 60 * 1000)) {
    return rateLimitedResponse();
  }

  return NextResponse.json({ status: 'ok' });
}
