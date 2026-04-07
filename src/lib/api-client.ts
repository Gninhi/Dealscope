'use client';

/**
 * DealScope API Client — Secure fetch wrapper
 *
 * Session-based authentication (credentials are sent via httpOnly cookies
 * managed by NextAuth — no API keys exposed in the client bundle).
 *
 * Automatically adds:
 * - X-CSRF-Token header for mutating requests (reads csrf-token cookie)
 *
 * Usage: import { apiFetch } from '@/lib/api-client';
 *        apiFetch('/api/companies')
 *        apiFetch('/api/companies', { method: 'POST', body: JSON.stringify(data) })
 */

function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = (init?.method || 'GET').toUpperCase();

  const headers = new Headers(init?.headers);

  // Add CSRF token for mutating requests
  if (MUTATING_METHODS.has(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  // Set Content-Type for JSON bodies if not specified
  if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    headers,
    // Include cookies for session management
    credentials: 'include',
  });

  // Handle 401 — redirect to login
  if (response.status === 401) {
    // Only redirect on page routes (not API calls that handle 401 themselves)
    if (typeof window !== 'undefined' && !url.startsWith('/api/')) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(
        typeof window !== 'undefined' ? window.location.pathname : '/'
      );
    }
  }

  return response;
}

// ─── Client-side URL Validation ──────────────────────────────────

const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'blob:'];

/**
 * Validate that a URL is safe to use in href/src attributes.
 * Client-side version: blocks javascript:, data:, vbscript: protocols and malformed URLs.
 * Allows relative paths (/, ./, #) in addition to http/https.
 */
export function isClientSafeUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols before URL parsing
  for (const proto of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(proto)) return false;
  }

  try {
    const parsed = new URL(url);
    // Only allow http and https
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    // Not a valid URL — could be a relative path (safe) or garbage
    // Allow relative paths starting with / or ./ but block everything else
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('#');
  }
}

/**
 * Validate a French SIREN number (exactly 9 digits).
 */
export function isValidSiren(siren: string): boolean {
  if (typeof siren !== 'string') return false;
  return /^\d{9}$/.test(siren);
}

/**
 * Convenience: apiFetch with JSON response parsing + error handling.
 */
export async function apiFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await apiFetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const err = JSON.parse(text);
      throw new Error(err.error || `HTTP ${res.status}: ${res.statusText}`);
    } catch {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
  }
  const text = await res.text();
  if (text.startsWith('<!DOCTYPE') || text.startsWith('<html') || text.startsWith('<HTML')) {
    throw new Error('Received HTML instead of JSON');
  }
  return JSON.parse(text) as T;
}
