import { describe, it, expect, vi } from "vitest";
import { calculateBackoff, withRetry, withTimeout } from "../retry";
import { TimeoutError } from "../errors";

describe("calculateBackoff", () => {
  it("calculates exponential backoff with jitter", () => {
    const config = { maxRetries: 3, baseDelay: 1000, timeoutMs: 10000 };

    const delay0 = calculateBackoff(0, config);
    expect(delay0).toBeGreaterThanOrEqual(1000);
    expect(delay0).toBeLessThan(2000);

    const delay1 = calculateBackoff(1, config);
    expect(delay1).toBeGreaterThanOrEqual(2000);
    expect(delay1).toBeLessThan(3000);

    const delay2 = calculateBackoff(2, config);
    expect(delay2).toBeGreaterThanOrEqual(4000);
    expect(delay2).toBeLessThan(5000);
  });
});

describe("withTimeout", () => {
  it("resolves if function completes within timeout", async () => {
    const result = await withTimeout(() => Promise.resolve("done"), 1000);
    expect(result).toBe("done");
  });

  it("throws TimeoutError if function exceeds timeout", async () => {
    await expect(
      withTimeout(() => new Promise((r) => setTimeout(r, 200)), 50),
    ).rejects.toThrow(TimeoutError);
  });
});

describe("withRetry", () => {
  it("succeeds on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10, timeoutMs: 1000 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 10, timeoutMs: 1000 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws after all retries exhausted", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("permanent fail"));

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 10, timeoutMs: 1000 }),
    ).rejects.toThrow("permanent fail");

    expect(fn).toHaveBeenCalledTimes(3);
  });
});
