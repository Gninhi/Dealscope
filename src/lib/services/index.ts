// ─── Services Barrel Export ──────────────────────────────────────
// Centralized export for all service modules.

export {
  // News service
  fetchNews,
  getDemoNews,
  CATEGORIES as NEWS_CATEGORIES,
  QUERIES as NEWS_QUERIES,
  RSS_FEEDS as NEWS_RSS_FEEDS,
  categorize,
  getSourceTier,
  dedup,
  sanitizeDecodedHtml,
  type NewsItem,
  type NewsCategory,
  type FetchNewsResult,
} from './news.service';

export {
  // Enrich service
  enrichCompany,
  batchEnrich,
  checkBatchCooldown,
  markBatchEnrichTime,
  MAX_BATCH_SIZE,
  BATCH_COOLDOWN_MS,
  type BatchEnrichResult,
} from './enrich.service';

export {
  // Scan service
  executeScan,
  type ScanInput,
  type ScanResult,
} from './scan.service';

export {
  // Company service
  parseSearchFilters,
  hasSearchParams,
  ALLOWED_COMPANY_UPDATE_FIELDS as COMPANY_ALLOWED_UPDATE_FIELDS,
  VALID_STATUSES_SET,
} from './company.service';
