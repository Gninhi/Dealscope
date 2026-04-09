# Architecture Technique Détaillée

Ce document décrit l'architecture interne de DealScope pour servir de référence lors du développement.

---

## 1. Flux de Données

### 1.1 Recherche d'Entreprises

```
┌─────────────┐
│ Utilisateur │
│ (SearchTab) │
└──────┬──────┘
       │ 1. Saisit filtres
       ▼
┌─────────────────────┐
│ GET /api/companies/ │
│ combined-search     │
└──────┬──────────────┘
       │ 2. Appel parallèle
       ├──────────────────────┬─────────────────────┐
       ▼                      ▼                     │
┌─────────────────┐    ┌─────────────────┐         │
│ API Gouv Client │    │ InfoGreffe Client│         │
│ (api-gouv.ts)   │    │ (infogreffe.ts)  │         │
└────┬────────────┘    └────────┬────────┘         │
     │                          │                   │
     │ 3. Résultats             │ 3. Résultats      │
     ▼                          ▼                   │
┌─────────────────────────────────────────────────────┤
│              Déduplication & Merge                  │
│  (par SIREN, enrichment.financial.merge)           │
└─────────────────────┬───────────────────────────────┘
                      │ 4. CombinedSearchResult[]
                      ▼
              ┌───────────────┐
              │ Response JSON │
              └───────────────┘
```

### 1.2 Enrichissement d'Entreprise

```
┌─────────────────┐
│ TargetCompany   │
│ (isEnriched:    │
│  false)         │
└────┬────────────┘
     │ 1. Trigger enrich
     ▼
┌───────────────────────────┐
│ GET /api/companies/enrich │
│ ?id=<companyId>           │
└────┬──────────────────────┘
     │ 2. Parallel fetch
     ├─────────────────────┬──────────────────────┐
     ▼                     ▼                      ▼
┌───────────────┐   ┌───────────────┐   ┌────────────────┐
│ API Gouv      │   │ InfoGreffe    │   │ ZAI Web Search │
│ (dirigeants,  │   │ (financial,   │   │ (news, signals)│
│  établissements)   │  legal)       │   │                │
└───────┬───────┘   └───────┬───────┘   └───────┬────────┘
        │                   │                   │
        │ 3. Raw data       │ 3. Raw data       │ 4. News
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────┐
│                    Enrichment Service                    │
│  - Validation données                                    │
│  - Normalisation champs                                  │
│  - Merge avec données existantes                         │
│  - Calcul signaux (growth, alerts)                       │
└─────────────────────────────┬───────────────────────────┘
                              │ 5. Update DB
                              ▼
                    ┌───────────────────┐
                    │ TargetCompany     │
                    │ isEnriched: true  │
                    │ enrichedData: {...}│
                    │ signals: [...]    │
                    └───────────────────┘
```

### 1.3 Chat IA (SSE Streaming)

```
┌──────────────┐
│ ChatTab      │
│ (input msg)  │
└──────┬───────┘
       │ 1. POST /api/chat
       │    body: {message}
       ▼
┌────────────────────────┐
│ POST /api/chat         │
│ (SSE Response)         │
└──────┬─────────────────┘
       │ 2. Create user message
       ▼
┌────────────────────────┐
│ ChatMessage.create     │
│ role: 'user'           │
└──────┬─────────────────┘
       │ 3. Load context
       ▼
┌────────────────────────┐
│ ChatMessage.findMany   │
│ take: 20               │
│ orderBy: createdAt DESC│
└──────┬─────────────────┘
       │ 4. Call AI
       ▼
┌────────────────────────┐
│ Gemma4Service.chat()   │
│ messages: context      │
└──────┬─────────────────┘
       │ 5. Stream response
       ▼
┌────────────────────────┐
│ ReadableStream         │
│ data: {content, ...}   │
│ data: [DONE]           │
└──────┬─────────────────┘
       │ 6. Save response
       ▼
┌────────────────────────┐
│ ChatMessage.create     │
│ role: 'assistant'      │
└────────────────────────┘
```

---

## 2. Gestion d'État

### 2.1 Zustand Store

```typescript
// src/store/use-deal-scope-store.ts

interface DealScopeState {
  // ============ NAVIGATION ============
  activeTab: string;                    // Onglet actif
  setActiveTab: (tab: string) => void;
  sidebarOpen: boolean;                 // Sidebar visible
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // ============ COMPANIES ============
  companies: CompanyWithRelations[];     // Entreprises du pipeline
  setCompanies: (companies: CompanyWithRelations[]) => void;
  
  searchResults: CombinedSearchResult[]; // Résultats recherche
  setSearchResults: (results: CombinedSearchResult[]) => void;
  
  isSearching: boolean;                  // État recherche
  setIsSearching: (searching: boolean) => void;

  // ============ SEARCH ============
  searchFilters: SearchFilters;          // Filtres actifs
  setSearchFilters: (filters: SearchFilters) => void;
  resetSearchFilters: () => void;        // Reset à défaut

  // ============ ICP PROFILES ============
  icpProfiles: ICPProfileData[];         // Profils ICP
  setIcpProfiles: (profiles: ICPProfileData[]) => void;

  // ============ DIALOG ============
  selectedCompanyId: string | null;      // Dialog ouvert
  openCompanyProfile: (companyId: string) => void;
  closeCompanyProfile: () => void;

  // ============ SCAN ============
  isScanning: boolean;                   // Scan en cours
  setIsScanning: (scanning: boolean) => void;
  scanProgress: {                        // Progression scan
    total: number;
    processed: number;
  };
  setScanProgress: (progress: {total: number; processed: number}) => void;
}
```

