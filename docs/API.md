# API Reference

Documentation complète des endpoints API de DealScope.

---

## Base URL

```
Development: http://localhost:3000/api
Production:  https://app.dealscope.fr/api
```

## Authentification

Toutes les routes protégées nécessitent un cookie de session JWT.

```
Cookie: next-auth.session-token=<jwt>
```

## Format de Response

### Succès

```json
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 20 }
}
```

### Erreur

```json
{
  "error": "Message d'erreur en français"
}
```

---

# Auth Endpoints

## POST /api/auth/register

Créer un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123",
  "firstName": "Jean",
  "lastName": "Dupont"
}
```

**Validation:**
- `email`: email valide, max 254 chars
- `password`: min 8, max 128, majuscule + minuscule + chiffre
- `firstName`: min 1, max 100 chars
- `lastName`: min 1, max 100 chars

**Response 201:**
```json
{
  "success": true,
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "member"
  }
}
```

**Errors:**
- 400: Données invalides
- 409: Email déjà utilisé

---

## POST /api/auth/forgot-password

Demander un email de réinitialisation.

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Si un compte existe avec cet email, un lien de réinitialisation sera envoyé."
}
```

---

## POST /api/auth/reset-password

Réinitialiser le mot de passe avec un token.

**Body:**
```json
{
  "token": "abc123...",
  "password": "NouveauMotDePasse123"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Mot de passe mis à jour avec succès"
}
```

---

# Company Endpoints

## GET /api/companies

Lister les entreprises avec pagination.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Numéro de page |
| `limit` | number | 100 | Résultats par page (max 200) |

**Response 200:**
```json
{
  "companies": [
    {
      "id": "abc123",
      "siren": "123456789",
      "name": "Example SAS",
      "sector": "J",
      "revenue": 5000000,
      "employeeCount": 150,
      "icpScore": 82,
      "status": "opportunite",
      "signals": [...],
      "contacts": [...],
      "pipelineStages": [...]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 100
}
```

---

## POST /api/companies

Ajouter une entreprise au pipeline.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "siren": "123456789",
  "name": "Example SAS",
  "sector": "J",
  "nafCode": "62.01Z",
  "city": "Paris",
  "postalCode": "75001",
  "revenue": 5000000,
  "employeeCount": 150
}
```

**Response 201:**
```json
{
  "id": "abc123",
  "siren": "123456789",
  "name": "Example SAS",
  ...
}
```

---

## PATCH /api/companies

Modifier notes ou statut.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "id": "abc123",
  "notes": "Entreprise très intéressante",
  "status": "contactees",
  "icpScore": 85
}
```

**Response 200:**
```json
{
  "id": "abc123",
  "notes": "Entreprise très intéressante",
  "status": "contactees",
  ...
}
```

---

## DELETE /api/companies?id={id}

Supprimer une entreprise.

**Headers:**
- `X-CSRF-Token`: <token>

**Response 200:**
```json
{
  "success": true
}
```

---

## GET /api/companies/search

Rechercher via API Gouv.

**Query Params:**
| Param | Type | Description |
|-------|------|-------------|
| `q` | string | Terme de recherche |
| `departement` | string | Code département |
| `region` | string | Nom région |
| `sectionNaf` | string | Section NAF (A-U) |
| `codeNaf` | string | Code NAF |
| `categorieEntreprise` | string | PME, ETI, GE |
| `effectifMin` | number | Effectif minimum |
| `effectifMax` | number | Effectif maximum |
| `trancheCA` | string | Tranche CA |
| `statutEntreprise` | string | Actif, Cessé |
| `page` | number | Page (default 1) |
| `limit` | number | Limite (default 20, max 100) |

**Response 200:**
```json
{
  "results": [
    {
      "siren": "123456789",
      "name": "Example SAS",
      "sector": "J",
      "nafCode": "62.01Z",
      "city": "Paris",
      "revenue": 5000000,
      "directors": [
        { "nom": "Dupont", "prenom": "Jean" }
      ]
    }
  ],
  "total": 1000,
  "page": 1,
  "limit": 20
}
```

---

## GET /api/companies/combined-search

Recherche combinée API Gouv + InfoGreffe.

**Query Params:** Même que `/search`

**Response 200:**
```json
{
  "results": [
    {
      "siren": "123456789",
      "name": "Example SAS",
      "sector": "J",
      "nafCode": "62.01Z",
      "city": "Paris",
      "revenue": 5000000,
      "employeeCount": 150,
      "directors": [...],
      "caHistory": [
        { "year": "2023", "ca": 5000000, "resultat": 500000 },
        { "year": "2022", "ca": 4500000, "resultat": 400000 }
      ],
      "statut": "Active",
      "dateImmatriculation": "2010-01-15",
      "source": "combined"
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

---

## GET /api/companies/enrich?id={id}

Enrichir une entreprise.

**Response 200:**
```json
{
  "id": "abc123",
  "isEnriched": true,
  "enrichedData": {
    "apiGouv": { ... },
    "infogreffe": { ... },
    "financial": { ... }
  }
}
```

---

# Pipeline Endpoints

## GET /api/pipeline

Données du pipeline Kanban.

**Response 200:**
```json
{
  "identifiees": [
    { "id": "abc", "name": "Company 1", "icpScore": 65 }
  ],
  "a_contacter": [...],
  "contactees": [...],
  "qualifiees": [...],
  "opportunite": [...],
  "deal": [...],
  "annule": [...]
}
```

---

## PUT /api/pipeline

Déplacer une entreprise.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "companyId": "abc123",
  "stage": "contactees",
  "notes": "Premier contact effectué"
}
```

