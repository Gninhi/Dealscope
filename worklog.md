# DealScope — Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: Analyse exhaustive du projet, refactoring complet, élimination des codes morts et doublons, renforcement sécurité

Work Log:
- Lecture complète de tous les fichiers sources (~80+ fichiers)
- Identification de 3 fichiers critiques manquants (api-guard.ts, search-utils.ts, DashboardStats type)
- Identification de ~1000 lignes de code dupliqué à supprimer
- Identification de 7 fichiers morts/redondants à supprimer
- Création de `src/lib/api-guard.ts` (requireAuth + requireAdmin)
- Création de `src/lib/search-utils.ts` (barrel vers company.service)
- Correction du type SessionUser dans api-guard.ts
- Nettoyage de `src/lib/validators.ts` (suppression des doublons avec src/validators/)
- Correction du barrel `src/validators/index.ts` (ré-exports consolidés)
- Correction du barrel `src/types/index.ts` (suppression références PIPELINE_STAGES)
- Refactoring de `/api/news/route.ts` (440 lignes → ~50 lignes, délégation à news.service)
- Refactoring de `/api/companies/enrich/route.ts` (délegation à enrich.service)
- Refactoring de `/api/scan/route.ts` (délegation à scan.service)
- Suppression de 7 fichiers morts: csrf-client.ts, ai.service.ts, pipeline.service.ts, dashboard.service.ts, examples/, serial-proxy.cjs, server-wrapper.cjs
- Simplification de `services/index.ts` (retraits des exports supprimés)
- Remplacement de `fetchWithCsrf` → `apiFetch` dans ProfileSection.tsx
- Simplification de `workspace.ts` (fusion getWorkspace/ensureWorkspace)
- Renforcement sécurité dans next.config.ts (headers CORS, Access-Control)
- Vérification build: ✅ 28/28 pages compilées avec succès

Stage Summary:
- Projet passe de BROKEN à BUILDING SUCCESS
- ~1200 lignes de code dupliqué éliminées
- 7 fichiers morts supprimés
- Architecture modulaire clarifiée (types vs constants vs validators vs services)
- Toute la fonctionnalité existante préservée

---
Task ID: 2
Agent: Sub-agent (dead UI cleanup)
Task: Delete ALL dead/unused shadcn/ui component files and unnecessary barrel re-exports

Work Log:
- Inventoried /src/components/ui/ — found 49 component files total
- Verified only 5 files are actively used: alert-dialog.tsx, button.tsx, input.tsx, label.tsx, confirm-dialog.tsx
- Deleted 44 dead shadcn/ui component files: alert, sidebar, command, dropdown-menu, chart, separator, context-menu, toaster, tooltip, toggle-group, switch, input-otp, avatar, textarea, navigation-menu, collapsible, hover-card, tabs, accordion, select, progress, sheet, card, resizable, slider, breadcrumb, scroll-area, badge, radio-group, aspect-ratio, checkbox, dialog, popover, calendar, drawer, skeleton, toggle, carousel, sonner, menubar, toast, table, pagination, form
- Read /src/types/index.ts — confirmed it only re-exports from @/lib/types (no added value)
- Read /src/lib/search-utils.ts — confirmed it only re-exports from @/lib/services/company.service (no added value)
- Deleted both barrel re-export files

Stage Summary:
- /src/components/ui/ reduced from 49 files → 5 files (alert-dialog, button, input, label, confirm-dialog)
- 2 barrel re-export files removed (types/index.ts, lib/search-utils.ts)
- Total: 46 files deleted
- Remaining consumers of the 5 kept files unaffected

---
Task ID: 3
Agent: Sub-agent (duplicate code patterns)
Task: Fix ALL duplicate code patterns across the project

