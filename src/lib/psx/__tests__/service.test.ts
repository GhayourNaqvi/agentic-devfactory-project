import { describe, it, expect, vi, beforeEach } from "vitest";
import { PsxService } from "../service";
import type { PsxDataProvider, PsxStockRecord } from "../types";
import { AllProvidersFailedError, StockNotFoundError } from "../errors";

function createMockStock(overrides: Partial<PsxStockRecord> = {}): PsxStockRecord {
  return {
    ticker: "OGDC",
    companyName: "Oil & Gas Development Company Ltd",
    sector: "Oil & Gas",
    ohlc: { open: 142.5, high: 145.2, low: 141.9, close: 144.8, volume: 12500000 },
    currency: "PKR",
    fetchedAt: new Date(),
    ...overrides,
  };
}

describe("PsxService", () => {
  let mockProvider: PsxDataProvider;
  let service: PsxService;

  beforeEach(() => {
    mockProvider = {
      name: "mock-provider",
      fetchTopStocks: vi.fn().mockResolvedValue([
        createMockStock({ ticker: "OGDC", sector: "Oil & Gas" }),
        createMockStock({ ticker: "TRG", sector: "Technology" }),
        createMockStock({ ticker: "HBL", sector: "Banking" }),
      ]),
      fetchStock: vi.fn().mockImplementation((ticker: string) => {
        if (ticker === "OGDC") {
          return Promise.resolve(createMockStock({ ticker: "OGDC" }));
        }
        return Promise.reject(new StockNotFoundError(ticker));
      }),
      healthCheck: vi.fn().mockResolvedValue(true),
    };

    service = new PsxService([mockProvider]);
  });

  describe("getTopStocks", () => {
    it("returns stocks from provider", async () => {
      const result = await service.getTopStocks();

      expect(result.data.length).toBe(3);
      expect(result.source).toBe("mock-provider");
      expect(result.cached).toBe(false);
    });

    it("uses cache on subsequent calls", async () => {
      await service.getTopStocks();
      const result = await service.getTopStocks();

      expect(result.cached).toBe(true);
      expect(mockProvider.fetchTopStocks).toHaveBeenCalledTimes(1);
    });

    it("forces refresh when requested", async () => {
      await service.getTopStocks();
      await service.getTopStocks({ forceRefresh: true });

      expect(mockProvider.fetchTopStocks).toHaveBeenCalledTimes(2);
    });

    it("filters by sector", async () => {
      const result = await service.getTopStocks({ sector: "Technology" });

      expect(result.data.length).toBe(1);
      expect(result.data[0].ticker).toBe("TRG");
    });

    it("throws when all providers fail", async () => {
      mockProvider.fetchTopStocks = vi.fn().mockRejectedValue(new Error("down"));
      service = new PsxService([mockProvider], { maxRetries: 1, baseDelay: 10, timeoutMs: 1000 });

      await expect(service.getTopStocks()).rejects.toThrow(AllProvidersFailedError);
    });
  });

  describe("getStock", () => {
    it("returns single stock", async () => {
      const result = await service.getStock("OGDC");

      expect(result.data.ticker).toBe("OGDC");
      expect(result.source).toBe("mock-provider");
    });

    it("uses cache on subsequent calls", async () => {
      await service.getStock("OGDC");
      await service.getStock("OGDC");

      expect(mockProvider.fetchStock).toHaveBeenCalledTimes(1);
    });

    it("throws StockNotFoundError for unknown ticker", async () => {
      service = new PsxService([mockProvider], { maxRetries: 1, baseDelay: 10, timeoutMs: 1000 });
      await expect(service.getStock("UNKNOWN")).rejects.toThrow(StockNotFoundError);
    });
  });

  describe("getSectors", () => {
    it("returns unique sorted sectors", async () => {
      const result = await service.getSectors();

      expect(result.data).toEqual(["Banking", "Oil & Gas", "Technology"]);
    });
  });

  describe("invalidateCache", () => {
    it("clears all caches", async () => {
      await service.getTopStocks();
      await service.getStock("OGDC");
      await service.invalidateCache();

      await service.getTopStocks();
      await service.getStock("OGDC");

      expect(mockProvider.fetchTopStocks).toHaveBeenCalledTimes(2);
      expect(mockProvider.fetchStock).toHaveBeenCalledTimes(2);
    });
  });
});
