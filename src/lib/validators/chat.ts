import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message requis').max(4000).trim(),
  model: z.string().max(100).optional(),
});

export const chatHistorySchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});
