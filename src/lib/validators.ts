/**
 * Core validators shared across the application.
 * Schema definitions specific to domains live in @/validators/.
 * This file contains ONLY schemas not defined elsewhere.
 */

import { z } from 'zod';

// ─── Shared password schema ────────────────────────────────────

export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe trop long')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre');

// ─── PATCH /api/companies schema ────────────────────────────────

export const patchCompanySchema = z.object({
  id: z.string().min(1, 'ID requis'),
  notes: z.string().max(50000).optional(),
  status: z.enum([
    'identifiees',
    'a_contacter',
    'contactees',
    'qualifiees',
    'opportunite',
    'deal',
    'annule',
  ]).optional(),
  icpScore: z.number().min(0).max(100).optional(),
}).refine(data => Object.keys(data).length >= 2, {
  message: 'Au moins un champ à mettre à jour est requis (id + champ)',
});

// ─── Field whitelists ──────────────────────────────────────────
// Single source of truth: defined HERE, imported by services and routes.

export const ALLOWED_COMPANY_UPDATE_FIELDS = new Set([
  'notes',
  'icpScore',
  'status',
  'sector',
  'revenue',
  'employeeCount',
  'source',
]);
