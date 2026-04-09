# Guide de Développement

Ce guide contient les conventions et bonnes pratiques pour développer sur DealScope.

---

## 1. Environnement de Développement

### 1.1 Setup Initial

```bash
# 1. Cloner et installer
git clone <repo>
cd Dealscope_N
npm install

# 2. Configurer .env
cp .env.example .env
# Éditer avec vos valeurs

# 3. Initialiser la DB
npm run db:push
npm run db:generate

# 4. Lancer le serveur
npm run dev
```

### 1.2 IDE Recommandé

**VS Code** avec extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- TypeScript

### 1.3 Structure de Branche

```
main            # Production
  └── develop   # Intégration
       ├── feat/ma-fonctionnalite
       ├── fix/mon-bug
       └── refactor/mon-refactor
```

---

## 2. Conventions de Code

### 2.1 TypeScript

```typescript
// ✅ Bon
interface User {
  id: string;
  email: string;
}

function getUser(id: string): Promise<User | null> {
  return db.user.findUnique({ where: { id } });
}

// ❌ Éviter
function getUser(id: any): any {
  return db.user.findUnique({ where: { id } });
}
```

### 2.2 Nommage

| Type | Convention | Exemple |
|------|------------|---------|
| Fichiers composants | PascalCase | `SearchTab.tsx` |
| Fichiers utilitaires | camelCase | `api-client.ts` |
| Composants | PascalCase | `SearchTab` |
| Fonctions | camelCase | `fetchCompanies` |
| Constantes | SCREAMING_SNAKE | `MAX_RESULTS` |
| Types | PascalCase | `SearchFilters` |
| Interfaces | PascalCase | `ICompany` (optionnel) |

### 2.3 Imports

```typescript
// 1. React/Next
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Librairies externes
import { z } from 'zod';
import { motion } from 'framer-motion';

// 3. Internes - Types
import type { Company } from '@/lib/types';

// 4. Internes - Lib
import { db } from '@/lib/db';
import { apiFetch } from '@/lib/api-client';

// 5. Internes - Components
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/dealscope/Sidebar';

// 6. Relatifs
import { localHelper } from './utils';
```

### 2.4 Composants React

```tsx
// Template composant standard
interface MyComponentProps {
  title: string;
  optional?: boolean;
  onAction: (id: string) => void;
}

export function MyComponent({ title, optional = false, onAction }: MyComponentProps) {
  const [state, setState] = useState<string>('');
  const isLoading = false;

  // Handlers
  const handleClick = () => {
    onAction('123');
  };

  // Early returns
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Render
  return (
    <div className="...">
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

---

## 3. API Routes

### 3.1 Structure Standard

```typescript
// src/app/api/resource/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-guard';
import { validateCsrf, isRateLimited, safeErrorResponse } from '@/lib/security';
import { mySchema } from '@/validators';

// GET /api/resource
export async function GET(request: NextRequest) {
  // 1. Auth
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // 2. Rate limit
  if (isRateLimited getClientIp(request), 60, 60000)) {
    return rateLimitedResponse();
  }

  // 3. Logique
  try {
    const data = await db.resource.findMany({
      where: { workspaceId: authResult.workspaceId },
    });

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API] Error:', error);
    return safeErrorResponse('Erreur interne', 500);
  }
}

