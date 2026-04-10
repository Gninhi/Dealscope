import { z } from 'zod';
import { VALID_STATUSES } from '@/constants';
import { idSchema, sirenSchema, safeStringSchema, safeOptionalStringSchema, percentageSchema, positiveNumberSchema } from './schemas';

export const CUID_REGEX = /^[a-z][a-z0-9]{0,24}$/;

export function isValidCuid(id: string): boolean {
  return typeof id === 'string' && CUID_REGEX.test(id) && id.length <= 25;
}

export const createCompanySchema = z.object({
  siren: sirenSchema,
  name: z.string().min(1, 'Nom requis').max(500).trim(),
  legalName: z.string().max(500).trim().optional().default(''),
  sector: z.string().max(100).trim().optional().default(''),
  nafCode: z.string().max(20).trim().optional().default(''),
  address: z.string().max(500).trim().optional().default(''),
  city: z.string().max(200).trim().optional().default(''),
  postalCode: z.string().max(20).trim().optional().default(''),
  region: z.string().max(200).trim().optional().default(''),
  latitude: z.coerce.number().optional().default(0),
  longitude: z.coerce.number().optional().default(0),
  employeeCount: positiveNumberSchema.optional().default(0),
  revenue: positiveNumberSchema.optional().default(0),
  icpScore: percentageSchema.optional().default(0),
  source: z.string().max(50).trim().optional().default('api_gouv'),
  notes: z.string().max(50000).trim().optional().default(''),
});

export const updateCompanySchema = z.object({
  id: idSchema,
  notes: z.string().max(50000).trim().optional(),
  status: z.enum(VALID_STATUSES).optional(),
  icpScore: percentageSchema.optional(),
}).refine(data => Object.keys(data).length >= 2, {
  message: 'Au moins un champ à mettre à jour est requis (id + champ)',
});

export const movePipelineSchema = z.object({
  companyId: idSchema,
  stage: z.enum(VALID_STATUSES),
  notes: z.string().max(50000).trim().optional().default(''),
});

export const scanSchema = z.object({
  query: z.string().max(500).trim().optional().default(''),
  sector: z.string().max(100).trim().optional(),
  icpProfileId: idSchema.optional(),
  model: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const batchEnrichSchema = z.object({
  forceAll: z.boolean().optional().default(false),
});

export const ALLOWED_COMPANY_UPDATE_FIELDS = new Set([
  'notes',
  'icpScore',
  'status',
  'sector',
  'revenue',
  'employeeCount',
  'source',
] as const);

export function isAllowedUpdateField(field: string): boolean {
  return ALLOWED_COMPANY_UPDATE_FIELDS.has(field as any);
}
