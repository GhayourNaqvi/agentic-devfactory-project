import { describe, it, expect } from "vitest";
import {
  PsxError,
  TimeoutError,
  RateLimitError,
  ProviderUnavailableError,
  InvalidDataError,
  AllProvidersFailedError,
  StockNotFoundError,
} from "../errors";

describe("PsxError", () => {
  it("has correct name and default status", () => {
    const error = new PsxError("test");
    expect(error.name).toBe("PsxError");
    expect(error.statusCode).toBe(500);
  });

  it("accepts custom status code", () => {
    const error = new PsxError("test", 400);
    expect(error.statusCode).toBe(400);
  });
});

describe("TimeoutError", () => {
  it("has correct name and status", () => {
    const error = new TimeoutError();
    expect(error.name).toBe("TimeoutError");
    expect(error.statusCode).toBe(504);
    expect(error.timeoutMs).toBe(10000);
  });
});

describe("RateLimitError", () => {
  it("has correct name and status", () => {
    const error = new RateLimitError();
    expect(error.name).toBe("RateLimitError");
    expect(error.statusCode).toBe(429);
    expect(error.retryAfter).toBe(60);
  });
});

describe("ProviderUnavailableError", () => {
  it("includes fallbacks attempted", () => {
    const error = new ProviderUnavailableError("down", ["yahoo", "alpha"]);
    expect(error.name).toBe("ProviderUnavailableError");
    expect(error.statusCode).toBe(502);
    expect(error.fallbacksAttempted).toEqual(["yahoo", "alpha"]);
  });
});

describe("InvalidDataError", () => {
  it("has correct name and status", () => {
    const error = new InvalidDataError();
    expect(error.name).toBe("InvalidDataError");
    expect(error.statusCode).toBe(500);
  });
});

describe("AllProvidersFailedError", () => {
  it("includes fallbacks attempted", () => {
    const error = new AllProvidersFailedError("all down", ["yahoo"]);
    expect(error.name).toBe("AllProvidersFailedError");
    expect(error.statusCode).toBe(502);
    expect(error.fallbacksAttempted).toEqual(["yahoo"]);
  });
});

describe("StockNotFoundError", () => {
  it("includes ticker in message", () => {
    const error = new StockNotFoundError("OGDC");
    expect(error.name).toBe("StockNotFoundError");
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Stock not found: OGDC");
  });
});