// POST /api/resource
export async function POST(request: NextRequest) {
  // 1. Auth
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // 2. CSRF (pour mutations)
  if (!validateCsrf(request)) {
    return NextResponse.json({ error: 'CSRF invalide' }, { status: 403 });
  }

  // 3. Validation
  const body = await request.json();
  const parsed = mySchema.safeParse(body);
  
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  // 4. Logique
  try {
    const created = await db.resource.create({
      data: { ...parsed.data, workspaceId: authResult.workspaceId },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[API] Error:', error);
    return safeErrorResponse('Erreur création', 500);
  }
}
```

### 3.2 Checklist API Route

- [ ] Authentification (`requireAuth` ou `requireAdmin`)
- [ ] Rate limiting (GET: 60/min, POST: 20/min)
- [ ] CSRF (pour mutations)
- [ ] Validation Zod
- [ ] Sanitization inputs
- [ ] Workspace isolation
- [ ] Error handling
- [ ] Logging

---

## 4. Tests

### 4.1 Structure des Tests

```
src/lib/__tests__/
├── validators.test.ts
├── password.test.ts
├── security.test.ts
└── email.test.ts
```

### 4.2 Template Test

```typescript
// src/lib/__tests__/my-function.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myFunction } from '../my-function';

describe('myFunction', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  it('should return expected value for valid input', () => {
    const result = myFunction('valid');
    expect(result).toBe('expected');
  });

  it('should throw for invalid input', () => {
    expect(() => myFunction('')).toThrow();
  });
});
```

### 4.3 Commandes Test

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## 5. Base de Données

### 5.1 Créer un Modèle

1. Éditer `prisma/schema.prisma`:

```prisma
model MyModel {
  id          String   @id @default(cuid())
  workspaceId String
  name        String
  createdAt   DateTime @default(now())
  
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  
  @@index([workspaceId])
}
```

2. Générer la migration:

```bash
npm run db:migrate -- --name add_my_model
```

### 5.2 Requêtes Prisma

```typescript
// Create
const created = await db.myModel.create({
  data: { workspaceId, name: 'Test' },
});

// Read
const found = await db.myModel.findFirst({
  where: { id, workspaceId },
  include: { workspace: true },
});

// Update
const updated = await db.myModel.update({
  where: { id },
  data: { name: 'Updated' },
});

// Delete
await db.myModel.delete({ where: { id } });

// Transaction
await db.$transaction(async (tx) => {
  await tx.myModel.create({ data: {...} });
  await tx.other.update({ where: {...}, data: {...} });
});
```

---

## 6. Debugging

### 6.1 Logs Serveur

```typescript
// Bonnes pratiques
console.log('[ModuleName] Action:', data);      // INFO
console.warn('[ModuleName] Warning:', issue);   // WARN
console.error('[ModuleName] Error:', error);    // ERROR
```

### 6.2 Debug Next.js

```bash
# Debug mode
NODE_OPTIONS='--inspect' npm run dev

# Puis dans Chrome: chrome://inspect
```

### 6.3 Debug Prisma

```typescript
// Activer les logs Prisma
const db = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});
```

---

## 7. Performance

### 7.1 Optimisations React

```tsx
// ✅ Memo pour calculs coûteux
const sortedCompanies = useMemo(
  () => companies.sort((a, b) => b.icpScore - a.icpScore),
  [companies]
);

// ✅ Callback pour handlers dans les listes
const handleClick = useCallback(
  (id: string) => selectCompany(id),
  [selectCompany]
);

// ❌ Éviter les re-renders inutiles
// Pas de fonctions inline dans render
<button onClick={() => doSomething()}>  // ❌
<button onClick={handleClick}>           // ✅
```

### 7.2 Optimisations API

```typescript
// ✅ Parallel fetching
const [companies, stats] = await Promise.all([
  db.targetCompany.findMany({ where }),
  db.targetCompany.count({ where }),
]);

// ✅ Select seulement les champs nécessaires
const companies = await db.targetCompany.findMany({
  select: { id: true, name: true, icpScore: true },
});

// ✅ Pagination
const companies = await db.targetCompany.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

---

## 8. Git Workflow

### 8.1 Commits

```
feat: ajouter export PDF des entreprises
fix: corriger pagination dans la recherche
docs: mettre à jour README
test: ajouter tests pour validators
refactor: simplifier la logique de scoring
perf: optimiser le chargement des entreprises
chore: mettre à jour les dépendances
```

### 8.2 Pull Request

1. Créer une branche depuis `develop`
2. Développer + tests
3. `npm run lint && npm run typecheck && npm run test`
4. Pousser et créer PR
5. Attendre review
6. Squash et merge

---

## 9. Ressources

### 9.1 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Zod Docs](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Radix UI](https://www.radix-ui.com/primitives)

### 9.2 APIs Externes

- [API Gouv](https://recherche-entreprises.api.gouv.fr/docs/)
- [InfoGreffe](https://opendata.datainfogreffe.fr/explore/)
- [ZAI SDK](https://docs.z.ai/)

---

*Ce guide est évolutif. Proposer des améliorations via PR.*