### 2.2 React Query (Futures)

Non implémenté actuellement. À considérer pour:
- Cache des données entreprise
- Refetch automatique
- Optimistic updates

### 2.3 Local Storage

Utilisé pour:
- `favorites` (NewsTab): articles favoris
- `important` (NewsTab): articles marqués importants
- Thème: géré par `next-themes`

---

## 3. Schémas de Validation

### 3.1 Entreprise

```typescript
// src/validators/company.ts

export const createCompanySchema = z.object({
  // Identité
  siren: z.string()
    .length(9, 'SIREN doit contenir 9 chiffres')
    .regex(/^\d+$/, 'SIREN invalide'),
  
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(500, 'Nom trop long'),
  
  legalName: z.string().max(500).optional().default(''),
  sector: z.string().max(100).optional().default(''),
  nafCode: z.string().max(20).optional().default(''),
  
  // Localisation
  city: z.string().max(200).optional().default(''),
  postalCode: z.string().max(20).optional().default(''),
  region: z.string().max(200).optional().default(''),
  address: z.string().max(500).optional().default(''),
  
  // Données financières
  revenue: z.number().positive().optional(),
  employeeCount: z.number().int().positive().optional(),
  icpScore: z.number().min(0).max(100).optional(),
  
  // Autres
  notes: z.string().max(50000).optional().default(''),
  source: z.string().max(50).optional().default('manual'),
});

export const updateCompanySchema = z.object({
  id: z.string().min(1, 'ID requis'),
  notes: z.string().max(50000).optional(),
  status: z.enum([
    'identifiees',
    'a_contacter',
    'contactees',
    'qualifiees',
    'opportunite',
    'deal',
    'annule'
  ]).optional(),
  icpScore: z.number().min(0).max(100).optional(),
});
```

### 3.2 Authentification

```typescript
// src/lib/validators.ts

export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Mot de passe trop long')
  .regex(/[A-Z]/, 'Doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Doit contenir au moins un chiffre');

// Utilisé dans:
// - Registration
// - Reset password
// - Profile update
```

### 3.3 Chat

```typescript
// src/validators/chat.ts

export const chatMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message vide')
    .max(4000, 'Message trop long (max 4000 caractères)')
});
```

---

## 4. Intégrations Externes

### 4.1 API Gouv - Recherche Entreprises

**Endpoint**: `https://recherche-entreprises.api.gouv.fr/search`

**Paramètres Supportés**:

| Paramètre | Type | Description |
|-----------|------|-------------|
| `q` | string | Terme de recherche |
| `code_postal` | string | Code postal |
| `departement` | string | Code département |
| `region` | string | Nom région |
| `section_activite_principale` | string | Section NAF (A-U) |
| `activite_principale` | string | Code NAF complet |
| `nature_juridique` | string | Code nature juridique |
| `categorie_entreprise` | string | PME, ETI, GE |
| `tranche_effectif_salarie` | string | Tranche effectifs |
| `etat_administratif` | string | A (actif), C (cessé) |
| `date_immatriculation_min` | string | Date min (YYYY-MM-DD) |
| `date_immatriculation_max` | string | Date max (YYYY-MM-DD) |

**Response**:

```json
{
  "results": [
    {
      "siren": "123456789",
      "nom_raison_sociale": "EXEMPLE SAS",
      "sigle": "EX",
      "nom_complet": "EXEMPLE SAS (EX)",
      "nombre_etablissements_ouvert": 5,
      "section_activites_principales": "J",
      "categorie_entreprise": "ETI",
      "nature_juridique": "5710",
      "activite_principale": "62.01Z",
      "libelle_activite_principale": "Programmation informatique",
      "coordonnees": { "lat": "48.8566", "lon": "2.3522" },
      "geo_adresse": "1 Rue Exemple, 75001 Paris",
      "dirigeants": [
        { "nom": "Dupont", "prenom": "Jean", "fonction": "Président" }
      ],
      "complements": {
        "identite": {
          "ca_2023": 5000000,
          "resultat_net_2023": 500000
        }
      }
    }
  ],
  "total_results": 1234,
  "page": 1,
  "per_page": 10
}
```

### 4.2 InfoGreffe OpenData

**Endpoint**: `https://opendata.datainfogreffe.fr/api/explore/v2.1/catalog/datasets/chiffres-cles-2024/records`

**Paramètres**:

