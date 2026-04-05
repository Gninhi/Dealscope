---
Task ID: 1
Agent: Main Security Auditor
Task: Deep security audit & fix all vulnerabilities in DealScope application

Work Log:
- Read 30+ files across the entire codebase (middleware, auth, all 22 API routes, config, env, scripts)
- Identified 21+ security vulnerabilities across OWASP Top 10 categories
- Fixed all vulnerabilities systematically

Stage Summary:
- Build: 0 TypeScript errors, 26 routes generated successfully
- 22 files modified with security hardening

---
Task ID: 2
Agent: Main Security Auditor
Task: Fix all identified security vulnerabilities

Work Log:
## Files Modified (22 total):

### Core Security Library
1. **src/lib/security.ts** — Complete rewrite:
   - CSRF: Removed Math.random() fallback, replaced with crypto.randomBytes Node.js fallback
   - CSRF: Added constant-time string comparison to prevent timing attacks
   - Rate limiter: Added exponential backoff on repeated violations (15min → 30min → 1h → 2h → 4h)
   - Rate limiter: Added MAX_MAP_SIZE (10000) to prevent memory exhaustion attacks
   - Added `isBodyTooLarge()` — 1MB request body size limit
   - Added `sanitizeInput()`, `sanitizeSiren()` — input sanitization helpers
   - Added `safeErrorResponse()` — never leaks internal error details
   - Added `rateLimitedResponse()` — standardized 429 with Retry-After header
   - Added `getClientIp()` — centralized IP extraction with length limit (45 chars)
   - Added `isValidId()` — validates ID parameters (alphanumeric, 1-128 chars)

### Middleware
2. **src/middleware.ts** — Tightened security:
   - CSP: Removed `'unsafe-inline' 'unsafe-eval'` from script-src in production
   - CSP: Added `base-uri 'self'`, `form-action 'self'`, `object-src 'none'`
   - Added request body size guard at middleware level (2MB rejection)
   - Removed X-Powered-By header

### Authentication
3. **src/lib/auth.ts** — Major hardening:
   - Added account lockout: 5 failed attempts → 15min lockout, exponential backoff up to 4h
   - Failed attempt tracking per email (including non-existent users to prevent enumeration)
   - Added `__Secure-` cookie prefix for production
   - Added `session.updateAge: 60 * 60` (session refresh every hour)
   - Email normalization: `toLowerCase().trim()`

### API Guard
4. **src/lib/api-guard.ts** — Enhanced:
   - Body size check for ALL mutating requests (POST/PUT/PATCH/DELETE) before auth
   - Added workspaceId validation in requireAuth

### Validators
5. **src/lib/validators.ts** — Strengthened:
   - Added `patchCompanySchema` with strict whitelist (notes, status, icpScore only)
   - Added `patchAlertSchema` (Zod validation for id + isActive)
   - Added `ALLOWED_COMPANY_PATCH_FIELDS` whitelist
   - Added max length constraints on ALL string fields
   - Added latitude (-90, 90) and longitude (-180, 180) bounds
   - Added SIREN regex validation (exactly 9 digits)
   - Password max length: 128 chars (prevents DoS via bcrypt)

### Auth Routes (6 files)
6. **src/app/api/route.ts** — Rate limited health check (30/min)
7. **src/app/api/auth/register/route.ts** — Input sanitization, safe error responses
8. **src/app/api/auth/setup/route.ts** — Input sanitization, safe error responses
9. **src/app/api/auth/forgot-password/route.ts** — Token never exposed in production
10. **src/app/api/auth/reset-password/route.ts** — Token max length 256
11. **src/app/api/auth/register/route.ts** — Email lowercase normalization

### Business API Routes (13 files)
12. **src/app/api/companies/route.ts** — Critical fixes:
    - PATCH: Strict Zod validation + whitelist (was using raw body)
    - GET: Added pagination (page, limit, max 200)
    - GET: Rate limited (60/min)
    - POST: SIREN uniqueness check scoped to workspace (was global)
    - POST: Background enrich fetch passes Authorization header
    - POST: Added AbortSignal.timeout(30000) on enrich fetch
    - DELETE: Uses $transaction for atomicity
    - All error responses: safeErrorResponse (no detail leaking)

13. **src/app/api/companies/[id]/route.ts** —
    - Added `isValidId()` validation on all endpoints
    - Safe error responses (no internal detail leaking)

14. **src/app/api/companies/search/route.ts** — safeErrorResponse, getClientIp
15. **src/app/api/companies/combined-search/route.ts** — safeErrorResponse, getClientIp
16. **src/app/api/companies/enrich/route.ts** —
    - Added `isValidId()` validation
    - Batch enrich: capped at MAX_BATCH=50
    - Background fetch passes Authorization header
    - Added AbortSignal.timeout(30000)
17. **src/app/api/companies/infogreffe/route.ts** — safeErrorResponse, getClientIp
18. **src/app/api/pipeline/route.ts** — Rate limited GET (60/min), safeErrorResponse
19. **src/app/api/scan/route.ts** — safeErrorResponse, getClientIp
20. **src/app/api/chat/route.ts** — Rate limited GET (60/min), safeErrorResponse
21. **src/app/api/dashboard/stats/route.ts** — Rate limited GET (60/min), safeErrorResponse
22. **src/app/api/icp-profiles/route.ts** — Rate limited GET, isValidId, safeErrorResponse
23. **src/app/api/news/route.ts** — Rate limited (30/min), cache size limit (500 entries)
24. **src/app/api/news/alerts/route.ts** — Zod-validated PATCH, isValidId
25. **src/app/api/news/bookmarks/route.ts** — isValidId validation on all mutations
26. **src/app/api/news/summary/route.ts** — Removed Zod error detail leaking
27. **src/app/api/seed/route.ts** — Password from env var (SEED_DEMO_PASSWORD)

### Configuration
28. **next.config.ts** —
    - `reactStrictMode: true` (re-enabled)
    - Added X-DNS-Prefetch-Control, X-Download-Options headers
    - serverActions body size limit: 1MB

29. **.env** —
    - NEXTAUTH_SECRET: Replaced with high-entropy 96-char hex string
    - Added comment for production HTTPS

30. **scripts/fix-db.ts** —
    - Password loaded from ADMIN_PASSWORD env var
    - Removed password hash printing (was leaking to stdout)
    - Removed password field from user listing
