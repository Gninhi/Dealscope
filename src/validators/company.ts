// ─── CUID Validator ───────────────────────────────────────────────
// CUID: starts with a letter, alphanumeric, max 25 characters
export const CUID_REGEX = /^[a-z][a-z0-9]{0,24}$/;
export function isValidCuid(id: string): boolean {
  return typeof id === 'string' && CUID_REGEX.test(id) && id.length <= 25;
}

// ─── Company Validators ──────────────────────────────────────────

import { z } from 'zod';
import { VALID_STATUSES } from '@/constants';

export const createCompanySchema = z.object({
  siren: z.string().min(9, 'SIREN requis (9 caractères)').max(9),
  name: z.string().min(1, 'Nom requis'),
  legalName: z.string().optional().default(''),
  sector: z.string().optional().default(''),
  nafCode: z.string().optional().default(''),
  address: z.string().optional().default(''),
  city: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  region: z.string().optional().default(''),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  employeeCount: z.string().optional().default(''),
  revenue: z.number().optional().default(0),
  icpScore: z.number().min(0).max(100).optional().default(0),
  source: z.string().optional().default('api_gouv'),
  notes: z.string().max(50000).optional(),
});

export const updateCompanySchema = z.object({
  notes: z.string().optional(),
  icpScore: z.number().min(0).max(100).optional(),
  status: z.enum(VALID_STATUSES).optional(),
  sector: z.string().optional(),
  revenue: z.number().optional(),
  employeeCount: z.string().optional(),
  source: z.string().optional(),
});

// ALLOWED_COMPANY_UPDATE_FIELDS is now the single source of truth in
// @/lib/services/company.service.ts — re-exported via @/lib/services/index.ts
// Avoid duplicating this constant here to prevent drift.

// ─── Pipeline Validators ─────────────────────────────────────────

export const movePipelineSchema = z.object({
  companyId: z.string().min(1, 'companyId requis'),
  stage: z.enum(VALID_STATUSES),
  notes: z.string().optional().default(''),
});

// ─── Scan Validators ─────────────────────────────────────────────

export const scanSchema = z.object({
  query: z.string().optional().default(''),
  sector: z.string().optional(),
  region: z.string().optional(),
  employeeRange: z.string().optional(),
  icpProfileId: z.string().optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

// ─── Batch Enrich Validators ─────────────────────────────────────

export const batchEnrichSchema = z.object({
  forceAll: z.boolean().optional().default(false),
});