Work Log:
- Fixed ALLOWED_COMPANY_UPDATE_FIELDS duplication: removed definition from src/lib/validators.ts, kept single source of truth in src/lib/services/company.service.ts, re-exported for backward compat
- Removed ALLOWED_COMPANY_PATCH_FIELDS from validators.ts (subset of UPDATE_FIELDS, now using UPDATE_FIELDS directly in companies/route.ts)
- Updated src/app/api/companies/route.ts to use ALLOWED_COMPANY_UPDATE_FIELDS instead of removed ALLOWED_COMPANY_PATCH_FIELDS
- Updated src/app/api/companies/[id]/route.ts — already imported from @/lib/validators, continues to work via re-export
- Fixed getPasswordStrength duplication: deleted local function from ProfileSection.tsx, imported from @/components/auth/password-strength
- Fixed formatDate duplication: deleted local function from ProfileSection.tsx, imported from @/lib/utils (already imported cn)
- Removed dead validator schemas: deleted registerSchema and setupSchema from src/validators/auth.ts (API routes define their own)
- Removed dead searchSchema from src/validators/news.ts (never imported anywhere)
- Kept updateAlertSchema in news.ts (now imported by alerts route)
- Updated src/validators/index.ts: removed re-exports of registerSchema, setupSchema, searchSchema, ALLOWED_COMPANY_PATCH_FIELDS
- Fixed CheckIcon SVG duplication in SearchTab.tsx: added Check to lucide-react imports, replaced CheckIcon usage, deleted function definition
- Fixed CheckIcon SVG duplication in CompanyProfileDialog.tsx: added Check to lucide-react imports, replaced CheckIcon usage, deleted function definition
- Fixed Trash2Icon SVG duplication in CompanyProfileDialog.tsx: added Trash2 to lucide-react imports, replaced Trash2Icon usage, deleted function definition
- Fixed duplicate batchEnrichSchema: imported from @/validators in enrich route instead of defining locally
- Fixed duplicate patchAlertSchema: imported updateAlertSchema from @/validators (aliased as patchAlertSchema) in alerts route
- TypeScript type-check: no new errors introduced

Stage Summary:
- 8 duplicate code patterns eliminated
- 2 dead schemas removed (registerSchema, setupSchema)
- 1 dead schema removed (searchSchema)
- 6 custom SVG icon components replaced with lucide-react imports
- All changes verified: zero compilation errors from modified files

---
Task ID: 4
Agent: Sub-agent (import patterns & security)
Task: Fix ALL remaining code quality issues — unused imports, dead barrel refs, security leak, empty catch blocks, dead props, redundant ternaries

Work Log:
- Removed unused imports from PipelineTab.tsx: X, Building2, Star, getStageLabel, getStageColor
- Removed unused import from ScanTab.tsx: Building2
- Removed unused import from SettingsTab.tsx: Settings
- Removed unused import from ProfileSection.tsx: Clock
- Removed unused imports from CompanyProfileDialog.tsx: ExternalLink, MapPin
- Fixed @/types barrel imports → @/lib/types in enrich.service.ts and company.service.ts (2 files)
- Fixed @/lib/search-utils barrel imports → @/lib/services/company.service in combined-search/route.ts and search/route.ts (2 files), renaming buildSearchFilters → parseSearchFilters
- Removed dev token leak in forgot-password/route.ts: deleted `...(process.env.NODE_ENV === 'development' && { resetToken })` spread from response
- Fixed 7 empty `catch {}` blocks → `catch (error) { console.error('[Context]', error); }` across DashboardTab.tsx (1), PipelineTab.tsx (2), ScanTab.tsx (1), SettingsTab.tsx (2)
- Fixed redundant ternary in ScanTab.tsx: `if (!res.ok) return res.text(); return res.text()` → `return res.text()`
- Removed dead `animationDelay` prop from DashboardTab.tsx StatCard component (signature, style attribute, and all 4 call sites)
- TypeScript type-check: no new errors introduced (pre-existing errors only)

Stage Summary:
- 5 unused imports removed across 5 component files
- 4 broken barrel imports fixed (2 @/types, 2 @/lib/search-utils)
- 1 security vulnerability patched (dev token exposure)
- 7 empty catch blocks instrumented with contextual logging
- 1 redundant ternary simplified
- 1 dead prop removed (animationDelay + delay from StatCard)
- Total: 14 files modified
---

## Medium Issues Batch 1 — Fix Log

### M1. Empty placeholder validators/auth.ts
- **File deleted**: `src/validators/auth.ts` (contained only placeholder comments)
- `src/validators/index.ts` had no re-export from auth.ts — no changes needed there

### M2. chatMessageSchema unused conversationId
- **File**: `src/validators/chat.ts`
- Removed `conversationId: z.string().optional()` from `chatMessageSchema`

