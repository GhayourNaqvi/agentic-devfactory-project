import { describe, it, expect, beforeEach } from "vitest";
import { PsxCache } from "../cache";

describe("PsxCache", () => {
  let cache: PsxCache<string>;

  beforeEach(() => {
    cache = new PsxCache<string>(100);
  });

  it("returns null for missing key", () => {
    expect(cache.get("nonexistent")).toBeNull();
  });

  it("stores and retrieves value within TTL", () => {
    cache.set("key1", "value1", "test-source");
    const entry = cache.get("key1");

    expect(entry).not.toBeNull();
    expect(entry?.data).toBe("value1");
    expect(entry?.source).toBe("test-source");
  });

  it("returns null after TTL expires", async () => {
    cache.set("key1", "value1", "test-source");
    await new Promise((r) => setTimeout(r, 150));

    expect(cache.get("key1")).toBeNull();
  });

  it("returns correct cache age", () => {
    cache.set("key1", "value1", "test-source");
    const age = cache.getAge("key1");

    expect(age).not.toBeNull();
    expect(age!).toBeGreaterThanOrEqual(0);
    expect(age!).toBeLessThan(1);
  });

  it("returns null age for missing key", () => {
    expect(cache.getAge("nonexistent")).toBeNull();
  });

  it("invalidates single key", () => {
    cache.set("key1", "value1", "test-source");
    cache.set("key2", "value2", "test-source");

    cache.invalidate("key1");

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).not.toBeNull();
  });

  it("invalidates all keys when no key specified", () => {
    cache.set("key1", "value1", "test-source");
    cache.set("key2", "value2", "test-source");

    cache.invalidate();

    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBeNull();
  });
});
