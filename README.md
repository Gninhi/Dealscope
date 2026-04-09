# DealScope - Plateforme d'Intelligence M&A

<div align="center">

![Version](https://img.shields.io/badge/version-0.3.0-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Prisma](https://img.shields.io/badge/Prisma-6.11-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

**Plateforme d'intelligence pour professionnels M&A (Fusions & Acquisitions)**

[Architecture](#-architecture) • [Installation](#-installation) • [API](#-api) • [Développement](#-développement)

</div>

---

## 📋 Table des Matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Architecture](#-architecture)
3. [Modèle de Données](#-modèle-de-données)
4. [API Routes](#-api-routes)
5. [Composants](#-composants)
6. [Services](#-services)
7. [État Actuel](#-état-actuel)
8. [Installation](#-installation)
9. [Développement](#-développement)
10. [Sécurité](#-sécurité)
11. [Roadmap](#-roadmap)

---

## 🎯 Vue d'ensemble

### Problème Résolu

DealScope est une plateforme d'intelligence M&A conçue pour les professionnels de la fusion-acquisition. Elle résout les problèmes suivants :

| Problème | Solution |
|----------|----------|
| 🔍 **Découverte d'entreprises** | Recherche via API Gouv + InfoGreffe |
| 📊 **Gestion du pipeline** | Kanban 7 étapes (identification → deal) |
| 🤖 **Scoring ICP** | Analyse IA automatique (Gemma 4) |
| 📰 **Veille M&A** | Agrégation multi-sources en temps réel |
| 📈 **Enrichissement** | Données financières/juridiques automatiques |
| ✉️ **Prospection** | Génération d'emails par IA |

### Utilisateurs Cibles

- Analystes et conseillers M&A
- Professionnels du Private Equity
- Équipes Corporate Development
- Courtiers en entreprises

### Stack Technique

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 16)                    │
├─────────────────────────────────────────────────────────────┤
│  React 19 │ TypeScript │ Tailwind CSS │ Framer Motion       │
│  Zustand  │ Radix UI   │ Recharts     │ dnd-kit             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API LAYER (App Router)                   │
├─────────────────────────────────────────────────────────────┤
│  NextAuth v5 │ Prisma ORM │ Zod Validation │ CSRF Protection │
│  Rate Limiting │ SSE Streaming │ API Guards                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SERVICES LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  API Gouv Client │ InfoGreffe Client │ Gemma 4 AI Service   │
│  Enrichment Svc │ Scan Service │ News Service               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  SQLite (dev) │ PostgreSQL (prod) │ Prisma Migrations       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     EXTERNAL APIS                            │
├─────────────────────────────────────────────────────────────┤
│  API Gouv (Recherche Entreprises) │ InfoGreffe OpenData     │
│  ZAI Web Dev SDK (Gemma 4 + Web Search)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗 Architecture

### Structure des Dossiers

```
Dealscope_N/
├── prisma/
│   ├── schema.prisma              # Schéma actif (SQLite par défaut)
│   ├── schema.sqlite.prisma       # Variante SQLite
│   ├── schema.postgresql.prisma   # Variante PostgreSQL
│   └── migrations/
│       └── 0_init/
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/             # Authentification
│   │   │   ├── companies/        # Gestion entreprises
│   │   │   ├── pipeline/         # Pipeline Kanban
│   │   │   ├── chat/             # Chat IA
│   │   │   ├── news/             # Veille M&A
│   │   │   ├── scan/             # Scan IA
│   │   │   ├── icp-profiles/     # Profils ICP
│   │   │   ├── user/             # Profil utilisateur
│   │   │   └── dashboard/        # Statistiques
│   │   │
│   │   ├── login/                # Page connexion
│   │   ├── register/             # Page inscription
│   │   ├── setup/                # Configuration initiale
│   │   ├── page.tsx              # Page principale
│   │   └── layout.tsx            # Layout racine
│   │
│   ├── components/
│   │   ├── auth/                 # Composants auth
│   │   ├── dealscope/            # Composants métier
│   │   │   ├── Sidebar.tsx
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── SearchTab.tsx
│   │   │   ├── PipelineTab.tsx
│   │   │   ├── ScanTab.tsx
│   │   │   ├── ChatTab.tsx
│   │   │   ├── NewsTab.tsx
│   │   │   ├── SettingsTab.tsx
│   │   │   ├── CompanyProfileDialog.tsx
│   │   │   └── ProfileSection.tsx
│   │   └── ui/                   # Composants UI (shadcn)
│   │
│   ├── lib/
│   │   ├── services/             # Services métier
│   │   │   ├── company.service.ts
│   │   │   ├── scan.service.ts
│   │   │   ├── enrich.service.ts
│   │   │   └── news.service.ts
│   │   │
│   │   ├── __tests__/            # Tests unitaires
│   │   ├── auth.ts               # Configuration NextAuth
│   │   ├── db.ts                 # Client Prisma
│   │   ├── api-gouv.ts           # Client API Gouv
│   │   ├── infogreffe.ts         # Client InfoGreffe
│   │   ├── gemma4.ts             # Service IA Gemma 4
│   │   ├── security.ts           # Utilitaires sécurité
│   │   ├── password.ts           # Hachage mots de passe
│   │   ├── api-client.ts         # Fetcher client
│   │   ├── api-guard.ts          # Guards API
│   │   ├── email.ts              # Service email
│   │   ├── rate-limit.ts         # Rate limiting
│   │   ├── validators.ts         # Validateurs Zod
│   │   ├── types.ts              # Types TypeScript
│   │   └── utils.ts              # Utilitaires
│   │
│   ├── validators/               # Schémas Zod
│   │   ├── index.ts
│   │   ├── company.ts
│   │   ├── chat.ts
│   │   └── news.ts
│   │
│   ├── store/
│   │   └── use-deal-scope-store.ts  # Zustand store
│   │
│   └── constants/                # Constantes app
│       ├── index.ts
│       ├── pipeline.ts
│       ├── company.ts
│       ├── naf.ts
│       └── regions.ts
│
├── public/                       # Assets statiques
├── db/                           # Base SQLite
├── vitest.config.ts              # Config tests
├── vitest.setup.ts               # Setup tests
├── next.config.ts                # Config Next.js
├── tailwind.config.ts            # Config Tailwind
├── tsconfig.json                 # Config TypeScript
└── package.json
```

---

## 🗄 Modèle de Données

### Diagramme Entité-Association

```
┌──────────────┐       ┌──────────────┐
│  Workspace   │───1:N─│     User     │
└──────────────┘       └──────────────┘
       │                      │
       │1:N                   │
       │                      │
       ▼                      │
┌──────────────┐              │
│  ICPProfile  │◄─────────────┘
└──────────────┘       0:1
       │
       │0:1
       ▼
┌──────────────────────────────────────────┐
│              TargetCompany               │
├──────────────────────────────────────────┤
│ id, workspaceId, icpProfileId, siren     │
│ name, legalName, sector, revenue         │
│ employeeCount, icpScore, status          │
│ notes, source, isEnriched, enrichedData  │
│ ... (30+ champs enrichis)                │
└──────────────────────────────────────────┘
       │
       │1:N
       ├────────────────┬────────────────┐
       ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│CompanySignal │ │   Contact    │ │PipelineStage │
└──────────────┘ └──────────────┘ └──────────────┘


┌──────────────┐       ┌──────────────┐
│  NewsArticle │───1:N─│ NewsBookmark │
└──────────────┘       └──────────────┘

┌──────────────┐
│  NewsAlert   │
└──────────────┘

┌──────────────┐
│ ChatMessage  │
└──────────────┘

┌──────────────┐
│ ScanHistory  │
└──────────────┘

┌──────────────┐
│  AppSetting  │
└──────────────┘
```

### Modèles Prisma

#### Workspace
```prisma
model Workspace {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  plan            String   @default("free")
  createdAt       DateTime @default(now())
  
  users           User[]
  icpProfiles     ICPProfile[]
  targetCompanies TargetCompany[]
  scanHistories   ScanHistory[]
  chatMessages    ChatMessage[]
  newsArticles    NewsArticle[]
  newsAlerts      NewsAlert[]
  newsBookmarks   NewsBookmark[]
}
```

#### User
```prisma
model User {
  id              String      @id @default(cuid())
  workspaceId     String
  email           String      @unique
  password        String      @default("")
  emailVerified   Boolean     @default(false)
  firstName       String      @default("")
  lastName        String      @default("")
  role            String      @default("member")
  resetToken      String?
  resetTokenExpiry DateTime?
  createdAt       DateTime    @default(now())
  
  workspace       Workspace   @relation(fields: [workspaceId], references: [id])
}
```

#### TargetCompany (Entreprise Cible)
```prisma
model TargetCompany {
  id                    String    @id @default(cuid())
  workspaceId           String
  icpProfileId          String?
  
  // Identité
  siren                 String
  name                  String
  legalName             String    @default("")
  sector                String    @default("")
  nafCode               String    @default("")
  nafLabel              String    @default("")
  
  // Localisation
  address               String    @default("")
  city                  String    @default("")
  postalCode            String    @default("")
  region                String    @default("")
  latitude              Float?
  longitude             Float?
  
  // Données financières
  revenue               Float?
  employeeCount         Int?
  trancheCA             String    @default("")
  dateClotureExercice   String    @default("")
  
  // Juridique
  natureJuridique       String    @default("")
  categorieEntreprise   String    @default("")
  statutEntreprise      String    @default("")
  greffe                String    @default("")
  dateImmatriculation   String    @default("")
  
  // Pipeline
  status                String    @default("a_contacter")
  icpScore              Float?
  notes                 String    @default("")
  source                String    @default("manual")
  
  // Enrichissement
  enrichedData          String    @default("{}")
  isEnriched            Boolean   @default(false)
  
  // Timestamps
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Relations
  workspace             Workspace     @relation(fields: [workspaceId], references: [id])
  icpProfile           ICPProfile?   @relation(fields: [icpProfileId], references: [id])
  signals              CompanySignal[]
  contacts             Contact[]
  pipelineStages       PipelineStage[]
  newsAlerts           NewsAlert[]
  
  @@unique([workspaceId, siren])
  @@index([workspaceId, status])
  @@index([workspaceId, sector])
  @@index([workspaceId, createdAt])
  @@index([workspaceId, updatedAt])
}
```

#### CompanySignal (Signal d'Entreprise)
```prisma
model CompanySignal {
  id          String       @id @default(cuid())
  companyId   String
  type        String       // growth, hiring, alert, etc.
  title       String
  description String       @default("")
  source      String       @default("")
  detectedAt  DateTime     @default(now())
  confidence  Float?
  
  company     TargetCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId])
}
```

#### PipelineStage (Étape du Pipeline)
```prisma
model PipelineStage {
  id         String       @id @default(cuid())
  companyId  String
  stage      String       // identifiees, a_contacter, contactees, etc.
  assignedTo String       @default("")
  notes      String       @default("")
  movedAt    DateTime     @default(now())
  
  company    TargetCompany @relation(fields: [companyId], references: [id], onDelete: Cascade)
  
  @@index([companyId])
  @@index([companyId, stage])
}
```

#### ICPProfile (Profil Client Idéal)
```prisma
model ICPProfile {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  criteria    String   @default("{}")  // JSON: sectors, revenueMin, etc.
  weights     String   @default("{}")  // JSON: sector: 30, revenue: 25, etc.
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  
  workspace        Workspace       @relation(fields: [workspaceId], references: [id])
  targetCompanies  TargetCompany[]
  
  @@index([workspaceId])
}
```

---

## 🔌 API Routes

### Arborescence Complète

```
/api
├── auth/
│   ├── [...nextauth]     # NextAuth handler
│   ├── register          # Inscription utilisateur
│   ├── setup             # Configuration initiale
│   ├── forgot-password   # Demande reset
│   └── reset-password    # Validation reset
│
├── companies/
│   ├── [id]              # CRUD entreprise individuelle
│   ├── search            # Recherche API Gouv
│   ├── combined-search   # Recherche multi-sources
│   ├── enrich            # Enrichissement données
│   └── infogreffe        # Recherche InfoGreffe
│
├── pipeline              # Gestion pipeline Kanban
├── chat                  # Chat IA (SSE streaming)
├── scan                  # Scan IA d'entreprises
│
├── news/
│   ├── alerts            # CRUD alertes
│   ├── bookmarks         # CRUD favoris
│   └── summary           # Résumé IA
│
├── icp-profiles          # CRUD profils ICP
├── user/profile          # Profil utilisateur
├── dashboard/stats       # Statistiques dashboard
└── seed                  # Données démo (dev only)
```

### Endpoints Détaillés

#### 🔐 Authentification

| Endpoint | Méthode | Description | Auth | CSRF |
|----------|---------|-------------|------|------|
| `POST /api/auth/register` | POST | Créer un compte | ❌ | ❌ |
| `GET /api/auth/setup` | GET | Vérifier setup initial | ❌ | ❌ |
| `POST /api/auth/setup` | POST | Créer premier admin | ❌ | ❌ |
| `POST /api/auth/forgot-password` | POST | Demander reset | ❌ | ❌ |
| `POST /api/auth/reset-password` | POST | Valider reset | ❌ | ❌ |

#### 🏢 Entreprises

| Endpoint | Méthode | Description | Rate Limit |
|----------|---------|-------------|------------|
| `GET /api/companies` | GET | Liste paginée | 60/min |
| `POST /api/companies` | POST | Ajouter entreprise | 20/min |
| `PATCH /api/companies` | PATCH | Modifier (notes/status) | 30/min |
| `DELETE /api/companies?id=...` | DELETE | Supprimer | 30/min |
| `GET /api/companies/[id]` | GET | Détails entreprise | 60/min |
| `PUT /api/companies/[id]` | PUT | Mise à jour complète | 30/min |
| `GET /api/companies/search` | GET | Recherche API Gouv | 30/min |
| `GET /api/companies/combined-search` | GET | Recherche multi-sources | 20/min |
| `GET /api/companies/enrich` | GET | Enrichir une entreprise | 10/min |
| `POST /api/companies/enrich` | POST | Enrichissement batch (max 10) | 5/min |

#### 📊 Pipeline

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/pipeline` | GET | Données pipeline |
| `PUT /api/pipeline` | PUT | Déplacer entreprise |
| `PATCH /api/pipeline` | PATCH | Modifier notes étape |

#### 🤖 IA

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/chat` | GET | Historique chat (paginé) |
| `POST /api/chat` | POST | Envoyer message (SSE) |
| `POST /api/scan` | POST | Scan IA d'entreprises |
| `POST /api/ai/analyze` | POST | Analyse IA (SSE) |

#### 📰 News

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `GET /api/news` | GET | Liste news |
| `POST /api/news/summary` | POST | Résumé IA |
| `GET /api/news/alerts` | GET | Liste alertes |
| `POST /api/news/alerts` | POST | Créer alerte |
| `PATCH /api/news/alerts` | PATCH | Activer/Désactiver |
| `DELETE /api/news/alerts` | DELETE | Supprimer alerte |
| `GET /api/news/bookmarks` | GET | Liste favoris |
| `POST /api/news/bookmarks` | POST | Ajouter favori |
| `PATCH /api/news/bookmarks` | PATCH | Modifier favori |
| `DELETE /api/news/bookmarks` | DELETE | Supprimer favori |

---

## 🧩 Composants

### Composants Métier (`src/components/dealscope/`)

#### Sidebar.tsx
```typescript
// Navigation principale avec 7 onglets
// État: activeTab, sidebarOpen, theme
// Fonctionnalités:
//   - Navigation par onglets
//   - Toggle thème dark/light
//   - Réduction/extension sidebar
//   - Indicateur utilisateur
```

#### DashboardTab.tsx
```typescript
// Dashboard avec statistiques
// Props: -
// État: stats, loading
// Affiche:
//   - KPIs (total entreprises, signaux, contacts)
//   - Graphique pipeline (Recharts)
//   - Entreprises récentes
//   - Actions rapides
```

#### SearchTab.tsx
```typescript
// Recherche avancée d'entreprises
// État:
//   - searchFilters (20+ filtres)
//   - searchResults, isSearching
//   - expandedDirectors, addingToPipeline
// Fonctionnalités:
//   - Recherche multi-critères
//   - Pagination
//   - Ajout au pipeline
//   - Aperçu dirigeants
//   - Dialog profil entreprise
```

#### PipelineTab.tsx
```typescript
// Kanban board 7 étapes
// État:
//   - pipelineData, selectedCompanyId
//   - draggedItem
// Fonctionnalités:
//   - Drag & drop (dnd-kit)
//   - 7 colonnes (identifiées → deal)
//   - Cartes entreprise avec score ICP
//   - Suppression avec confirmation
```

#### ScanTab.tsx
```typescript
// Scan IA d'entreprises
// État:
//   - query, sector, selectedIcp
//   - isScanning, scanProgress, result
// Fonctionnalités:
//   - Recherche IA via Gemma 4
//   - Scoring automatique
//   - Import résultats
```

#### ChatTab.tsx
```typescript
// Chat IA avec Gemma 4
// État:
//   - messages, input, isLoading
//   - copiedId
// Fonctionnalités:
//   - SSE streaming
//   - Prompts suggérés
//   - Copie messages
//   - Effacer historique
```

#### NewsTab.tsx
```typescript
// Veille M&A
// État:
//   - news, activeCat, searchQuery
//   - favorites, important (localStorage)
//   - alerts, summaries
// Fonctionnalités:
//   - 8 catégories (M&A, Tech, Finance, etc.)
//   - Favoris et importance
//   - Résumé IA
//   - Alertes personnalisées
```

#### CompanyProfileDialog.tsx
```typescript
// Dialog profil entreprise détaillé
// Props: companyId?, siren?, searchResult?, onClose, onRefresh?
// État:
//   - company, enriching, editingNotes
//   - activeTab (overview | financial | legal | network)
// Fonctionnalités:
//   - 4 onglets (vue ensemble, financier, juridique, réseau)
//   - Enrichissement données
//   - Édition notes
//   - Graphique historique CA
```

---

## ⚙️ Services

### API Gouv (`src/lib/api-gouv.ts`)

```typescript
// Client pour l'API Recherche Entreprises
// URL: https://recherche-entreprises.api.gouv.fr/search

export async function searchApiGouv(filters: SearchFilters): Promise<CompanySearchResult[]>

// Filtres supportés:
// - query, departement, codePostal, commune, region
// - sectionNaf, codeNaf, natureJuridique
// - categorieEntreprise, effectifMin, effectifMax
// - trancheCA, statutEntreprise
// - dateImmatBefore, dateImmatAfter
// - excludeAssociations, excludeAutoEntrepreneurs
```

### InfoGreffe (`src/lib/infogreffe.ts`)

```typescript
// Client pour l'API OpenData InfoGreffe
// URL: https://opendata.datainfogreffe.fr/api/explore/v2.1/catalog/datasets/chiffres-cles-2024

export async function searchInfoGreffe(filters: SearchFilters): Promise<InfoGreffeRecord[]>
export async function getInfoGreffeBySiren(siren: string): Promise<InfoGreffeRecord | null>
export function parseInfoGreffeFinancial(record: InfoGreffeRecord): FinancialData

// Données:
// - Historique CA (3 ans)
// - Résultat net
// - Effectifs
// - Forme juridique
// - Statut, greffe, immatriculation
```

### Gemma 4 AI (`src/lib/gemma4.ts`)

```typescript
// Service IA via ZAI Web Dev SDK

class Gemma4Service {
  // Chat général
  async chat(messages: Message[], options?: ChatOptions): Promise<ChatResult>
  
  // Analyse M&A
  async analyzeCompany(company: CompanyData): Promise<AnalysisResult>
  
  // Génération critères de recherche
  async generateSearchCriteria(query: string): Promise<SearchCriteria>
  
  // Résumé pipeline
  async summarizeDeals(companies: CompanyData[]): Promise<string>
  
  // Scoring ICP
  async scoreICP(company: CompanyData, profile: ICPProfile): Promise<number>
  
  // Scoring M&A léger
  async scoreCompanyMA(company: CompanyData): Promise<MAScore>
  
  // Génération email de prospection
  async generateOutreachEmail(company: CompanyData, context?: string): Promise<string>
}

export function getGemma4(): Gemma4Service
```

### Enrichissement (`src/lib/services/enrich.service.ts`)

```typescript
// Enrichissement automatique des données entreprise

export async function enrichCompany(companyId: string): Promise<EnrichResult>
export async function batchEnrich(companyIds: string[]): Promise<BatchEnrichResult>
export function checkBatchCooldown(): { canEnrich: boolean; remainingMs: number }

// Sources:
// 1. API Gouv (dirigeants, établissements, coordonnées)
// 2. InfoGreffe (données financières, juridiques)
// Merge intelligent avec déduplication
```

---

## 📊 État Actuel

### Version: 0.3.0

#### ✅ Fonctionnalités Implémentées

| Module | Fonctionnalité | État |
|--------|---------------|------|
| **Auth** | Inscription/Connexion | ✅ |
| | Reset password | ✅ |
| | Protection CSRF | ✅ |
| | Rate limiting | ✅ |
| | Account lockout | ✅ |
| **Recherche** | API Gouv | ✅ |
| | InfoGreffe | ✅ |
| | Recherche combinée | ✅ |
| | 20+ filtres | ✅ |
| **Pipeline** | Kanban 7 étapes | ✅ |
| | Drag & drop | ✅ |
| | Notes par étape | ✅ |
| **IA** | Chat Gemma 4 | ✅ |
| | Analyse M&A | ✅ |
| | Scoring ICP | ✅ |
| | Scan automatique | ✅ |
| | Emails prospection | ✅ |
| **News** | Agrégation multi-sources | ✅ |
| | 8 catégories | ✅ |
| | Alertes | ✅ |
| | Favoris | ✅ |
| | Résumé IA | ✅ |
| **Enrichissement** | API Gouv | ✅ |
| | InfoGreffe | ✅ |
| | Batch (max 10) | ✅ |
| **UI** | Thème dark/light | ✅ |
| | Responsive | ✅ |
| | Animations | ✅ |

#### 🔄 En Cours

- [ ] Multi-workspace (actuellement singleton)
- [ ] Tests E2E (Playwright)
- [ ] Déploiement production

#### ❌ Non Implémenté

- [ ] Notifications push
- [ ] Export PDF/Excel
- [ ] API REST documentée (Swagger)
- [ ] Webhook entrants
- [ ] Intégration CRM

### Dette Technique Identifiée

| Priorité | Item | Impact |
|----------|------|--------|
| P0 | Configurer email (Resend) | Reset password non fonctionnel |
| P0 | Tests unitaires | Couverture 0% → 46 tests |
| P1 | Migration PostgreSQL | SQLite ne scale pas |
| P1 | Réactiver ESLint | Règles désactivées |
| P2 | Découper CompanyProfileDialog | 904 lignes |
| P2 | Cache HTTP | Pas de caching |

---

## 🚀 Installation

### Prérequis

- Node.js 20+
- npm ou pnpm
- SQLite (dev) ou PostgreSQL (prod)

### Installation Rapide

```bash
# Cloner le projet
git clone <repo-url>
cd Dealscope_N

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Initialiser la base de données
npm run db:push
npm run db:generate

# Lancer en développement
npm run dev
```

### Variables d'Environnement

```bash
# .env

# Authentification (obligatoire)
AUTH_SECRET=<random-32-chars>

# Base de données
DATABASE_URL="file:./db/custom.db"  # SQLite
# DATABASE_URL="postgresql://user:pass@host:5432/dealscope"  # PostgreSQL

# Email (optionnel, pour reset password)
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@dealscope.fr

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# IA (optionnel, ZAI SDK déjà configuré)
# ZAI_API_KEY=xxx

# Demo (optionnel, pour seed)
SEED_DEMO_PASSWORD=<strong-password>
```

### Scripts Disponibles

```bash
# Développement
npm run dev           # Serveur dev sur port 3000
npm run build         # Build production
npm run start         # Serveur production

# Qualité
npm run lint          # ESLint
npm run lint:fix      # ESLint avec auto-fix
npm run typecheck     # TypeScript check
npm run test          # Vitest
npm run test:watch    # Vitest watch mode
npm run test:coverage # Coverage report

# Base de données
npm run db:push       # Sync schema
npm run db:generate   # Générer client
npm run db:migrate    # Créer migration
npm run db:reset      # Reset + seed
npm run db:studio     # Prisma Studio

# Switch DB
npm run db:use-sqlite    # Utiliser SQLite
npm run db:use-postgres  # Utiliser PostgreSQL
```

---

## 🔒 Sécurité

### Mesures Implémentées

| Couche | Mesure | Implémentation |
|--------|--------|----------------|
| **Auth** | Hashing mots de passe | bcryptjs, 12 rounds |
| | Sessions JWT | NextAuth v5, 24h TTL |
| | Account lockout | 5 échecs = 15min lock |
| **API** | CSRF | Double-submit cookie |
| | Rate limiting | In-memory, exponential backoff |
| | Validation | Zod sur toutes les routes |
| **Input** | Sanitization | Null byte removal, length limits |
| | ID validation | Regex alphanumeric |
| **Data** | Workspace isolation | Toutes queries par workspaceId |
| | Cascade delete | onDelete: Cascade |

### Configuration Sécurité

```typescript
// src/lib/security.ts

// Rate limiting
isRateLimited(ip, maxRequests, windowMs)
// Par défaut: 60 req/min par IP

// Account lockout (dans auth.ts)
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 min
const MAX_LOCKOUT = 4 * 60 * 60 * 1000;  // 4h max

// CSRF
validateCsrf(request)  // Vérifie header vs cookie
generateCsrfToken()    // Génère token 64 chars

// Input
sanitizeInput(input, maxLength)
isValidId(id)          // Alphanumeric + _ + -
```

### Headers de Sécurité

```typescript
// middleware.ts
headers.set('X-Content-Type-Options', 'nosniff');
headers.set('X-Frame-Options', 'DENY');
headers.set('X-XSS-Protection', '1; mode=block');
headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
headers.set('Permissions-Policy', '...');
// CSP configuré dynamiquement
```

---

## 🛣 Roadmap

### Court Terme (Sprint 1-2)

- [ ] Configurer service email (Resend)
- [ ] Ajouter tests E2E (Playwright)
- [ ] Documenter API (OpenAPI/Swagger)
- [ ] Export PDF des profils entreprise

### Moyen Terme (Sprint 3-4)

- [ ] Multi-workspace
- [ ] Intégration CRM (HubSpot, Salesforce)
- [ ] Notifications push
- [ ] Webhook API

### Long Terme

- [ ] Machine Learning pour scoring
- [ ] Intégration LinkedIn
- [ ] Mobile app (React Native)
- [ ] API publique

---

## 📝 Conventions

### Git

```
feat: ajouter scan IA d'entreprises
fix: corriger pagination chat
docs: mettre à jour README
test: ajouter tests validators
refactor: découper CompanyProfileDialog
```

### TypeScript

- `interface` pour les objets avec méthodes
- `type` pour les unions, utilitaires
- Préfixer les props privées par `_`
- Types stricts, pas de `any`

### React

- Composants fonctionnels uniquement
- Hooks en haut du composant
- State minimal, dériver le reste
- Props avec types explicites

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feat/ma-fonctionnalite`)
3. Commit (`git commit -m 'feat: ma fonctionnalité'`)
4. Push (`git push origin feat/ma-fonctionnalite`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

<div align="center">

**DealScope** - Plateforme d'Intelligence M&A

*Conçu avec ❤️ pour les professionnels de la fusion-acquisition*

</div>
