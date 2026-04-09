# Architecture de Sécurité - DealScope

## 📋 Vue d'ensemble

Ce document décrit l'architecture de sécurité bancaire implémentée dans DealScope, conçue pour être modulaire, maintenable et production-ready.

## 🏗️ Structure du Module de Sécurité

```
src/lib/security/
├── core/
│   ├── index.ts           # Export centralisé
│   ├── constants.ts       # Constantes de sécurité (rate limits, longueurs max, etc.)
│   ├── types.ts          # Types TypeScript pour la sécurité
│   ├── crypto.ts         # Fonctions cryptographiques (tokens, CSRF, constant-time comparison)
│   ├── sanitizer.ts      # Sanitization des entrées (XSS, SQL injection, etc.)
│   ├── rate-limiter.ts   # Rate limiting avec store mémoire optimisé
│   ├── audit-logger.ts   # Audit logging bancaire complet
│   ├── security-context.ts # Extraction du contexte de sécurité (IP, User-Agent, etc.)
│   └── security-check.ts  # Vérifications de sécurité centralisées
├── guards.ts             # Garde-fous d'authentification et d'autorisation
├── middleware-helpers.ts # Helpers pour le middleware Next.js
└── index.ts             # Export principal avec aliases de compatibilité
```

## 🔐 Composants de Sécurité

### 1. Rate Limiting (rate-limiter.ts)

