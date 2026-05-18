export interface OhlcData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PsxStock {
  ticker: string;
  companyName: string;
  sector: string;
  ohlc: OhlcData;
  currency: "PKR";
  lastUpdated: string;
}

export interface PsxApiResponse {
  data: PsxStock[] | PsxStock;
  meta: {
    count?: number;
    source: string;
    cached: boolean;
    cacheAge: number;
  };
}

export interface PsxApiError {
  error: string;
  fallbacksAttempted?: string[];
  timeoutMs?: number;
  retryAfter?: number;
  requestId?: string;
}

export type SortField = "ticker" | "companyName" | "close" | "volume" | "change";
export type SortDirection = "asc" | "desc";

export interface SortState {
  field: SortField;
  direction: SortDirection;
}

export type ViewMode = "table" | "card";
export type RefreshInterval = 0 | 30 | 60 | 300;
