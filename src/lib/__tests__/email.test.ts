import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendEmail, isEmailConfigured, sendResetPasswordEmail, sendWelcomeEmail } from '../email';

vi.mock('../../../vitest.setup', () => ({}));

describe('email utilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('isEmailConfigured', () => {
    it('returns true in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = isEmailConfigured();
      expect(result).toBe(true);
    });
  });

  describe('sendEmail', () => {
    it('returns true in development mode (console logging)', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
      });
      
      expect(result).toBe(true);
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('sends reset password email in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await sendResetPasswordEmail({
        email: 'test@example.com',
        resetToken: 'abc123token',
        firstName: 'Test',
      });
      
      expect(result).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('sends welcome email in development', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      const result = await sendWelcomeEmail({
        email: 'test@example.com',
        firstName: 'Test',
      });
      
      expect(result).toBe(true);
    });
  });
});
