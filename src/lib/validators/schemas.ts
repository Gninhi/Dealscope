import { z } from 'zod';
import { SECURITY_CONSTANTS } from '../security/core/constants';

const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  digit: /[0-9]/,
} as const;

export const securePasswordSchema = z.string()
  .min(SECURITY_CONSTANTS.PASSWORD.MIN_LENGTH, `Le mot de passe doit contenir au moins ${SECURITY_CONSTANTS.PASSWORD.MIN_LENGTH} caractères`)
  .max(SECURITY_CONSTANTS.PASSWORD.MAX_LENGTH, `Le mot de passe ne peut pas dépasser ${SECURITY_CONSTANTS.PASSWORD.MAX_LENGTH} caractères`)
  .regex(passwordRegex.uppercase, 'Doit contenir au moins une majuscule')
  .regex(passwordRegex.lowercase, 'Doit contenir au moins une minuscule')
  .regex(passwordRegex.digit, 'Doit contenir au moins un chiffre');

export type PasswordStrength = 'weak' | 'medium' | 'strong' | 'very-strong';

export function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (passwordRegex.uppercase.test(password)) score++;
  if (passwordRegex.lowercase.test(password)) score++;
  if (passwordRegex.digit.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~\\]/.test(password)) score++;
  if (/[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~\\].*[!@#$%^&*()_+\-=\[\]{}|;':",.\/<>?`~\\]/.test(password)) score++;

  if (score <= 3) return 'weak';
  if (score <= 5) return 'medium';
  if (score <= 6) return 'strong';
  return 'very-strong';
}

export const emailSchema = z.string()
  .email('Email invalide')
  .max(SECURITY_CONSTANTS.BODY.MAX_FIELDS_LENGTH.email)
  .transform(email => email.toLowerCase().trim());

export const nameSchema = z.string()
  .min(1, 'Ce champ est requis')
  .max(SECURITY_CONSTANTS.BODY.MAX_FIELDS_LENGTH.tiny)
  .transform(name => name.trim());

export const notesSchema = z.string()
  .max(SECURITY_CONSTANTS.BODY.MAX_FIELDS_LENGTH.notes)
  .optional()
  .default('')
  .transform(notes => notes.trim());

export const idSchema = z.string()
  .min(1, 'ID requis')
  .max(SECURITY_CONSTANTS.ID.MAX_LENGTH)
  .regex(SECURITY_CONSTANTS.ID.PATTERN, 'ID invalide');

export const sirenSchema = z.string()
  .length(9, 'Le SIREN doit contenir exactement 9 caractères')
  .regex(/^\d{9}$/, 'Le SIREN doit contenir uniquement des chiffres');

export const siretSchema = z.string()
  .length(14, 'Le SIRET doit contenir exactement 14 caractères')
  .regex(/^\d{14}$/, 'Le SIRET doit contenir uniquement des chiffres');

export const postalCodeSchema = z.string()
  .regex(/^\d{5}$/, 'Code postal invalide')
  .optional()
  .or(z.literal(''));

export const urlSchema = z.string()
  .url('URL invalide')
  .max(2000)
  .optional()
  .or(z.literal(''));

export const positiveNumberSchema = z.number()
  .min(0, 'La valeur doit être positive')
  .max(Number.MAX_SAFE_INTEGER);

export const percentageSchema = z.number()
  .min(0, 'Le pourcentage doit être entre 0 et 100')
  .max(100, 'Le pourcentage doit être entre 0 et 100');

export const safeStringSchema = (maxLength: number = 500) => z.string()
  .max(maxLength)
  .trim();

export const safeOptionalStringSchema = (maxLength: number = 500) => z.string()
  .max(maxLength)
  .trim()
  .optional()
  .default('')
  .transform(s => s ?? '');

export function createSafeEnumSchema<T extends readonly string[]>(values: T) {
  return z.enum(values);
}
