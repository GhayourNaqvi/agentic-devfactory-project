import { describe, it, expect, beforeEach } from "vitest";
import { TokenBucket, PerSourceRateLimiter, RateLimiterError } from "../rate-limiter";

describe("TokenBucket", () => {
  let bucket: TokenBucket;

  beforeEach(() => {
    bucket = new TokenBucket({
      capacity: 5,
      refillRate: 1,
      refillIntervalMs: 50,
    });
  });

  it("should allow requests up to capacity", async () => {
    for (let i = 0; i < 5; i++) {
      await expect(bucket.acquire()).resolves.toBeUndefined();
    }
  });

  it("should timeout when bucket is empty", async () => {
    for (let i = 0; i < 5; i++) {
      await bucket.acquire();
    }

    await expect(bucket.acquire({ timeoutMs: 100 })).rejects.toThrow(RateLimiterError);
  });

  it("should process queued requests after refill", async () => {
    for (let i = 0; i < 5; i++) {
      await bucket.acquire();
    }

    const acquirePromise = bucket.acquire({ timeoutMs: 500 });

    await expect(acquirePromise).resolves.toBeUndefined();
  }, 1000);

  it("should report available tokens correctly", () => {
    expect(bucket.availableTokens).toBe(5);
  });

  it("should report queued count", async () => {
    for (let i = 0; i < 5; i++) {
      await bucket.acquire();
    }

    const promise = bucket.acquire({ timeoutMs: 500 });

    expect(bucket.queuedCount).toBe(1);

    await promise;

    expect(bucket.queuedCount).toBe(0);
  }, 1000);

  it("should reset bucket to full capacity", async () => {
    for (let i = 0; i < 5; i++) {
      await bucket.acquire();
    }

    expect(bucket.availableTokens).toBe(0);

    bucket.reset();

    expect(bucket.availableTokens).toBe(5);
  });
});

describe("PerSourceRateLimiter", () => {
  let limiter: PerSourceRateLimiter;

  beforeEach(() => {
    limiter = new PerSourceRateLimiter({
      capacity: 3,
      refillRate: 1,
      refillIntervalMs: 50,
    });
  });

  it("should create separate buckets per source", async () => {
    await limiter.acquire("source-a");
    await limiter.acquire("source-a");
    await limiter.acquire("source-a");

    await expect(limiter.acquire("source-a", { timeoutMs: 50 })).rejects.toThrow(
      RateLimiterError,
    );

    await expect(limiter.acquire("source-b")).resolves.toBeUndefined();
  });

  it("should reset all sources when no source specified", async () => {
    await limiter.acquire("source-a");
    await limiter.acquire("source-b");

    limiter.reset();

    await expect(limiter.acquire("source-a")).resolves.toBeUndefined();
    await expect(limiter.acquire("source-b")).resolves.toBeUndefined();
  });

  it("should reset specific source", async () => {
    await limiter.acquire("source-a");
    await limiter.acquire("source-a");
    await limiter.acquire("source-a");

    limiter.reset("source-a");

    await expect(limiter.acquire("source-a")).resolves.toBeUndefined();
  });
});
