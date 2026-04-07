// ─── Search Utilities ────────────────────────────────────────────
// Re-exports from company.service for backward compatibility.
// Source of truth: @/lib/services/company.service.ts

export { parseSearchFilters as buildSearchFilters, hasSearchParams } from '@/lib/services/company.service';