| Paramètre | Type | Description |
|-----------|------|-------------|
| `where` | string | Filtre SQL (siren='123456789') |
| `limit` | number | Résultats max |
| `order_by` | string | Tri |

**Response**:

```json
{
  "results": [
    {
      "siren": "123456789",
      "denomination": "EXEMPLE SAS",
      "forme_juridique": "Société par actions simplifiée",
      "code_ape": "6201Z",
      "libelle_ape": "Programmation informatique",
      "ca_1": 5000000,
      "ca_2": 4500000,
      "ca_3": 4000000,
      "resultat_1": 500000,
      "resultat_2": 400000,
      "resultat_3": 350000,
      "effectif_1": 150,
      "effectif_2": 120,
      "date_cloture_exercice_1": "2023-12-31",
      "statut": "Active",
      "date_immatriculation": "2010-01-15",
      "code_greffe": 7501,
      "greffe": "Paris"
    }
  ]
}
```

### 4.3 ZAI Web Dev SDK

**Utilisation**:

```typescript
import { zAiWebDev } from 'z-ai-web-dev-sdk';

// Web Search
const searchResults = await zAiWebDev.web_search({
  query: "fusions acquisitions tech France 2024",
  max_results: 10
});

// Chat Completion (Gemma 4)
const response = await zAiWebDev.chat.completions.create({
  model: 'GEMMA_4',
  messages: [
    { role: 'system', content: 'Tu es un expert M&A...' },
    { role: 'user', content: 'Analyse cette entreprise...' }
  ],
  temperature: 0.7,
  max_tokens: 2000
});
```

---

## 5. Performances

### 5.1 Optimisations Actuelles

| Aspect | Implémentation |
|--------|----------------|
| **Pagination** | `skip`/`take` Prisma, max 200 |
| **Parallel Fetch** | `Promise.all` pour APIs |
| **Index DB** | Sur workspaceId, status, sector |
| **Rate Limiting** | In-memory, évite surcharge |
| **SSE Streaming** | Chat temps réel sans polling |

### 5.2 Goulots Identifiés

| Problème | Impact | Solution |
|----------|--------|----------|
| SQLite en dev | Pas de concurrence écriture | Migrer PostgreSQL |
| Rate limiter in-memory | Perdu au restart | Redis/Upstash |
| Pas de cache | Requêtes répétées | Redis ou React Query |
| N+1 contacts | Chargement lent | À optimiser |

### 5.3 Métriques Cibles

| Métrique | Cible |
|----------|-------|
| Recherche API | < 2s |
| Enrichissement | < 5s |
| Chat response start | < 500ms |
| Page load | < 1s |
| API response | < 200ms |

---

## 6. Monitoring & Logs

### 6.1 Logs Actuels

```typescript
// Niveau INFO
console.log('[Email] Email sent successfully to:', email);
console.log('[Scan] Starting scan for:', query);

// Niveau WARN
console.warn('[Security] Rate limited:', ip);
console.warn('[Enrich] Background enrichment failed');

// Niveau ERROR
console.error('[Auth] Login failed:', error);
console.error('[API] Unexpected error:', error);
```

### 6.2 À Implémenter

- [ ] Structured logging (Pino/Winston)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Uptime monitoring

---

## 7. Déploiement

### 7.1 Environnements

| Env | DB | Email | Domain |
|-----|----| -----|--------|
| Dev | SQLite | Console | localhost:3000 |
| Staging | PostgreSQL | Resend sandbox | staging.dealscope.fr |
| Prod | PostgreSQL | Resend prod | app.dealscope.fr |

### 7.2 CI/CD (Recommandé)

```yaml
# .github/workflows/ci.yml

name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
```

### 7.3 Variables Prod

```bash
# Vercel / Platform.sh

AUTH_SECRET=<secure-random>
DATABASE_URL=postgresql://...
RESEND_API_KEY=re_live_xxx
EMAIL_FROM=noreply@dealscope.fr
NEXT_PUBLIC_APP_URL=https://app.dealscope.fr
NODE_ENV=production
```

---

## 8. Checklist Pré-Production

### Sécurité
- [ ] AUTH_SECRET unique et sécurisé
- [ ] HTTPS activé
- [ ] Headers de sécurité configurés
- [ ] Rate limiting fonctionnel
- [ ] CSRF valide en prod
- [ ] Pas de secrets dans le code

### Données
- [ ] PostgreSQL configuré
- [ ] Migrations appliquées
- [ ] Backup automatique
- [ ] Index créés

### Monitoring
- [ ] Error tracking (Sentry)
- [ ] Logs centralisés
- [ ] Uptime monitoring
- [ ] Analytics

### Performance
- [ ] Images optimisées
- [ ] Bundle analysé
- [ ] Cache headers
- [ ] CDN configuré

### Fonctionnel
- [ ] Email reset password fonctionne
- [ ] API Gouv accessible
- [ ] InfoGreffe accessible
- [ ] IA répond correctement
- [ ] Tous les flux testés

---

*Ce document doit être mis à jour à chaque modification majeure de l'architecture.*
