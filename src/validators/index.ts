// Barrel re-export for all validators
export {
  registerSchema,
  setupSchema,
} from './auth';

export {
  CUID_REGEX,
  isValidCuid,
  createCompanySchema,
  updateCompanySchema,
  movePipelineSchema,
  scanSchema,
  batchEnrichSchema,
} from './company';

export {
  chatMessageSchema,
} from './chat';

export {
  ALERT_TYPES,
  newsSearchSchema,
  searchSchema,
  createAlertSchema,
  updateAlertSchema,
  createBookmarkSchema,
  updateBookmarkSchema,
  newsSummarySchema,
} from './news';

// Re-export shared validators from @/lib/validators
export {
  passwordSchema,
  patchCompanySchema,
  ALLOWED_COMPANY_UPDATE_FIELDS,
  ALLOWED_COMPANY_PATCH_FIELDS,
} from '@/lib/validators';
