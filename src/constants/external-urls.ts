export const EXTERNAL_URLS = {
  ANNUAIRE_ENTREPRISES: 'https://annuaire-entreprises.data.gouv.fr/entreprise',
  INFOGREFFE: 'https://www.datainfogreffe.fr',
  API_GOUV_SEARCH: process.env.API_GOUV_BASE_URL || 'https://recherche-entreprises.api.gouv.fr/search',
  INFOGREFFE_API: process.env.INFOGREFFE_API_URL || 'https://opendata.datainfogreffe.fr/api/explore/v2.1/catalog/datasets/chiffres-cles-2024/records',
  NVIDIA_NIM_API: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
  RESEND_API: 'https://api.resend.com/emails',
} as const;

export const APP_URLS = {
  BASE_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  RESET_PASSWORD_PATH: '/auth/reset-password',
  LOGIN_PATH: '/login',
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 200,
  CHAT_HISTORY_LIMIT: 100,
  CHAT_HISTORY_MAX: 200,
  COMPANIES_LIMIT: 100,
  COMPANIES_MAX: 200,
} as const;

export const TIMEOUTS = {
  API_GOUV_MS: 15_000,
  INFOGREFFE_MS: 10_000,
  NVIDIA_NIM_MS: 60_000,
  EMAIL_MS: 10_000,
  DEFAULT_API_MS: 30_000,
  RSS_FEED_MS: 10_000,
} as const;