### M3. scanSchema unused fields
- **File**: `src/validators/company.ts`
- Removed `region: z.string().optional()` and `employeeRange: z.string().optional()` from `scanSchema`

### M4. extended parameter always false
- **Files**: `src/app/api/companies/combined-search/route.ts`, `src/app/api/companies/search/route.ts`
- Changed `parseSearchFilters(searchParams)` → `parseSearchFilters(searchParams, true)` in both routes so that trancheCA, statutEntreprise, sortBy etc. are parsed

### M5. updateCompanySchema redundant
- **File**: `src/validators/company.ts`
- Aligned `updateCompanySchema` with `patchCompanySchema` fields (notes, status, icpScore) — removed conflicting sector, revenue, employeeCount, source fields
- No changes needed in `src/app/api/companies/[id]/route.ts` since the import and usage remain valid

### M12. Replace confirm() with ConfirmDialog
- **Files**: `src/components/dealscope/PipelineTab.tsx`, `ChatTab.tsx`, `SettingsTab.tsx`
- Imported `ConfirmDialog` from `@/components/ui/confirm-dialog`
- Added `confirmState` state management to each component
- Replaced `confirm()` calls with `setConfirmState()` to show the dialog
- Added `<ConfirmDialog>` component to JSX in each file (variant="destructive")

### M13. Password validation duplicated in profile PATCH
- **File**: `src/app/api/user/profile/route.ts`
- Imported `passwordSchema` from `@/lib/validators`
- Replaced manual password checks (lines 105-131) with `passwordSchema.parse(body.newPassword)` wrapped in try/catch

### M14. Forgot password button disabled
- **File**: `src/app/login/page.tsx`
- Removed `disabled` attribute and `title="Bientôt disponible"` from the forgot password button
- Added `onClick` handler that shows an alert message

### M16. Employee count stored inconsistently
- **File**: `src/app/api/companies/route.ts` line 102
  - Changed `parseInt(parsed.data.employeeCount, 10) || null` → `Number(parsed.data.employeeCount)` (also fixed falsy-zero bug with `!= null` guard)
- **File**: `src/validators/company.ts` line 25
  - Changed `employeeCount: z.string().optional().default()` → `z.coerce.number().min(0).optional().default(0)`

### M17. newsSearchSchema unused type field
- **File**: `src/validators/news.ts`
- Removed the entire `type` enum from `newsSearchSchema`

### Verification
- `npx tsc --noEmit` passes with zero errors from our changes (only pre-existing errors in `.next/dev/types/validator.ts`)

---

## Critical & High Fixes — Fix Log

### C1. SQL Injection in InfoGreffe API client
- **File**: `src/lib/infogreffe.ts`
- Applied `escapeSqlInput()` to ALL string filter values interpolated into SQL WHERE clauses:
  - `codePostal` (line 71), `departement` (line 74), `region` (line 77)
  - `codeNaf` (line 85), `statutEntreprise`/statutValue (line 95)
  - `dateImmatBefore` (line 109), `dateImmatAfter` (line 112)
- `query`, `commune`, and `natureJuridique` were already escaped

### C2. Pipeline route field name mismatch
- **File**: `src/components/dealscope/PipelineTab.tsx` line 251
- Renamed `newStage` → `stage` in the PUT /api/pipeline fetch body to match `movePipelineSchema`

### C3. Setup endpoint information disclosure
- **File**: `src/app/api/auth/setup/route.ts`
- GET handler now always returns `{ isFirstSetup: false }` without querying the DB
- Prevents attackers from learning whether users exist

### C4. Enrich & batch-enrich workspace isolation
- **File**: `src/lib/services/enrich.service.ts`
  - `enrichCompany(id, workspaceId?)` — verifies workspace ownership when workspaceId provided
  - `batchEnrich(forceAll, workspaceId?)` — filters companies by workspaceId
- **File**: `src/app/api/companies/enrich/route.ts`
  - Single enrich: passes `authResult.workspaceId` to `enrichCompany()`
  - Batch enrich: passes `authResult.workspaceId` to `batchEnrich()`

### C5. User profile PATCH missing CSRF
- **File**: `src/app/api/user/profile/route.ts`
- Added `validateCsrf(request)` check at the start of the PATCH handler (after requireAuth)
- Imported `validateCsrf` from `@/lib/security`

