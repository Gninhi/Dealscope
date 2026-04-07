import { z } from 'zod';

// ─── Auth Validators ─────────────────────────────────────────────

export const registerSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .max(254, 'Email trop long')
    .transform((v) => v.toLowerCase().trim()),
  firstName: z
    .string()
    .min(1, 'Prénom requis')
    .max(100, 'Prénom trop long')
    .transform((v) => v.trim()),
  lastName: z
    .string()
    .min(1, 'Nom requis')
    .max(100, 'Nom trop long')
    .transform((v) => v.trim()),
  password: z
    .string()
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long'),
  companyName: z
    .string()
    .max(200, 'Nom de l\'entreprise trop long')
    .transform((v) => v.trim())
    .optional()
    .default(''),
});

export const setupSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  firstName: z
    .string()
    .min(1, 'Prénom requis')
    .max(100)
    .transform((v) => v.trim()),
  lastName: z
    .string()
    .min(1, 'Nom requis')
    .max(100)
    .transform((v) => v.trim()),
  password: z.string().min(1, 'Mot de passe requis').max(128),
  companyName: z
    .string()
    .max(200)
    .transform((v) => v.trim())
    .optional()
    .default('DealScope'),
});
