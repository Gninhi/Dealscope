'use client';

import { DANGEROUS_PROTOCOLS } from '@/lib/security/core/constants';

function getCSRFToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input.toString();
  const method = (init?.method || 'GET').toUpperCase();

  const headers = new Headers(init?.headers);

  if (MUTATING_METHODS.has(method)) {
    const csrfToken = getCSRFToken();
    if (csrfToken) {
      headers.set('X-CSRF-Token', csrfToken);
    }
  }

  if (init?.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    if (typeof window !== 'undefined' && !url.startsWith('/api/')) {
      window.location.href = '/login?callbackUrl=' + encodeURIComponent(window.location.pathname);
    }
  }

  return response;
}

export function isClientSafeUrl(url: string): boolean {
  if (typeof url !== 'string' || !url.trim()) return false;
  const trimmed = url.trim().toLowerCase();

  for (const proto of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(proto)) return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return url.startsWith('/') || url.startsWith('./') || url.startsWith('#');
  }
}

export function isValidSiren(siren: string): boolean {
  if (typeof siren !== 'string') return false;
  return /^\d{9}$/.test(siren);
}

export async function apiFetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit
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
