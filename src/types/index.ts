import type { PsxStockRecord } from "@/lib/psx";

export interface StockSummary {
  ticker: string;
  companyName: string;
  sector: string;
  ltp: number;
  change: number;
  changePercent: number;
  volume: number;
  currency: string;
  lastUpdated: string;
}

export function toStockSummary(record: PsxStockRecord): StockSummary {
  const change = record.ohlc.close - record.ohlc.open;
  const changePercent = (change / record.ohlc.open) * 100;
  return {
    ticker: record.ticker.replace(".KAR", ""),
    companyName: record.companyName,
    sector: record.sector,
    ltp: record.ohlc.close,
    change,
    changePercent,
    volume: record.ohlc.volume,
    currency: record.currency,
    lastUpdated: record.fetchedAt.toISOString(),
  };
}

export type SortField = "ticker" | "ltp" | "changePercent" | "volume" | "sector";
export type SortDirection = "asc" | "desc";

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}
