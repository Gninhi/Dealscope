import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeInput,
  isValidId,
  generateCsrfToken,
  getClientIp,
} from '../security';

describe('sanitizeInput', () => {
  it('removes null bytes', () => {
    const result = sanitizeInput('hello\0world');
    expect(result).toBe('helloworld');
  });

  it('trims whitespace', () => {
    const result = sanitizeInput('  hello world  ');
    expect(result).toBe('hello world');
  });

  it('truncates to max length', () => {
    const longString = 'a'.repeat(1000);
    const result = sanitizeInput(longString, 10);
    expect(result.length).toBe(10);
  });

  it('handles empty string', () => {
    const result = sanitizeInput('');
    expect(result).toBe('');
  });

  it('handles string with only whitespace', () => {
    const result = sanitizeInput('   ');
    expect(result).toBe('');
  });
});

describe('isValidId', () => {
  it('accepts alphanumeric IDs', () => {
    expect(isValidId('abc123')).toBe(true);
  });

  it('accepts IDs with underscores', () => {
    expect(isValidId('abc_123')).toBe(true);
  });

  it('accepts IDs with dashes', () => {
    expect(isValidId('abc-123')).toBe(true);
  });

  it('accepts cuid format', () => {
    expect(isValidId('cmngkodew0002q9ry0ugw8cpv')).toBe(true);
  });

  it('rejects empty string', () => {
    expect(isValidId('')).toBe(false);
  });

  it('rejects IDs with special characters', () => {
    expect(isValidId('abc@123')).toBe(false);
    expect(isValidId('abc!123')).toBe(false);
    expect(isValidId('abc 123')).toBe(false);
  });

  it('rejects IDs longer than 128 characters', () => {
    const longId = 'a'.repeat(129);
    expect(isValidId(longId)).toBe(false);
  });

  it('accepts IDs up to 128 characters', () => {
    const maxId = 'a'.repeat(128);
    expect(isValidId(maxId)).toBe(true);
  });
});

describe('generateCsrfToken', () => {
  it('generates 64 character hex string', () => {
    const token = generateCsrfToken();
    expect(token.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(token)).toBe(true);
  });

  it('generates unique tokens', () => {
    const token1 = generateCsrfToken();
    const token2 = generateCsrfToken();
    expect(token1).not.toBe(token2);
  });
});

describe('getClientIp', () => {
  it('extracts IP from x-forwarded-for header', () => {
    const mockRequest = {
      headers: {
        get: vi.fn((key: string) => {
          if (key === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1';
          return null;
        }),
      },
      cookies: { get: vi.fn() },
    } as unknown as Parameters<typeof getClientIp>[0];

    const ip = getClientIp(mockRequest);
    expect(ip).toBe('192.168.1.1');
  });

  it('extracts IP from x-real-ip header', () => {
    const mockRequest = {
      headers: {
        get: vi.fn((key: string) => {
          if (key === 'x-forwarded-for') return null;
          if (key === 'x-real-ip') return '10.0.0.1';
          return null;
        }),
      },
      cookies: { get: vi.fn() },
    } as unknown as Parameters<typeof getClientIp>[0];

    const ip = getClientIp(mockRequest);
    expect(ip).toBe('10.0.0.1');
  });

  it('returns unknown when no IP headers', () => {
    const mockRequest = {
      headers: {
        get: vi.fn(() => null),
      },
      cookies: { get: vi.fn() },
    } as unknown as Parameters<typeof getClientIp>[0];

    const ip = getClientIp(mockRequest);
    expect(ip).toBe('unknown');
  });

  it('truncates IP to 45 characters', () => {
    const longIp = 'a'.repeat(100);
    const mockRequest = {
      headers: {
        get: vi.fn((key: string) => {
          if (key === 'x-real-ip') return longIp;
          return null;
        }),
      },
      cookies: { get: vi.fn() },
    } as unknown as Parameters<typeof getClientIp>[0];

    const ip = getClientIp(mockRequest);
    expect(ip.length).toBe(45);
  });
});
