import { SECURITY_CONSTANTS } from './constants';
import type { RateLimitEntry, RateLimitStore, RateLimitKey } from './types';

class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<RateLimitKey, RateLimitEntry>();
  private maxEntries = SECURITY_CONSTANTS.RATE_LIMIT.MAX_STORE_SIZE;

  get(key: RateLimitKey): RateLimitEntry | undefined {
    return this.store.get(key);
  }

  set(key: RateLimitKey, value: RateLimitEntry): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.cleanup();
    }
    this.store.set(key, value);
  }

  delete(key: RateLimitKey): void {
    this.store.delete(key);
  }

  size(): number {
    return this.store.size;
  }

  entries(): IterableIterator<[RateLimitKey, RateLimitEntry]> {
    return this.store.entries();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }

    if (this.store.size >= this.maxEntries) {
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
      const toDelete = entries.slice(0, Math.floor(this.maxEntries / 2));
      for (const [key] of toDelete) {
        this.store.delete(key);
      }
    }
  }
}

let globalStore: RateLimitStore | null = null;
let cleanupStarted = false;

function getGlobalStore(): RateLimitStore {
  if (!globalStore) {
    globalStore = new MemoryRateLimitStore();
  }
  return globalStore;
}

function scheduleCleanup(store: RateLimitStore): void {
  if (cleanupStarted) return;
  cleanupStarted = true;

  if (typeof setInterval === 'function') {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) {
          store.delete(key);
        }
      }
    }, SECURITY_CONSTANTS.RATE_LIMIT.CLEANUP_INTERVAL_MS);
  }
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  store: RateLimitStore = getGlobalStore()
): RateLimitResult {
  scheduleCleanup(store);

  const now = Date.now();
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;

  if (store.size() >= SECURITY_CONSTANTS.RATE_LIMIT.MAX_STORE_SIZE && !store.get(key)) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + config.windowMs,
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  const entry = store.get(key);

  if (entry?.blockedUntil && now < entry.blockedUntil) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.count++;

  if (entry.count > config.maxRequests) {
    const penaltyMs = Math.min(
      config.windowMs * Math.pow(2, Math.min(entry.count - config.maxRequests, SECURITY_CONSTANTS.RATE_LIMIT.MAX_BACKOFF_EXPONENT)),
      SECURITY_CONSTANTS.RATE_LIMIT.MAX_PENALTY_MS
    );
    entry.blockedUntil = now + penaltyMs;
    entry.resetAt = now + penaltyMs;

    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.blockedUntil,
      retryAfter: Math.ceil(penaltyMs / 1000),
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

export function isRateLimited(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = SECURITY_CONSTANTS.RATE_LIMIT.DEFAULT_WINDOW_MS,
  store?: RateLimitStore
): boolean {
  const result = checkRateLimit(identifier, { maxRequests, windowMs }, store);
  return !result.allowed;
}

export function resetRateLimit(identifier: string, store: RateLimitStore = getGlobalStore()): void {
  store.delete(identifier);
}

export function getRateLimitStore(): RateLimitStore {
  return getGlobalStore();
}

export { MemoryRateLimitStore };
