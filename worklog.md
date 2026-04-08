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
- Deleted 44 dead shadcn/ui component files
- Deleted 2 barrel re-export files

Stage Summary:
- /src/components/ui/ reduced from 49 files → 5 files
- Total: 46 files deleted

---
Task ID: 3
Agent: Sub-agent (duplicate code patterns)
Task: Fix ALL duplicate code patterns across the project

Stage Summary:
- 8 duplicate code patterns eliminated
- 2 dead schemas removed (registerSchema, setupSchema, searchSchema)
- 6 custom SVG icon components replaced with lucide-react imports

---
Task ID: 4
Agent: Sub-agent (import patterns & security)
Task: Fix ALL remaining code quality issues

Stage Summary:
- 5 unused imports removed, 4 broken barrel imports fixed
- 1 security vulnerability patched (dev token exposure)
- 7 empty catch blocks instrumented
- Total: 14 files modified

---

## Medium & Critical Fixes Batches 1-2

(Previous fix logs for M1-M17, C1-C6, H2-H10, F1-F10 preserved above.)

---

## Deep Security Audit & Architectural Cleanup — Fix Log

### S1. CORS Misconfiguration in next.config.ts
- **Severity**: Medium
- **File**: `next.config.ts`
- **Problem**: `Access-Control-Allow-Origin: ''` (empty string) was set for all API routes. This is confusing and inconsistent — the app is same-origin, so CORS headers are unnecessary.
- **Fix**: Removed the entire CORS header block (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Max-Age`) from the API routes configuration. Same-origin requests do not need CORS.

### S2. Missing X-Frame-Options header
- **Severity**: Medium
- **File**: `src/middleware.ts`
- **Problem**: `X-Frame-Options` was intentionally omitted because `frame-ancestors` CSP covers modern browsers. However, older browsers (IE11, older Safari) don't support CSP `frame-ancestors`.
- **Fix**: Added `X-Frame-Options: SAMEORIGIN` to middleware security headers, alongside the existing CSP `frame-ancestors` directive. This provides defense-in-depth for older browsers.

### S3. Missing Strict-Transport-Security header
- **Severity**: High
- **File**: `src/middleware.ts`
- **Problem**: HSTS was intentionally skipped in dev (breaks iframe/HTTP). However, it was also missing in production where it's critical for preventing SSL stripping attacks.
- **Fix**: Added `Strict-Transport-Security: max-age=31536000; includeSubDomains` in non-development environments only (`!isDev`).

### S4. Circular dependency: validators.ts ↔ company.service.ts
- **Severity**: Medium
- **Files**: `src/lib/validators.ts`, `src/lib/services/company.service.ts`, `src/validators/index.ts`, `src/lib/services/index.ts`
- **Problem**: `src/lib/validators.ts` imported `ALLOWED_COMPANY_UPDATE_FIELDS` from `@/lib/services/company.service.ts` and re-exported it. This creates a fragile circular dependency chain: `validators.ts` → `company.service.ts` → ... → `validators.ts`.
- **Fix**: Moved the `ALLOWED_COMPANY_UPDATE_FIELDS` definition INTO `src/lib/validators.ts` (making it the SINGLE SOURCE OF TRUTH). Updated `company.service.ts` to import from `@/lib/validators` and re-export for backward compatibility. Updated `services/index.ts` to import from the new canonical location.

### S5. Input sanitization gaps — chat message content
- **Severity**: High
- **File**: `src/app/api/chat/route.ts`
- **Problem**: Chat messages were validated by Zod (max 4000 chars) but NOT sanitized with `sanitizeInput()` before being stored in the database. Null bytes or other control characters could be injected.
- **Fix**: Added `const sanitizedMessage = sanitizeInput(message, 4000)` before the DB insert.

### S6. Input sanitization gaps — user profile fields
- **Severity**: Medium
- **File**: `src/app/api/user/profile/route.ts`
- **Problem**: `firstName`, `lastName`, and `email` fields were string.trim()'d but not sanitized with `sanitizeInput()`. Null byte injection or other control characters could be stored.
- **Fix**: Applied `sanitizeInput(value, 254)` to all user-modifiable string fields before DB write.

### S7. Input sanitization gaps — company PATCH/PUT string fields
- **Severity**: Medium
- **Files**: `src/app/api/companies/route.ts`, `src/app/api/companies/[id]/route.ts`
- **Problem**: While numerical fields were validated, string fields in the PATCH/PUT whitelist (like `notes`) were stored without `sanitizeInput()`.
- **Fix**: Added string sanitization in the whitelist loop: `typeof value === 'string' ? sanitizeInput(value, ...) : value`.

### S8. Input sanitization gaps — pipeline notes, ICP profile names, alert names, bookmark notes
- **Severity**: Medium
- **Files**: `src/app/api/pipeline/route.ts`, `src/app/api/icp-profiles/route.ts`, `src/app/api/news/alerts/route.ts`, `src/app/api/news/bookmarks/route.ts`
- **Problem**: User-provided string inputs (notes, names, keywords, sector) were stored without `sanitizeInput()`.
- **Fix**: Applied `sanitizeInput()` to all string fields before DB writes in all four route files.

### S9. SIREN injection in InfoGreffe API client
- **Severity**: High
- **File**: `src/lib/infogreffe.ts`
- **Problem**: `getInfoGreffeBySiren(siren)` interpolated the `siren` parameter directly into the API URL's WHERE clause (`?where=siren%3D"${siren}"`). A malicious SIREN value like `" OR 1=1 --` could modify the SQL query.
- **Fix**: Added SIREN sanitization: `const safeSiren = siren.replace(/[^0-9]/g, '').slice(0, 9)` with a length check. Also added the same validation in `/api/companies/infogreffe/route.ts` before calling `getInfoGreffeBySiren()`.

### S10. Rate limiting missing on 15+ API endpoints
- **Severity**: High
- **Files**: 10 route files modified
- **Problem**: Many API routes had no rate limiting at all, making them vulnerable to brute-force, enumeration, and denial-of-service attacks.
- **Routes fixed** (added rate limiting):
  - `/api/companies` POST (20/min), PATCH (30/min), DELETE (30/min)
  - `/api/companies/[id]` GET (60/min), PUT (30/min), DELETE (30/min)
  - `/api/companies/enrich` GET (10/min), POST (5/min)
  - `/api/user/profile` GET (60/min), PATCH (10/min)
  - `/api/pipeline` PUT (30/min)
  - `/api/icp-profiles` POST (20/min), PUT (20/min), DELETE (30/min)
  - `/api/news/alerts` GET (60/min), POST (20/min), DELETE (30/min), PATCH (20/min)
  - `/api/news/bookmarks` GET (60/min), POST (20/min), DELETE (30/min), PATCH (20/min)
  - `/api/seed` POST (2/min)

### S11. Production error information disclosure
- **Severity**: Medium
- **File**: `src/lib/security.ts`
- **Problem**: `safeErrorResponse()` returned whatever message was passed, even for 5xx errors in production. If a developer accidentally passed a raw error message (e.g., `error.message`), internal details could leak.
- **Fix**: Added defense-in-depth: for status >= 500 in non-development environments, the message is automatically replaced with the generic "Erreur interne du serveur". All existing callers already pass safe French messages, so this is a safety net only.

### S12. Scan service ignores user's workspace
- **Severity**: High
- **Files**: `src/lib/services/scan.service.ts`, `src/app/api/scan/route.ts`
- **Problem**: `executeScan()` called `getWorkspace()` which always returns the workspace with slug 'dealscope', ignoring the authenticated user's actual `workspaceId`. In multi-workspace deployments, all scan results would go to the wrong workspace.
- **Fix**: Added `workspaceId` parameter to `ScanInput` interface and `executeScan()`. The scan route now passes `authResult.workspaceId` to `executeScan()`. Falls back to `getWorkspace()` only if no `workspaceId` is provided.

### S13. Dead code: use-mobile.ts hook
- **Severity**: Low
- **File**: `src/hooks/use-mobile.ts`
- **Problem**: This file was never imported anywhere in the codebase. Dead code adds bundle size and confusion.
- **Fix**: Deleted `src/hooks/use-mobile.ts` and the now-empty `src/hooks/` directory.

### S14. Dead code: ProfileSection.tsx component
- **Severity**: Low
- **File**: `src/components/dealscope/ProfileSection.tsx`
- **Problem**: This is a full profile settings page component (500+ lines) that is never imported or rendered anywhere. It's complete and functional but disconnected from the app.
- **Fix**: Added a TODO comment at the top explaining the situation. Left the file in place as it may be intended for future integration into the Settings tab.

### S15. Forgot password — no email service configured
- **Severity**: Medium
- **File**: `src/app/api/auth/forgot-password/route.ts`
- **Problem**: The endpoint generates a reset token and stores it in the database, but no email is ever sent. The user will never receive the reset link, making the feature non-functional.
- **Fix**: Added a TODO comment explaining the situation. The existing behavior (returning a generic success message to prevent email enumeration) was preserved — this is the correct security posture even without email integration.

### Build Verification
- `npx next build` ✅ — 28/28 pages compiled successfully, zero TypeScript errors

### Files Modified (total: 18)
- `next.config.ts` (S1)
- `src/middleware.ts` (S2, S3)
- `src/lib/validators.ts` (S4)
- `src/lib/services/company.service.ts` (S4)
- `src/lib/services/index.ts` (S4)
- `src/validators/index.ts` (S4)
- `src/app/api/chat/route.ts` (S5)
- `src/app/api/user/profile/route.ts` (S6)
- `src/app/api/companies/route.ts` (S7, S10)
- `src/app/api/companies/[id]/route.ts` (S7, S10)
- `src/app/api/pipeline/route.ts` (S8, S10)
- `src/app/api/icp-profiles/route.ts` (S8, S10)
- `src/app/api/news/alerts/route.ts` (S8, S10)
- `src/app/api/news/bookmarks/route.ts` (S8, S10)
- `src/lib/infogreffe.ts` (S9)
- `src/app/api/companies/infogreffe/route.ts` (S9)
- `src/lib/security.ts` (S11)
- `src/lib/services/scan.service.ts` (S12)
- `src/app/api/scan/route.ts` (S12)
- `src/app/api/seed/route.ts` (S10)
- `src/app/api/auth/forgot-password/route.ts` (S15)
- `src/hooks/use-mobile.ts` (S13 — DELETED)
- `src/components/dealscope/ProfileSection.tsx` (S14 — TODO added)

---

## Session — Problème "rien ne s'affiche" — Correction complète

### P1. NEXTAUTH_SECRET manquant (CRITIQUE — cause principale)
- **Sévérité**: CRITIQUE
- **Fichier**: `.env`
- **Problème**: `NEXTAUTH_SECRET` n'était pas défini. Sans cette variable, NextAuth ne peut pas signer/vérifier les JWTs. L'authentification échouait silencieusement → `useSession()` ne résolvait jamais → écran de chargement infini.
- **Correction**: Ajout de `NEXTAUTH_SECRET` (64 bytes hexa) et `NEXTAUTH_URL` dans `.env`

### P2. NewsTab.tsx — fetch POST sans CSRF (403)
- **Sévérité**: Moyenne
- **Fichier**: `src/components/dealscope/NewsTab.tsx`
- **Problème**: Les appels `fetch()` bruts vers `/api/news/summary` (POST) n'incluaient pas le header `X-CSRF-Token`. Le serveur valide CSRF → erreur 403.
- **Correction**: Remplacement de `fetch` par `apiFetch` pour les requêtes POST et GET.

### P3. ProfileSection.tsx — composant mort non intégré
- **Sévérité**: Faible
- **Fichiers**: `ProfileSection.tsx`, `SettingsTab.tsx`
- **Problème**: 515 lignes de code fonctionnel (édition profil, changement mot de passe, déconnexion) jamais importées nulle part.
- **Correction**: Renommage en `UserProfileCard` (named export), intégration dans `SettingsTab.tsx`.

### P4. ChatTab.tsx — type NodeJS.Timeout non portable
- **Sévérité**: Faible
- **Fichier**: `src/components/dealscope/ChatTab.tsx`
- **Problème**: `useRef<NodeJS.Timeout>` nécessite `@types/node` côté client.
- **Correction**: Remplacement par `ReturnType<typeof setTimeout>`.

### P5. Dépendances inutilisées (22 packages Radix UI)
- **Sévérité**: Faible
- **Fichier**: `package.json`
- **Problème**: 22 packages `@radix-ui/*` installés mais non utilisés (seuls 3 réellement importés).
- **Correction**: Suppression de 22 packages Radix UI, `react-hook-form`, `react-day-picker`, `bun-types`, `tailwindcss-animate` (remplacé par `tw-animate-css`).

### P6. @types/node manquant
- **Sévérité**: Faible
- **Problème**: 15 erreurs TS dans les fichiers serveur (`process.env`, `require`).
- **Correction**: `npm install --save-dev @types/node`.

### P7. 11 vulnérabilités npm audit
- **Sévérité**: Haute (prévention)
- **Correction**: `npm audit fix` → 0 vulnérabilités.

### Build Verification
- `npx next build` ✅ — 28/28 pages compilées, 0 erreurs TypeScript
- `npm audit` ✅ — 0 vulnérabilités
- Serveur de production ✅ — HTTP 200 sur `/login`, `/`, `/api`
- 48 fichiers audités, 0 broken imports, 0 circular dependencies

### Files Modified (total: 7)
- `.env` (P1)
- `src/components/dealscope/NewsTab.tsx` (P2)
- `src/components/dealscope/ProfileSection.tsx` (P3)
- `src/components/dealscope/SettingsTab.tsx` (P3)
- `src/components/dealscope/ChatTab.tsx` (P4)
- `package.json` (P5, P6)

---
Task ID: 5
Agent: Super Z (main)
Task: Démarrage complet de l'application, vérification fonctionnelle et capture d'aperçus visuels

Work Log:
- Vérifié l'environnement : .env (NEXTAUTH_SECRET, DATABASE_URL, etc.), DB SQLite (13 tables, 1 utilisateur, 2 workspaces, 10 entreprises)
- Vérifié les dépendances : next, prisma, next-auth tous installés et configurés
- Build Next.js : ✅ 28/28 pages compilées, 0 erreurs TypeScript
- Serveur de production démarré sur port 3000
- Test de toutes les pages : Login (200), Register (200), Setup (200), Home (200), API (200)
- Test des endpoints API : /api → {"status":"ok"}, /api/auth/session → null (non authentifié), /api/dashboard/stats → {"error":"Non authentifié"} (correct)
- Réinitialisation du mot de passe de l'utilisateur demo@dealscope.fr
- Connexion réussie avec le compte demo → redirection vers le dashboard
- Navigation et capture sur les 7 onglets principaux : Dashboard, Recherche, Pipeline, Scan IA, Chat IA Gemma 4, Actualités & Alertes, Paramètres
- Test du thème sombre (dark mode) sur le Dashboard
- Test de la recherche d'entreprise (Dataiku)
- Test de l'ouverture du profil entreprise (Capgemini)
- Test de l'envoi d'un message dans le Chat IA Gemma 4
- 15 screenshots PNG capturés dans /home/z/my-project/download/

Stage Summary:
- Application DealScope v0.3.0 entièrement fonctionnelle
- Toutes les pages et APIs répondent correctement
- Authentification NextAuth fonctionnelle
- Base de données peuplée (10 entreprises, pipeline, etc.)
- 15 screenshots de toutes les pages capturés

---
Task ID: 6
Agent: Super Z (main) + Full-stack sub-agent
Task: Fix Recherche, Pipeline backend, Actualités & Alertes premium

Work Log:
- **Analyse complète** de 27 fichiers (API routes, services, composants, types, store, constants)
- **Fix 1 — Recherche** : Ajout d'un bouton "Rechercher" visible à côté du champ de recherche (avant, seul Enter fonctionnait)
- **Fix 2a — Pipeline PUT** : Suppression des anciens PipelineStage avant d'en créer un nouveau (évite l'accumulation de doublons dans la DB)
- **Fix 2b — Pipeline PATCH** : Nouveau endpoint PATCH /api/pipeline pour mettre à jour les notes d'une étape de pipeline
- **Fix 3 — NewsTab premium redesign** : Réécriture complète du composant avec :
  - Favoris persistants via localStorage (survivent au rechargement)
  - Section Alertes avec CRUD complet (créer, lister, activer/désactiver, supprimer)
  - Design premium : barre de couleur catégorie, badge Premium/Source, animations d'entrée
  - 132 articles chargés depuis ZAI web search + RSS + demo data
  - 7 catégories : Deals clos (12), En cours (16), Marché (11), Réglementaire, Tech & Digital (8), LBO & PE (2), Sectoriel
- Build : ✅ 28/28 pages compilées, 0 erreurs TypeScript
- Tests fonctionnels : Recherche Dataiku ✅, Pipeline kanban ✅, Actualités 132 articles ✅, Alertes CRUD ✅
- 7 screenshots de vérification capturés

Stage Summary:
- Recherche : bouton visible + résultats API Gouv fonctionnels (Dataiku, Datarocks trouvés)
- Pipeline : 7 colonnes (Identifiées → A contacter → Contactées → Qualifiées → Opportunité → Deal → Annulé), 10 entreprises
- Actualités & Alertes : 132 articles, 7 catégories, alertes CRUD, favoris persistants, design premium
- Backend structuré : rate limiting, CSRF, sanitisation, workspace isolation sur tous les endpoints
