import type { CacheEntry } from "./types";

export class PsxCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  get(key: string): CacheEntry<T> | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.fetchedAt.getTime();
    if (age > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return entry;
  }

  set(key: string, data: T, source: string): void {
    this.store.set(key, {
      data,
      fetchedAt: new Date(),
      source,
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
}
