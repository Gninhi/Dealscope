import { z } from 'zod';
import { idSchema } from './schemas';

export const ALERT_TYPES = ['keyword', 'sector', 'company'] as const;

export const newsSearchSchema = z.object({
  q: z.string().min(1, 'Requête requise').max(500).trim(),
  page: z.number().int().min(1).max(1000).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export const createAlertSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100).trim(),
  type: z.enum(ALERT_TYPES),
  keywords: z.array(z.string().max(100).trim()).optional().default([]),
  sector: z.string().max(100).trim().optional().default(''),
  companyId: idSchema.optional(),
});

export const updateAlertSchema = z.object({
  id: idSchema,
  isActive: z.boolean().optional(),
});

export const createBookmarkSchema = z.object({
  articleId: z.string().min(1, 'Article ID requis').max(200).trim(),
  notes: z.string().max(500).trim().optional().default(''),
});

export const updateBookmarkSchema = z.object({
  id: idSchema,
  notes: z.string().max(500).trim().optional(),
});

export const newsSummarySchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200).trim(),
  snippet: z.string().max(1000).trim().optional().default(''),
});
