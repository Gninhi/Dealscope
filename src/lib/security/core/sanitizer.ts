import { DANGEROUS_PATTERNS, DANGEROUS_PROTOCOLS, SECURITY_CONSTANTS } from './constants';
import type { SanitizationOptions } from './types';

const MAX_DEPTH = 10;

function deepSanitize(value: unknown, depth: number = 0, options: SanitizationOptions = {}): unknown {
  if (depth > MAX_DEPTH) {
    return '[MAX_DEPTH_EXCEEDED]';
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return sanitizeString(value, options);
  }

  if (Array.isArray(value)) {
    return value.map(item => deepSanitize(item, depth + 1, options));
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const sanitizedKey = sanitizeString(key, { maxLength: 100 });
      if (sanitizedKey && typeof sanitizedKey === 'string') {
        sanitized[sanitizedKey] = deepSanitize(val, depth + 1, options);
      }
    }
    return sanitized;
  }

  return value;
}

export function sanitizeString(input: string, optionsOrMaxLength?: SanitizationOptions | number): string {
  if (typeof input !== 'string') {
    return '';
  }

  const options: SanitizationOptions = typeof optionsOrMaxLength === 'number'
    ? { maxLength: optionsOrMaxLength }
    : optionsOrMaxLength || {};

  let sanitized = input;

  if (options.stripNullBytes !== false) {
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.NULL_BYTE, '');
  }

  if (!options.allowHtml) {
    sanitized = sanitized
      .replace(DANGEROUS_PATTERNS.SCRIPT_TAG, '')
      .replace(DANGEROUS_PATTERNS.XSS_EVENT_HANDLERS, '')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  if (options.escapeQuotes) {
    sanitized = sanitized
      .replace(/'/g, "''")
      .replace(/"/g, '&quot;');
  }

  if (options.strictMode) {
    sanitized = sanitized.replace(/[^\w\s\-.,!?@:()]/g, '');
  }

  sanitized = sanitized.trim();

  const maxLength = options.maxLength ?? SECURITY_CONSTANTS.BODY.MAX_FIELDS_LENGTH.default;
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: SanitizationOptions = {}
): Partial<T> {
  return deepSanitize(obj, 0, options) as Partial<T>;
}

export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return '';
  const sanitized = email.toLowerCase().trim();
  if (sanitized.length > SECURITY_CONSTANTS.BODY.MAX_FIELDS_LENGTH.email) {
    return '';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return '';
  }
  return sanitized;
}

export function sanitizeId(id: string): string {
  if (typeof id !== 'string') return '';
  const sanitized = id.trim();
  if (sanitized.length === 0 || sanitized.length > SECURITY_CONSTANTS.ID.MAX_LENGTH) {
    return '';
  }
  if (!SECURITY_CONSTANTS.ID.PATTERN.test(sanitized)) {
    return '';
  }
  return sanitized;
}

export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim().toLowerCase();

  for (const proto of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(proto)) {
      return '';
    }
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return url.trim();
  } catch {
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('#')) {
      return url.trim();
    }
    return '';
  }
}

export function detectSqlInjection(input: string): boolean {
  if (typeof input !== 'string') return false;
  const normalized = input.toLowerCase();
  return DANGEROUS_PATTERNS.SQL_INJECTION.test(normalized);
}

export function detectPathTraversal(input: string): boolean {
  if (typeof input !== 'string') return false;
  return DANGEROUS_PATTERNS.PATH_TRAVERSAL.test(input);
}

export function detectXss(input: string): boolean {
  if (typeof input !== 'string') return false;
  return (
    DANGEROUS_PATTERNS.SCRIPT_TAG.test(input) ||
    DANGEROUS_PATTERNS.XSS_EVENT_HANDLERS.test(input) ||
    /<[^>]*>/.test(input)
  );
}

export function sanitizeForLog(input: string): string {
  return input
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '')
    .slice(0, 1000);
}

export function sanitizeFieldName(name: string): string {
  if (typeof name !== 'string') return '';
  return name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 64);
}
