import { z } from 'zod';

export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message requis').max(4000),
  conversationId: z.string().optional(),
});
