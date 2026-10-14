// ponytail: in-memory, per-instance; move to Upstash/Redis if deployed with >1 instance

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  limit?: number;
  windowMs?: number;
  now?: () => number;
  maxKeys?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec?: number;
}

export const MAX_KEYS = 5000;
export const DEFAULT_LIMIT = 3;
export const DEFAULT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)

const defaultStore = new Map<string, RateLimitEntry>();

/**
 * Pure function to check rate limits against a store and timestamp.
 * Allows 3 submissions per 10-minute window by default, returning retryAfterSec when exceeded.
 */
export function checkRateLimit(
  key: string,
  store: Map<string, RateLimitEntry> = defaultStore,
  now: number = Date.now(),
  options: RateLimiterOptions = {},
): RateLimitResult {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const maxKeys = options.maxKeys ?? MAX_KEYS;
  const existing = store.get(key);

  if (!existing || now >= existing.resetAt) {
    // Keep memory bounded: at the cap, sweep expired windows, then evict oldest insertions.
    if (!existing && store.size >= maxKeys) {
      for (const [k, entry] of store) if (now >= entry.resetAt) store.delete(k);
      for (const k of store.keys()) {
        if (store.size < maxKeys) break;
        store.delete(k);
      }
    }
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      success: true,
      remaining: limit - 1,
      resetAt,
      retryAfterSec: 0,
    };
  }

  if (existing.count < limit) {
    existing.count += 1;
    return {
      allowed: true,
      success: true,
      remaining: limit - existing.count,
      resetAt: existing.resetAt,
      retryAfterSec: 0,
    };
  }

  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: false,
    success: false,
    remaining: 0,
    resetAt: existing.resetAt,
    retryAfterSec,
  };
}

/**
 * Pure factory function to create a fixed-window rate limiter keyed by identifier (e.g. IP).
 * Accepts limit, windowMs, and now timestamp provider for deterministic testing.
 */
export function createRateLimiter(options: RateLimiterOptions = {}) {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const getNow = options.now ?? (() => Date.now());
  const maxKeys = options.maxKeys ?? MAX_KEYS;
  const store = new Map<string, RateLimitEntry>();

  function check(key: string, timestamp?: number): RateLimitResult {
    const now = timestamp ?? getNow();
    return checkRateLimit(key, store, now, { limit, windowMs, maxKeys });
  }

  function reset(): void {
    store.clear();
  }

  return {
    check,
    reset,
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/** Default instance: 3 submissions per 10 minutes */
export const rateLimiter = createRateLimiter();
export default rateLimiter;