- **Store mémoire optimisé** avec cleanup automatique
- **Limite configurable** par endpoint et par IP
- **Pénalités exponentielles** pour les abus (jusqu'à 1 heure)
- **Protection contre le déni de service** avec limite de store (10,000 entrées)

```typescript
import { checkRateLimit } from '@/lib/security';

const result = checkRateLimit(clientIp, {
  maxRequests: 20,
  windowMs: 60000,
  keyPrefix: 'api'
});
```

### 2. Audit Logging (audit-logger.ts)

- **Logging structuré** de tous les événements de sécurité
- **Événements trackés** :
  - Authentification (succès/échec/verrouillage)
  - CSRF failures
  - Rate limiting
  - Erreurs de validation
  - Échecs d'autorisation
  - Activités suspectes
  - Opérations CRUD
- **Buffer circulaire** (1000 entrées max)
- **Abonnements** pour externalisation vers SIEM

```typescript
import { logAuthSuccess, logCrudOperation } from '@/lib/security';

logAuthSuccess(userId, ip, 'login');
logCrudOperation('create', userId, workspaceId, ip, 'company', companyId, true);
```

### 3. Sanitization (sanitizer.ts)

- **Détection automatique** des patterns dangereux :
  - XSS (scripts, handlers d'événements)
  - SQL Injection
  - Path Traversal
  - Null bytes
- **Sanitization profonde** des objets imbriqués (jusqu'à 10 niveaux)
- **Validation des URLs** (protocoles dangereux bloqués)
- **Sanitization des logs** (injections de newline bloquées)

```typescript
import { sanitizeString, sanitizeObject, detectSqlInjection } from '@/lib/security';

const safe = sanitizeString(userInput, { maxLength: 500, stripNullBytes: true });
const clean = sanitizeObject(data, { allowHtml: false, strictMode: true });
```

### 4. Cryptographie (crypto.ts)

- **Génération sécurisée** de tokens (randomBytes)
- **Comparaison en temps constant** (timing-safe comparison)
- **Obfuscation** des valeurs sensibles dans les logs

```typescript
import { generateCsrfToken, validateTokenConstantTime } from '@/lib/security';

const token = generateCsrfToken();
const isValid = validateTokenConstantTime(headerToken, cookieToken);
```

### 5. Garde-fous d'Authentification (guards.ts)

- **requireAuth()** - Authentification requise
- **requireAdmin()** - Rôle admin requis
- **requireWorkspaceMember()** - Membre du workspace
- **requireValidId()** - Validation d'ID

```typescript
import { requireAuth, requireAdmin } from '@/lib/security';

const user = await requireAuth(request);
if (user instanceof NextResponse) return user; // Erreur 401
```

### 6. Vérifications Centralisées (security-check.ts)

- **performSecurityChecks()** - Vérifications combinées :
  - CSRF
  - Rate limiting
  - Taille du body
  - Validation de l'origine

```typescript
import { performSecurityChecks } from '@/lib/security';

const securityCheck = await performSecurityChecks(request, {
  requireCsrf: true,
  rateLimit: { maxRequests: 20, windowMs: 60000 },
  maxBodySize: 1024 * 1024
});

if (!securityCheck.passed) return securityCheck.response!;
```

## 📊 Validators (src/lib/validators/)

Structure unifiée des schémas de validation Zod :

```
src/lib/validators/
├── schemas.ts      # Schémas de base (email, password, ID, etc.)
├── company.ts      # Validators pour entreprises
├── chat.ts         # Validators pour chat
├── news.ts         # Validators pour news/alertes
└── index.ts        # Export centralisé
```

### Schémas disponibles

- `securePasswordSchema` - Mot de passe sécurisé (8-128 chars, maj, min, chiffre)
- `emailSchema` - Email validé et normalisé
- `idSchema` - ID sécurisé (pattern alphanumérique)
- `sirenSchema` / `siretSchema` - Identifiants français
- `createCompanySchema` / `updateCompanySchema` - Validation des entreprises

## 🔒 Mesures de Sécurité Implémentées

### Protection contre les attaques

| Attaque | Protection | Implémentation |
|---------|-----------|----------------|
| Brute Force | Rate limiting + verrouillage compte | `rate-limiter.ts` + `auth.ts` |
| CSRF | Double-submit cookie pattern | `security-context.ts` + middleware |
| XSS | Sanitization des entrées | `sanitizer.ts` |
| SQL Injection | Détection + Zod validation | `sanitizer.ts` + validators |
| DoS | Rate limiting global + limite taille | `rate-limiter.ts` + middleware |
| Timing Attack | Comparaison constant-time | `crypto.ts` |
| Path Traversal | Détection des patterns | `sanitizer.ts` |

### Headers de sécurité

- **Content-Security-Policy** - CSP strict avec exceptions minimales
- **X-Content-Type-Options** - `nosniff`
- **Referrer-Policy** - `strict-origin-when-cross-origin`
- **Permissions-Policy** - Désactivation des APIs sensibles
- **Strict-Transport-Security** - HSTS en production uniquement

### Session et cookies

- **JWT strategy** avec expiration 24h
- **Cookies httpOnly** en production
- **Cookies sécurisés** avec prefix `__Secure-` en production
- **SameSite=lax** pour protection CSRF

## 📈 Audit et Monitoring

### Logs d'audit

Tous les événements de sécurité sont loggés avec :

```typescript
{
  timestamp: Date,
  eventType: SecurityEvent,
  action: AuthAction | CrudAction,
  userId?: string,
  workspaceId?: string,
  ip: string,
  userAgent?: string,
  resource?: string,
  resourceId?: string,
  success: boolean,
  message: string,
  metadata?: Record<string, unknown>
}
```

### Événements trackés

- `auth_success` / `auth_failure` / `auth_locked`
- `csrf_failure`
- `rate_limited`
- `validation_error`
- `authorization_failure`
- `suspicious_activity`

## 🚀 Bonnes Pratiques

### Pour les développeurs

1. **Toujours utiliser** `performSecurityChecks()` en début de route API
2. **Toujours valider** avec les schémas Zod avant traitement
3. **Toujours sanitizer** les données utilisateur avec `sanitizeString()`
4. **Toujours logger** les opérations sensibles avec `logCrudOperation()`
5. **Jamais exposer** les erreurs internes en production

### Exemple de route API sécurisée

```typescript
import { performSecurityChecks, createErrorResponse } from '@/lib/security';
import { requireAuth } from '@/lib/security/guards';
import { sanitizeString } from '@/lib/security/core/sanitizer';
import { logCrudOperation } from '@/lib/security/core/audit-logger';
import { createCompanySchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  // 1. Vérifications de sécurité
  const securityCheck = await performSecurityChecks(request, {
    requireCsrf: true,
    rateLimit: { maxRequests: 20, windowMs: 60000 }
  });
  if (!securityCheck.passed) return securityCheck.response!;

  // 2. Authentification
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  // 3. Validation
  const body = await request.json();
  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }

  // 4. Sanitization
  const safeData = {
    name: sanitizeString(parsed.data.name, { maxLength: 500 }),
    // ...
  };

  // 5. Traitement
  try {
    const result = await createCompany(safeData);
    
    // 6. Audit logging
    logCrudOperation('create', authResult.id, authResult.workspaceId, 
                     securityCheck.ip, 'company', result.id, true);
    
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return createErrorResponse('Erreur lors de la création', 500);
  }
}
```

## 🔧 Configuration

### Variables d'environnement requises

```env
AUTH_SECRET=your-32-char-minimum-secret-key
DATABASE_URL=your-database-url
NEXT_PUBLIC_APP_URL=https://your-app.com
NODE_ENV=production
```

### Constantes configurables (constants.ts)

- `RATE_LIMIT.MAX_STORE_SIZE` - Taille max du store (default: 10000)
- `PASSWORD.MAX_FAILED_ATTEMPTS` - Tentatives avant verrouillage (default: 5)
- `PASSWORD.BASE_LOCKOUT_MS` - Durée de verrouillage (default: 15 min)
- `BODY.MAX_SIZE_BYTES` - Taille max des requêtes (default: 1 MB)

## 📝 Maintenance

### Mise à jour des dépendances

```bash
npm audit
npm outdated
npm update
```

### Vérification des logs

Les logs d'audit sont disponibles via :

```typescript
import { getRecentLogs } from '@/lib/security';

const recentLogs = getRecentLogs(100); // 100 derniers logs
```

### Tests de sécurité

```bash
npm run test:security  # Tests spécifiques sécurité
npm run typecheck      # Vérification des types
npm run lint          # Linting
```

## ✅ Checklist Production

- [ ] `AUTH_SECRET` défini et >= 32 caractères
- [ ] `NODE_ENV=production`
- [ ] HTTPS activé
- [ ] Cookies sécurisés configurés
- [ ] Rate limiting adapté à la charge
- [ ] Logs externalisés (SIEM)
- [ ] Monitoring des alertes de sécurité
- [ ] Sauvegardes de la DB chiffrées
- [ ] Plan de réponse aux incidents

## 📚 Références

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NextAuth.js Security](https://next-auth.js.org/configuration/options)
- [Zod Validation](https://zod.dev/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