**Response 200:**
```json
{
  "success": true,
  "company": { ... }
}
```

---

# Chat Endpoints

## GET /api/chat

Historique des messages.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `limit` | number | 100 | Max messages |
| `before` | string | - | Cursor pagination |

**Response 200:**
```json
{
  "messages": [
    { "id": "abc", "role": "user", "content": "Bonjour" },
    { "id": "def", "role": "assistant", "content": "Bonjour! Comment puis-je vous aider?" }
  ],
  "hasMore": false,
  "nextCursor": null,
  "suggestedPrompts": [...]
}
```

---

## POST /api/chat

Envoyer un message (SSE).

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "message": "Analyse l'entreprise Example SAS"
}
```

**Response (Server-Sent Events):**
```
data: {"content": "Je vais analyser..."}

data: {"content": "Example SAS est une entreprise..."}

data: {"content": "...", "suggestedPrompts": [...]}

data: [DONE]
```

---

# News Endpoints

## GET /api/news

Liste des actualités M&A.

**Query Params:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `category` | string | all | Catégorie (ma, tech, finance, etc.) |
| `search` | string | - | Recherche full-text |
| `limit` | number | 50 | Max résultats |

**Response 200:**
```json
{
  "news": [
    {
      "id": "abc",
      "title": "Acquisition de Company par Group",
      "snippet": "...",
      "url": "https://...",
      "source": "Google News",
      "category": "ma",
      "date": "2024-01-15"
    }
  ],
  "categories": ["ma", "tech", "finance", ...]
}
```

---

## POST /api/news/alerts

Créer une alerte.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "name": "Alerte Tech",
  "type": "keyword",
  "keywords": ["fusions", "tech", "SaaS"]
}
```

**Response 201:**
```json
{
  "id": "alert123",
  "name": "Alerte Tech",
  "type": "keyword",
  "keywords": ["fusions", "tech", "SaaS"],
  "isActive": true
}
```

---

## POST /api/news/bookmarks

Ajouter un favori.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "articleId": "abc",
  "notes": "À relire plus tard"
}
```

---

# Scan Endpoints

## POST /api/scan

Scan IA d'entreprises.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "query": "Entreprises tech en Île-de-France avec CA > 10M€",
  "sector": "J",
  "icpProfileId": "icp123"
}
```

**Response 200:**
```json
{
  "success": true,
  "total": 25,
  "processed": 25,
  "companies": [
    {
      "siren": "123456789",
      "name": "Found Company",
      "icpScore": 85,
      "added": true
    }
  ]
}
```

---

# ICP Profile Endpoints

## GET /api/icp-profiles

Lister les profils ICP.

**Response 200:**
```json
{
  "profiles": [
    {
      "id": "icp123",
      "name": "Tech SaaS B2B",
      "criteria": {
        "sectors": ["J", "M"],
        "revenueMin": 1000000,
        "employeeMax": 200
      },
      "weights": {
        "sector": 30,
        "revenue": 25,
        "growth": 25,
        "team": 20
      },
      "isActive": true
    }
  ]
}
```

---

## POST /api/icp-profiles

Créer un profil ICP.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "name": "Grande Entreprise",
  "criteria": {
    "sectors": ["J", "M", "K"],
    "revenueMin": 5000000
  },
  "weights": {
    "sector": 25,
    "revenue": 30,
    "innovation": 25,
    "location": 20
  }
}
```

---

# Dashboard Endpoints

## GET /api/dashboard/stats

Statistiques du dashboard.

**Response 200:**
```json
{
  "totalCompanies": 150,
  "pipelineByStage": {
    "identifiees": 50,
    "a_contacter": 30,
    "contactees": 25,
    "qualifiees": 20,
    "opportunite": 15,
    "deal": 8,
    "annule": 2
  },
  "topSectors": [
    { "sector": "J", "count": 60 },
    { "sector": "M", "count": 40 }
  ],
  "avgIcpScore": 68,
  "totalSignals": 120,
  "totalContacts": 45,
  "recentCompanies": [...]
}
```

---

# User Endpoints

## GET /api/user/profile

Profil utilisateur.

**Response 200:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "role": "admin",
  "workspace": {
    "id": "ws123",
    "name": "Mon Workspace",
    "plan": "premium"
  }
}
```

---

## PATCH /api/user/profile

Modifier le profil.

**Headers:**
- `X-CSRF-Token`: <token>

**Body:**
```json
{
  "firstName": "Jean-Pierre",
  "email": "new@example.com",
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

---

# Error Codes

| Code | Message |
|------|---------|
| 400 | Données invalides |
| 401 | Non authentifié |
| 403 | Accès refusé / CSRF invalide |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon) |
| 429 | Trop de requêtes |
| 500 | Erreur interne |

---

# Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| GET requests | 60/min per IP |
| POST mutations | 20/min per IP |
| DELETE | 30/min per IP |
| Chat | 10/min per IP |
| Scan | 5/min per IP |
| Auth attempts | 5/5min per IP |
