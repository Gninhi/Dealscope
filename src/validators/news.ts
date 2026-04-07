import { z } from 'zod';

// ─── News Validators ─────────────────────────────────────────────

export const ALERT_TYPES = ['keyword', 'sector', 'company'] as const;

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

export const searchSchema = z.object({
  q: z.string().min(1, 'Requête requise'),
  page: z.number().int().min(1).optional().default(1),
  per_page: z.number().int().min(1).max(25).optional().default(10),
});

export const createAlertSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  type: z.enum(ALERT_TYPES),
  keywords: z.array(z.string()).optional().default([]),
  sector: z.string().optional().default(''),
  companyId: z.string().optional(),
});

export const updateAlertSchema = z.object({
  id: z.string().min(1),
  isActive: z.boolean().optional(),
});

export const createBookmarkSchema = z.object({
  articleId: z.string().min(1, 'Article ID requis'),
  notes: z.string().max(500).optional().default(''),
});

export const updateBookmarkSchema = z.object({
  id: z.string().min(1, 'Bookmark ID requis'),
  notes: z.string().max(500).optional(),
});

export const newsSummarySchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200),
  snippet: z.string().max(1000).optional().default(''),
});
