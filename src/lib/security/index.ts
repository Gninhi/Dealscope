export * from './core';
export * from './guards';
export * from './middleware-helpers';

export { extractClientIp as getClientIp } from './core/security-context';
export { validateCsrfToken as validateCsrf } from './core/security-context';
export { isRateLimited } from './core/rate-limiter';
export { createRateLimitResponse as rateLimitedResponse, createErrorResponse as safeErrorResponse } from './core/security-check';
export { sanitizeString as sanitizeInput, sanitizeId } from './core/sanitizer';
export { generateCsrfToken } from './core/crypto';

export function isValidId(id: string | null | undefined): boolean {
  if (!id) return false;
  const sanitized = id.trim();
  if (sanitized.length === 0 || sanitized.length > 128) return false;
  return /^[a-zA-Z0-9_-]+$/.test(sanitized);
}
