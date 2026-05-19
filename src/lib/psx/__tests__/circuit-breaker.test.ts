import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  CircuitBreaker,
  PerSourceCircuitBreaker,
  CircuitBreakerOpenError,
} from "../circuit-breaker";

describe("CircuitBreaker", () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = new CircuitBreaker({
      failureThreshold: 3,
      windowMs: 1000,
      halfOpenDelayMs: 500,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should start in closed state", () => {
    expect(breaker.currentState).toBe("closed");
  });

  it("should allow execution when closed", async () => {
    const result = await breaker.execute(async () => "success");
    expect(result).toBe("success");
  });

  it("should open after reaching failure threshold", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    expect(breaker.currentState).toBe("open");
  });

  it("should throw CircuitBreakerOpenError when open", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    await expect(breaker.execute(async () => "success")).rejects.toThrow(
      CircuitBreakerOpenError,
    );
  });

  it("should transition to half-open after delay", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    expect(breaker.currentState).toBe("open");

    await vi.advanceTimersByTimeAsync(500);

    expect(breaker.currentState).toBe("half-open");
  });

  it("should reset to closed on successful probe in half-open", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    await vi.advanceTimersByTimeAsync(500);
    expect(breaker.currentState).toBe("half-open");

    const result = await breaker.execute(async () => "success");
    expect(result).toBe("success");
    expect(breaker.currentState).toBe("closed");
  });

  it("should re-open on failed probe in half-open", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    await vi.advanceTimersByTimeAsync(500);

    try {
      await breaker.execute(async () => {
        throw new Error("probe failed");
      });
    } catch {
      // expected
    }

    expect(breaker.currentState).toBe("open");
  });

  it("should track failure count within window", async () => {
    try {
      await breaker.execute(async () => {
        throw new Error("fail");
      });
    } catch {
      // expected
    }

    expect(breaker.failureCount).toBe(1);

    await vi.advanceTimersByTimeAsync(1001);

    expect(breaker.failureCount).toBe(0);
  });

  it("should report isStale when open or half-open", async () => {
    expect(breaker.isStale).toBe(false);

    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    expect(breaker.isStale).toBe(true);

    await vi.advanceTimersByTimeAsync(500);
    expect(breaker.isStale).toBe(true);

    await breaker.execute(async () => "success");
    expect(breaker.isStale).toBe(false);
  });

  it("should reset to closed state", async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(async () => {
          throw new Error("fail");
        });
      } catch {
        // expected
      }
    }

    breaker.reset();
    expect(breaker.currentState).toBe("closed");
    expect(breaker.failureCount).toBe(0);
  });
});

describe("PerSourceCircuitBreaker", () => {
  let breaker: PerSourceCircuitBreaker;

  beforeEach(() => {
    breaker = new PerSourceCircuitBreaker({
      failureThreshold: 2,
      windowMs: 1000,
      halfOpenDelayMs: 200,
    });
  });

  it("should create separate breakers per source", async () => {
    try {
      await breaker.execute("source-a", async () => {
        throw new Error("fail");
      });
    } catch {
      // expected
    }
    try {
      await breaker.execute("source-a", async () => {
        throw new Error("fail");
      });
    } catch {
      // expected
    }

    expect(breaker.getState("source-a")).toBe("open");
    expect(breaker.getState("source-b")).toBe("closed");
  });

  it("should reset all breakers when no source specified", async () => {
    try {
      await breaker.execute("source-a", async () => {
        throw new Error("fail");
      });
    } catch {
      // expected
    }
    try {
      await breaker.execute("source-a", async () => {
        throw new Error("fail");
      });
    } catch {
      // expected
    }

    breaker.reset();
    expect(breaker.getState("source-a")).toBe("closed");
  });
});
