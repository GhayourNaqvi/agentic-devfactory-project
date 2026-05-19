import { describe, it, expect } from "vitest";
import { toStockSummary } from "@/types";
import type { PsxStockRecord } from "@/lib/psx";

function createMockStock(overrides: Partial<PsxStockRecord> = {}): PsxStockRecord {
  return {
    ticker: "OGDC.KAR",
    companyName: "Oil & Gas Development Company Ltd",
    sector: "Oil & Gas Exploration",
    ohlc: {
      open: 142.5,
      high: 145.2,
      low: 141.9,
      close: 144.8,
      volume: 12_500_000,
    },
    currency: "PKR",
    fetchedAt: new Date("2026-05-18T10:30:00Z"),
    ...overrides,
  };
}

describe("toStockSummary", () => {
  it("converts PsxStockRecord to StockSummary", () => {
    const record = createMockStock();
    const summary = toStockSummary(record);

    expect(summary.ticker).toBe("OGDC");
    expect(summary.companyName).toBe("Oil & Gas Development Company Ltd");
    expect(summary.sector).toBe("Oil & Gas Exploration");
    expect(summary.ltp).toBe(144.8);
    expect(summary.currency).toBe("PKR");
  });

  it("calculates change correctly", () => {
    const record = createMockStock({
      ohlc: { open: 100, high: 110, low: 95, close: 105, volume: 1_000_000 },
    });
    const summary = toStockSummary(record);

    expect(summary.change).toBe(5);
  });

  it("calculates changePercent correctly", () => {
    const record = createMockStock({
      ohlc: { open: 100, high: 110, low: 95, close: 105, volume: 1_000_000 },
    });
    const summary = toStockSummary(record);

    expect(summary.changePercent).toBe(5);
  });

  it("handles negative change", () => {
    const record = createMockStock({
      ohlc: { open: 100, high: 105, low: 90, close: 92, volume: 1_000_000 },
    });
    const summary = toStockSummary(record);

    expect(summary.change).toBe(-8);
    expect(summary.changePercent).toBeCloseTo(-8, 5);
  });

  it("strips .KAR suffix from ticker", () => {
    const record = createMockStock({ ticker: "TRG.KAR" });
    const summary = toStockSummary(record);

    expect(summary.ticker).toBe("TRG");
  });

  it("formats volume correctly", () => {
    const record = createMockStock({
      ohlc: { open: 100, high: 105, low: 95, close: 102, volume: 12_500_000 },
    });
    const summary = toStockSummary(record);

    expect(summary.volume).toBe(12_500_000);
  });

  it("sets lastUpdated to ISO string", () => {
    const record = createMockStock();
    const summary = toStockSummary(record);

    expect(summary.lastUpdated).toBe("2026-05-18T10:30:00.000Z");
  });
});
