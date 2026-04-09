import { SECURITY_CONSTANTS } from './constants';

function getRandomValues(length: number): Uint8Array {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  }
  throw new Error('Web Crypto API not available in this environment');
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateSecureToken(length: number = SECURITY_CONSTANTS.CSRF.TOKEN_LENGTH): string {
  const bytes = getRandomValues(length);
  return uint8ArrayToHex(bytes);
}

export function generateCsrfToken(): string {
  return generateSecureToken(SECURITY_CONSTANTS.CSRF.TOKEN_LENGTH);
}

export function validateTokenConstantTime(tokenA: string, tokenB: string): boolean {
  if (!tokenA || !tokenB) return false;
  if (tokenA.length !== tokenB.length) return false;

  let result = 0;
  for (let i = 0; i < tokenA.length; i++) {
    result |= tokenA.charCodeAt(i) ^ tokenB.charCodeAt(i);
  }
  return result === 0;
}

export function hashWithSalt(data: string, salt: string): string {
  const combined = `${salt}:${data}:${salt}`;
  if (typeof btoa === 'function') {
    return btoa(combined);
  }
  return Buffer.from(combined).toString('base64');
}

export function obfuscateSensitiveValue(value: string): string {
  if (value.length <= 4) return '****';
  return `${value.substring(0, 2)}${'*'.repeat(value.length - 4)}${value.substring(value.length - 2)}`;
}

export function isSecureHash(hash: string): boolean {
  return /^\$2[aby]?\$\d{2}\$.{53}$/.test(hash);
}

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomBytes = getRandomValues(8);
  const random = uint8ArrayToHex(randomBytes);
  return `req_${timestamp}_${random}`;
}
