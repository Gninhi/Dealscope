export const SECURITY_CONSTANTS = {
  RATE_LIMIT: {
    MAX_STORE_SIZE: 10000,
    CLEANUP_INTERVAL_MS: 5 * 60 * 1000,
    DEFAULT_WINDOW_MS: 60 * 1000,
    MAX_PENALTY_MS: 3600000,
    MAX_BACKOFF_EXPONENT: 5,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    SALT_ROUNDS: 12,
    MAX_FAILED_ATTEMPTS: 5,
    BASE_LOCKOUT_MS: 15 * 60 * 1000,
    MAX_LOCKOUT_MINUTES: 240,
  },
  BODY: {
    MAX_SIZE_BYTES: 1024 * 1024,
    MAX_FIELDS_LENGTH: {
      notes: 50000,
      default: 10000,
      name: 500,
      email: 254,
      short: 200,
      tiny: 100,
    },
  },
  CSRF: {
    TOKEN_LENGTH: 32,
  },
  AUDIT: {
    MAX_MESSAGE_LENGTH: 1000,
    MAX_METADATA_SIZE: 50,
  },
  IP: {
    MAX_LENGTH: 45,
  },
  ID: {
    MAX_LENGTH: 128,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
} as const;

export const DANGEROUS_PATTERNS = {
  NULL_BYTE: /\0/g,
  SCRIPT_TAG: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  SQL_INJECTION: /('|"--|;|\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC)\b)/gi,
  PATH_TRAVERSAL: /\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c/gi,
  XSS_EVENT_HANDLERS: /\bon\w+\s*=/gi,
} as const;

export const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'blob:'] as const;

export const SECURITY_HEADERS = {
  CSP_DIRECTIVES: {
    'default-src': "'self'",
    'script-src': "'self' 'unsafe-inline' 'unsafe-eval'",
    'img-src': "'self' data: https: blob:",
    'connect-src': "'self' https: wss:",
    'font-src': "'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai",
    'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com",
    'object-src': "'none'",
    'base-uri': "'self'",
    'form-action': "'self'",
    'frame-ancestors': '*',
  },
  STATIC_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  },
} as const;
