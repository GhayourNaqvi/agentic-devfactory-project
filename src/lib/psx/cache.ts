import type { CacheEntry } from "./types";

interface InternalEntry<T> extends CacheEntry<T> {
  lastAccessedAt: number;
}

export class PsxCache<T> {
  private store = new Map<string, InternalEntry<T>>();
  private ttlMs: number;
  private maxEntries: number;

  constructor(ttlMs: number, maxEntries = 500) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.fetchedAt.getTime();
    if (age > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    entry.lastAccessedAt = Date.now();
    return { data: entry.data, fetchedAt: entry.fetchedAt, source: entry.source };
  }

  set(key: string, data: T, source: string): void {
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      this.evictLru();
    }

    this.store.set(key, {
      data,
      fetchedAt: new Date(),
      source,
      lastAccessedAt: Date.now(),
    });
  }

  invalidate(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }

  getAge(key: string): number | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return (Date.now() - entry.fetchedAt.getTime()) / 1000;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictLru(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.lastAccessedAt < lruTime) {
        lruTime = entry.lastAccessedAt;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.store.delete(lruKey);
    }
  }
}
