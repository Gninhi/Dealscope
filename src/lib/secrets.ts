import { z } from 'zod';

const secretSchema = z.object({
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

export type AppSecrets = z.infer<typeof secretSchema>;

let validatedSecrets: AppSecrets | null = null;

export function validateSecrets(): AppSecrets {
  if (validatedSecrets) return validatedSecrets;

  const result = secretSchema.safeParse({
    AUTH_SECRET: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    const errors = result.error.issues.map(i => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    console.error('[SECURITY] Invalid secrets configuration:\n' + errors);
    throw new Error('Invalid secrets configuration');
  }

  validatedSecrets = result.data;
  return validatedSecrets;
}

export function getAuthSecret(): string {
  const secrets = validateSecrets();
  return secrets.AUTH_SECRET;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}