### C6. CSP connect-src removes insecure http:
- **File**: `src/middleware.ts`
- Changed `connect-src 'self' https: wss: http:` → `connect-src 'self' https: wss:`
- Prevents mixed content in production

### H2. Chat API response structure mismatch
- **File**: `src/components/dealscope/ChatTab.tsx` line 34
- Changed `if (Array.isArray(data)) setMessages(data)` → `if (data && Array.isArray(data.messages)) setMessages(data.messages)`
- Now correctly reads from the nested `messages` array in the API response

### H3. CompanyProfileDialog fetches ALL companies
- **File**: `src/components/dealscope/CompanyProfileDialog.tsx`
- When `companyId` is provided, now fetches `/api/companies/${companyId}` (dedicated single-company endpoint)
- Falls back to siren-based query param search when only `siren` is available
- Correctly handles the paginated `{ companies: [...] }` response format

### H4. Replace raw fetch with apiFetch in components
Replaced ALL raw `fetch()` calls with `apiFetch()` from `@/lib/api-client` in:
- `src/app/register/page.tsx` — POST /api/auth/register
- `src/app/setup/page.tsx` — GET & POST /api/auth/setup
- `src/components/dealscope/PipelineTab.tsx` — GET /api/pipeline, GET /api/companies, PUT /api/pipeline, DELETE /api/companies
- `src/components/dealscope/SearchTab.tsx` — GET combined-search, POST /api/companies
- `src/components/dealscope/CompanyProfileDialog.tsx` — GET /api/companies/:id, GET /api/companies?siren, GET /api/companies/enrich, PATCH /api/companies, DELETE /api/companies
- `src/components/dealscope/SettingsTab.tsx` — GET/POST/PUT/DELETE /api/icp-profiles, GET /api/companies, POST /api/seed
- `src/components/dealscope/ScanTab.tsx` — GET /api/icp-profiles, POST /api/scan
- `src/components/dealscope/ProfileSection.tsx` — GET /api/user/profile (PATCH already used apiFetch)
- Removed manual `headers: { 'Content-Type': 'application/json' }` where apiFetch auto-adds it

### H4b. ProfileSection.tsx already uses apiFetch for PATCH
- Verified: `handleSaveProfile` and `handleChangePassword` both use `apiFetch()` (lines 121, 159)
- Fixed remaining raw `fetch()` in `fetchProfile` → `apiFetch()`

### H7. Unused import in combined-search
- **File**: `src/app/api/companies/combined-search/route.ts`
- `parseInfoGreffeFinancial` IS used on lines 86 and 108 — no change needed

### H8. Hardcoded demo password removed
- **File**: `src/app/api/seed/route.ts`
- Removed fallback `'Demo@2025!ChangeMe'`
- Now requires `SEED_DEMO_PASSWORD` env var; returns 500 error if not set

### H10. CSP unsafe-inline comment added
- **File**: `src/middleware.ts`
- Added explanatory comment above the `scriptSrc` variable describing why `unsafe-inline` is required (Next.js HMR, RSC payloads, styled-jsx)
- Kept `unsafe-inline` as-is per instructions

### Files Modified (total: 15)
- `src/lib/infogreffe.ts` (C1)
- `src/components/dealscope/PipelineTab.tsx` (C2, H4)
- `src/app/api/auth/setup/route.ts` (C3)
- `src/lib/services/enrich.service.ts` (C4)
- `src/app/api/companies/enrich/route.ts` (C4)
- `src/app/api/user/profile/route.ts` (C5)
- `src/middleware.ts` (C6, H10)
- `src/components/dealscope/ChatTab.tsx` (H2)
- `src/components/dealscope/CompanyProfileDialog.tsx` (H3, H4)
- `src/app/register/page.tsx` (H4)
- `src/app/setup/page.tsx` (H4)
- `src/components/dealscope/SearchTab.tsx` (H4)
- `src/components/dealscope/SettingsTab.tsx` (H4)
- `src/components/dealscope/ScanTab.tsx` (H4)
- `src/components/dealscope/ProfileSection.tsx` (H4b)
- `src/app/api/seed/route.ts` (H8)

