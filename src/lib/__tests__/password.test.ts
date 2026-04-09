import { describe, it, expect, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../password';

describe('password utilities', () => {
  describe('hashPassword', () => {
    it('hashes a password', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('produces different hashes for same password', async () => {
      const password = 'Password123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('produces bcrypt hash format', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      
      expect(hash.startsWith('$2b$')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      
      const result = await verifyPassword(password, hash);
      expect(result).toBe(true);
    });

    it('returns false for incorrect password', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      
      const result = await verifyPassword('WrongPassword123', hash);
      expect(result).toBe(false);
    });

    it('returns false for empty password', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      
      const result = await verifyPassword('', hash);
      expect(result).toBe(false);
    });

    it('handles case sensitivity', async () => {
      const password = 'Password123';
      const hash = await hashPassword(password);
      
      const result = await verifyPassword('password123', hash);
      expect(result).toBe(false);
    });
  });
});
