// ─── External API Barrel ─────────────────────────────────────────
// Re-exports all external API client functions from their canonical locations.
// Services import from '@/lib/api' for convenience.

export { searchApiGouv } from '../api-gouv';
export { searchInfoGreffe, getInfoGreffeBySiren, parseInfoGreffeFinancial } from '../infogreffe';
