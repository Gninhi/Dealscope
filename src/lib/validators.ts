/**
 * Input validators for all DealScope API routes.
 * Uses Zod for runtime type checking and sanitization.
 */

import { z } from 'zod';

// ─── Company validators ───────────────────────────────────────

export const createCompanySchema = z.object({
  siren: z.string()
    .regex(/^\d{9}$/, 'SIREN doit contenir exactement 9 chiffres')
    .min(9, 'SIREN requis (9 caractères)')
    .max(9),
  name: z.string().min(1, 'Nom requis').max(500, 'Nom trop long'),
  legalName: z.string().max(500).optional().default(''),
  sector: z.string().max(100).optional().default(''),
  nafCode: z.string().max(20).optional().default(''),
  address: z.string().max(500).optional().default(''),
  city: z.string().max(200).optional().default(''),
  postalCode: z.string().max(20).optional().default(''),
  region: z.string().max(200).optional().default(''),
  latitude: z.number().min(-90).max(90).optional().default(0),
  longitude: z.number().min(-180).max(180).optional().default(0),
  employeeCount: z.string().max(50).optional().default(''),
  revenue: z.number().min(0).optional().default(0),
  icpScore: z.number().min(0).max(100).optional().default(0),
  source: z.string().max(50).optional().default('api_gouv'),
});

export const updateCompanySchema = z.object({
  notes: z.string().max(50000).optional(),
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
  sector: z.string().max(100).optional(),
  revenue: z.number().min(0).optional(),
  employeeCount: z.string().max(50).optional(),
  source: z.string().max(50).optional(),
});

// PATCH /api/companies — stricter schema with only allowed fields
export const patchCompanySchema = z.object({
  id: z.string().min(1, 'ID requis'),
  notes: z.string().max(50000).optional(),
  status: z.enum([
    'identified',
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

// Whitelist of fields allowed for PATCH /api/companies
export const ALLOWED_COMPANY_PATCH_FIELDS = new Set([
  'notes',
  'status',
  'icpScore',
]);

// ─── Pipeline validators ──────────────────────────────────────

const VALID_PIPELINE_STAGES = [
  'identifiees',
  'a_contacter',
  'contactees',
  'qualifiees',
  'opportunite',
  'deal',
  'annule',
] as const;

export const movePipelineSchema = z.object({
  companyId: z.string().min(1, 'companyId requis'),
  newStage: z.enum(VALID_PIPELINE_STAGES, { message: 'Étape de pipeline invalide' }),
  notes: z.string().max(10000).optional().default(''),
});

// ─── Scan validators ──────────────────────────────────────────

export const scanSchema = z.object({
  query: z.string().max(500).optional().default(''),
  sector: z.string().max(100).optional(),
  region: z.string().max(200).optional(),
  employeeRange: z.string().max(50).optional(),
  icpProfileId: z.string().max(128).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
}).refine(
  (data) => (data.query?.trim().length ?? 0) > 0 || (data.sector?.trim().length ?? 0) > 0,
  { message: 'Query ou secteur requis', path: ['query'] },
);

// ─── Chat validators ──────────────────────────────────────────

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message requis').max(5000, 'Message trop long (max 5000 caractères)'),
  conversationId: z.string().max(128).optional(),
});

// ─── ICP Profile validators ───────────────────────────────────

export const createIcpProfileSchema = z.object({
  name: z.string().min(1, 'Nom du profil requis').max(100),
  criteria: z.record(z.string(), z.unknown()).optional().default({}),
  weights: z.record(z.string(), z.unknown()).optional().default({}),
});

export const updateIcpProfileSchema = z.object({
  id: z.string().min(1, 'ID du profil requis'),
  name: z.string().min(1, 'Nom du profil requis').max(100).optional(),
  criteria: z.record(z.string(), z.unknown()).optional(),
  weights: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// ─── News Alert validators ────────────────────────────────────

export const createAlertSchema = z.object({
  name: z.string().min(1, "Nom de l'alerte requis").max(200),
  type: z.enum(['keyword', 'sector', 'company']).default('keyword'),
  keywords: z.array(z.string().max(200)).max(50).optional().default([]),
  sector: z.string().max(100).optional().default(''),
  companyId: z.string().max(128).optional(),
});

// PATCH /api/news/alerts — proper validation
export const patchAlertSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  isActive: z.boolean(),
});

// ─── News Bookmark validators ─────────────────────────────────

export const createBookmarkSchema = z.object({
  articleId: z.string().min(1, 'Article ID requis').max(128),
  notes: z.string().max(50000).optional().default(''),
});

export const updateBookmarkSchema = z.object({
  id: z.string().min(1, 'Bookmark ID requis').max(128),
  notes: z.string().max(50000).optional(),
});

// ─── News Search validators ───────────────────────────────────

export const newsSearchSchema = z.object({
  q: z.string().min(1, 'Requête requise').max(500),
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
  q: z.string().min(1, 'Requête requise').max(500),
  page: z.number().int().min(1).max(100).optional().default(1),
  per_page: z.number().int().min(1).max(25).optional().default(10),
});

// ─── News Summary validators ──────────────────────────────────

export const newsSummarySchema = z.object({
  title: z.string().min(1, 'Titre requis').max(1000),
  snippet: z.string().max(5000).optional().default(''),
});
