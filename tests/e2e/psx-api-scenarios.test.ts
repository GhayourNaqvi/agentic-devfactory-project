import { describe, it, expect } from "vitest";
import { PsxService } from "@/lib/psx/service";
import type { PsxDataProvider, PsxStockRecord } from "@/lib/psx/types";

const createMockStock = (ticker: string, sector = "Test Sector"): PsxStockRecord => ({
  ticker,
  companyName: `Company ${ticker}`,
  sector,
  ohlc: { open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
  currency: "PKR",
  fetchedAt: new Date(),
});

const createMockStocks = (count: number): PsxStockRecord[] =>
  Array.from({ length: count }, (_, i) =>
    createMockStock(`STOCK${i + 1}`, i % 3 === 0 ? "Technology" : i % 3 === 1 ? "Banking" : "Energy"),
  );

const fastConfig = {
  retryConfig: { maxRetries: 0, baseDelay: 1, timeoutMs: 500 } as const,
  rateLimiterConfig: { capacity: 100, refillRate: 10, refillIntervalMs: 10 } as const,
};

describe("E2E: PSX API Scenarios", () => {
  describe("Happy path: GET /api/psx/stocks returns stocks with valid fields", () => {
    it("should return stocks with all required fields", async () => {
      const stocks = createMockStocks(100);
      const provider: PsxDataProvider = {
        name: "mock",
        fetchTopStocks: async () => stocks,
        fetchStock: async (ticker) => stocks.find((s) => s.ticker === ticker)!,
        healthCheck: async () => true,
      };

      const service = new PsxService({ providers: [provider], ...fastConfig });
      const result = await service.getTopStocks();

      expect(result.data).toHaveLength(100);
      expect(result.source).toBe("mock");
      expect(result.cached).toBe(false);

      const first = result.data[0];
      expect(first.ticker).toBeDefined();
      expect(first.companyName).toBeDefined();
      expect(first.sector).toBeDefined();
      expect(first.ohlc).toBeDefined();
      expect(first.currency).toBe("PKR");
    });
  });

  describe("Cache hit: second request within TTL returns cached data", () => {
    it("should return cached: true on second request", async () => {
      const stocks = createMockStocks(10);
      const provider: PsxDataProvider = {
        name: "mock",
        fetchTopStocks: async () => stocks,
        fetchStock: async (ticker) => stocks.find((s) => s.ticker === ticker)!,
        healthCheck: async () => true,
      };

      const service = new PsxService({ providers: [provider], ...fastConfig });

      await service.getTopStocks();
      const result = await service.getTopStocks();

      expect(result.cached).toBe(true);
      expect(result.cacheAge).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Circuit breaker: serves stale cache after failures", () => {
    it("should return cached data when provider fails after initial success", async () => {
      const stocks = createMockStocks(10);
      let callCount = 0;
      const provider: PsxDataProvider = {
        name: "mock",
        fetchTopStocks: async () => {
          callCount++;
          if (callCount === 1) return stocks;
          throw new Error("Provider unavailable");
        },
        fetchStock: async () => stocks[0],
        healthCheck: async () => callCount === 1,
      };

      const service = new PsxService({
        providers: [provider],
        ...fastConfig,
        circuitBreakerConfig: { failureThreshold: 1, windowMs: 60000, halfOpenDelayMs: 120000 },
      });

      const first = await service.getTopStocks();
      expect(first.cached).toBe(false);

      const second = await service.getTopStocks();
      expect(second.cached).toBe(true);
    });
  });

  describe("Rate limit: handles concurrent requests", () => {
    it("should process multiple concurrent requests", async () => {
      const stocks = createMockStocks(5);
      const provider: PsxDataProvider = {
        name: "mock",
        fetchTopStocks: async () => stocks,
        fetchStock: async () => stocks[0],
        healthCheck: async () => true,
      };

      const service = new PsxService({
        providers: [provider],
        ...fastConfig,
        rateLimiterConfig: { capacity: 2, refillRate: 1, refillIntervalMs: 10 },
      });

      const results = await Promise.all([
        service.getTopStocks(),
        service.getTopStocks(),
        service.getTopStocks(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((r) => expect(r.data).toBeDefined());
    }, 5000);
  });

  describe("Provider fallback", () => {
    it("should try next provider when first fails", async () => {
      const stocks = createMockStocks(10);
      const failingProvider: PsxDataProvider = {
        name: "failing",
        fetchTopStocks: async () => {
          throw new Error("unavailable");
        },
        fetchStock: async () => stocks[0],
        healthCheck: async () => false,
      };
      const workingProvider: PsxDataProvider = {
        name: "working",
        fetchTopStocks: async () => stocks,
        fetchStock: async (ticker) => stocks.find((s) => s.ticker === ticker)!,
        healthCheck: async () => true,
      };

      const service = new PsxService({ providers: [failingProvider, workingProvider], ...fastConfig });
      const result = await service.getTopStocks();

      expect(result.source).toBe("working");
    });
  });

  describe("Sector filtering", () => {
    it("should filter stocks by sector", async () => {
      const stocks = createMockStocks(30);
      const provider: PsxDataProvider = {
        name: "mock",
        fetchTopStocks: async () => stocks,
        fetchStock: async (ticker) => stocks.find((s) => s.ticker === ticker)!,
        healthCheck: async () => true,
      };

      const service = new PsxService({ providers: [provider], ...fastConfig });

      const techResult = await service.getTopStocks({ sector: "Technology" });
      expect(techResult.data.every((s) => s.sector === "Technology")).toBe(true);

      const allResult = await service.getTopStocks();
      expect(allResult.data).toHaveLength(30);
    });
  });
});
