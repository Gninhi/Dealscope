/**
 * Input validators for all DealScope API routes.
 * Uses Zod for runtime type checking and sanitization.
 */

import { z } from 'zod';

// ─── Company validators ───────────────────────────────────────

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
});

export const updateCompanySchema = z.object({
  notes: z.string().optional(),
  icpScore: z.number().min(0).max(100).optional(),
  status: z.enum([
    'identified',
    'a_contacter',
    'contactees',
    'qualifiees',
    'opportunite',
    'deal',
    'annule',
  ]).optional(),
  sector: z.string().optional(),
  revenue: z.number().optional(),
  employeeCount: z.string().optional(),
  source: z.string().optional(),
});

// Whitelist of fields allowed for PUT /api/companies/[id]
export const ALLOWED_COMPANY_UPDATE_FIELDS = new Set([
  'notes',
  'icpScore',
  'status',
  'sector',
  'revenue',
  'employeeCount',
  'source',
]);

// ─── Pipeline validators ──────────────────────────────────────

const VALID_STAGES = [
  'identified',
  'a_contacter',
  'contactees',
  'qualifiees',
  'opportunite',
  'deal',
  'annule',
] as const;

export const movePipelineSchema = z.object({
  companyId: z.string().min(1, 'companyId requis'),
  stage: z.enum(VALID_STAGES),
  notes: z.string().optional().default(''),
});

// ─── Scan validators ──────────────────────────────────────────

export const scanSchema = z.object({
  query: z.string().optional().default(''),
  sector: z.string().optional(),
  region: z.string().optional(),
  employeeRange: z.string().optional(),
  icpProfileId: z.string().optional(),
});

// ─── Chat validators ──────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message requis').max(4000),
  conversationId: z.string().optional(),
});

// ─── ICP Profile validators ───────────────────────────────────

export const createIcpProfileSchema = z.object({
  name: z.string().min(1, 'Nom du profil requis').max(100),
  criteria: z.record(z.string(), z.unknown()).optional().default({}),
  weights: z.record(z.string(), z.unknown()).optional().default({}),
});

// ─── News validators ──────────────────────────────────────────

export const newsSearchSchema = z.object({
  q: z.string().min(1, 'Requête requise'),
  type: z.enum([
    'all',
    'ma',
    'funding',
    'leadership',
    'financial',
    'regulatory',
    'expansion',
  ]).optional().default('all'),
});

// ─── Search validators ────────────────────────────────────────

export const searchSchema = z.object({
  q: z.string().min(1, 'Requête requise'),
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(25).optional().default(10),
});
