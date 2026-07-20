// ============================================================
// api-cache.ts — Stale-While-Revalidate cache for Clario API
// ============================================================
// Strategy:
//  1. On first fetch — call network, store result with timestamp.
//  2. On subsequent fetches within TTL — return cache instantly.
//  3. After TTL — return stale data immediately AND kick off a
//     background refresh so next read is fresh.
//  4. Mutations (POST/PUT/DELETE) — invalidate relevant keys.
// ============================================================

interface CacheEntry<T> {
  data: T;
  ts: number;          // when it was stored (ms)
  ttl: number;         // how long it's "fresh" (ms)
  revalidating: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

// Pending promises for in-flight requests — prevents duplicate fetches
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const inflight = new Map<string, Promise<any>>();

// ── TTL presets (ms) ─────────────────────────────────────────
export const TTL = {
  ACTIVE:    5_000,   // live focus session — refresh quickly
  LIVE:      10_000,  // today's stats, streak
  SHORT:     30_000,  // weekly charts, recent data
  MEDIUM:    60_000,  // tasks, slots, journal entries
  LONG:      300_000, // user profile, categories (5 min)
} as const;

// ── Cache-aware fetch wrapper ─────────────────────────────────
export async function cachedGet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = TTL.SHORT
): Promise<T> {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  const now = Date.now();

  // ① Cache hit and still fresh — return immediately
  if (entry && now - entry.ts < entry.ttl) {
    return entry.data;
  }

  // ② Cache hit but stale — return stale data + revalidate in background
  if (entry && !entry.revalidating) {
    entry.revalidating = true;
    _fetch(key, fetcher, ttl).catch(() => {
      // Reset revalidating flag so it can retry
      const e = store.get(key);
      if (e) e.revalidating = false;
    });
    return entry.data;
  }

  // ③ In-flight deduplication — return the same promise
  if (inflight.has(key)) {
    return inflight.get(key)! as Promise<T>;
  }

  // ④ Cache miss — fetch and store
  const promise = _fetch<T>(key, fetcher, ttl);
  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

async function _fetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  const data = await fetcher();
  store.set(key, { data, ts: Date.now(), ttl, revalidating: false });
  return data;
}

// ── Invalidation helpers ──────────────────────────────────────

/** Invalidate a specific cache key */
export function invalidate(key: string) {
  store.delete(key);
}

/** Invalidate all keys that start with a prefix */
export function invalidatePrefix(prefix: string) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

/** Invalidate everything */
export function invalidateAll() {
  store.clear();
}

// ── Cache-key helpers (avoids typos) ─────────────────────────
export const KEY = {
  focusActive:          () => "focus:active",
  focusTodayStats:      () => "focus:stats:today",
  focusWeekly:          () => "focus:stats:weekly",
  focusHeatmap:         (m: number, y: number) => `focus:heatmap:${m}:${y}`,
  focusSubjects:        (days: number) => `focus:subjects:${days}`,
  focusStreak:          () => "focus:streak",
  focusSessions:        (date: string) => `focus:sessions:${date}`,

  journalToday:         () => "journal:today",
  journalDate:          (d: string) => `journal:date:${d}`,
  journalHistory:       (l: number, o: number) => `journal:history:${l}:${o}`,

  revisionDue:          () => "revision:due",
  revisionTopics:       () => "revision:topics",
  revisionTopic:        (id: string) => `revision:topic:${id}`,
  revisionStats:        () => "revision:stats",
  revisionQueue:        () => "revision:queue",
  revisionTree:         () => "revision:tree",

  tasks:                (date: string) => `tasks:${date}`,
  slots:                (date: string) => `slots:${date}`,

  analyticsDay:         (date: string) => `analytics:day:${date}`,
  analyticsWeek:        (date: string) => `analytics:week:${date}`,
  weeklyTrend:          (date: string) => `analytics:trend:${date}`,
  heatmap:              (m: number, y: number) => `analytics:heatmap:${m}:${y}`,

  aiInsights:           () => "ai:insights",
  report:               (s: string, e: string) => `report:${s}:${e}`,

  userProfile:          () => "user:profile",
  userCategories:       () => "user:categories",
};
