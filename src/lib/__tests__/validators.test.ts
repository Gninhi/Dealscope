import { describe, it, expect } from 'vitest';
import { passwordSchema, updateCompanySchema, ALLOWED_COMPANY_UPDATE_FIELDS, isAllowedUpdateField } from '../validators';

describe('passwordSchema', () => {
  it('accepts valid password', () => {
    const result = passwordSchema.safeParse('Password123');
    expect(result.success).toBe(true);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = passwordSchema.safeParse('Pass1');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Le mot de passe doit contenir au moins 8 caractères');
    }
  });

  it('rejects password without uppercase', () => {
    const result = passwordSchema.safeParse('password123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Doit contenir au moins une majuscule');
    }
  });

  it('rejects password without lowercase', () => {
    const result = passwordSchema.safeParse('PASSWORD123');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Doit contenir au moins une minuscule');
    }
  });

  it('rejects password without number', () => {
    const result = passwordSchema.safeParse('Password');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Doit contenir au moins un chiffre');
    }
  });

  it('rejects password longer than 128 characters', () => {
    const longPassword = 'A' + 'a'.repeat(127) + '1';
    const result = passwordSchema.safeParse(longPassword);
    expect(result.success).toBe(false);
  });
});

describe('updateCompanySchema', () => {
  it('accepts valid patch with id and notes', () => {
    const result = updateCompanySchema.safeParse({
      id: 'abc123',
      notes: 'Some notes',
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid patch with id and status', () => {
    const result = updateCompanySchema.safeParse({
      id: 'abc123',
      status: 'deal',
    });
    expect(result.success).toBe(true);
  });

  it('rejects patch with only id', () => {
    const result = updateCompanySchema.safeParse({ id: 'abc123' });
    expect(result.success).toBe(false);
  });

  it('rejects patch with invalid status', () => {
    const result = updateCompanySchema.safeParse({
      id: 'abc123',
      status: 'invalid_status',
    });
    expect(result.success).toBe(false);
  });

  it('rejects patch with empty id', () => {
    const result = updateCompanySchema.safeParse({
      id: '',
      notes: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid icpScore', () => {
    const result = updateCompanySchema.safeParse({
      id: 'abc123',
      icpScore: 75,
    });
    expect(result.success).toBe(true);
  });

  it('rejects icpScore below 0', () => {
    const result = updateCompanySchema.safeParse({
      id: 'abc123',
      icpScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects icpScore above 100', () => {
    const result = updateCompanySchema.safeParse({
      id: 'abc123',
      icpScore: 101,
    });
    expect(result.success).toBe(false);
  });
});

describe('ALLOWED_COMPANY_UPDATE_FIELDS', () => {
  it('contains expected fields', () => {
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('notes')).toBe(true);
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('icpScore')).toBe(true);
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('status')).toBe(true);
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('sector')).toBe(true);
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('revenue')).toBe(true);
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('employeeCount')).toBe(true);
    expect(ALLOWED_COMPANY_UPDATE_FIELDS.has('source')).toBe(true);
  });

it('does not contain unexpected fields', () => {
  expect(isAllowedUpdateField('id')).toBe(false);
  expect(isAllowedUpdateField('password')).toBe(false);
  expect(isAllowedUpdateField('email')).toBe(false);
});
});
