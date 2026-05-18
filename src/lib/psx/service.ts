import type {
  PsxDataProvider,
  PsxStockRecord,
  GetTopStocksOptions,
  GetStockOptions,
  RetryConfig,
} from "./types";
import { PsxCache } from "./cache";
import { withRetry } from "./retry";
import {
  AllProvidersFailedError,
  InvalidDataError,
  StockNotFoundError,
} from "./errors";

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  timeoutMs: 10000,
};

const CACHE_TTL_MS = 300_000;

export class PsxService {
  private providers: PsxDataProvider[];
  private cache: PsxCache<PsxStockRecord[]>;
  private singleCache: PsxCache<PsxStockRecord>;
  private retryConfig: RetryConfig;

  constructor(providers: PsxDataProvider[], retryConfig?: Partial<RetryConfig>) {
    this.providers = providers;
    this.cache = new PsxCache<PsxStockRecord[]>(CACHE_TTL_MS);
    this.singleCache = new PsxCache<PsxStockRecord>(CACHE_TTL_MS);
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  }

  async getTopStocks(options?: GetTopStocksOptions): Promise<{
    data: PsxStockRecord[];
    source: string;
    cached: boolean;
    cacheAge: number | null;
  }> {
    const cacheKey = `top:${options?.sector ?? "all"}`;

    if (!options?.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        let data = cached.data;
        if (options?.sector) {
          data = data.filter((s) => s.sector === options.sector);
        }
        return {
          data,
          source: cached.source,
          cached: true,
          cacheAge: this.cache.getAge(cacheKey),
        };
      }
    }

    let lastError: Error | null = null;
    const attempted: string[] = [];

    for (const provider of this.providers) {
      attempted.push(provider.name);
      try {
        const data = await withRetry(
          () => provider.fetchTopStocks(100),
          this.retryConfig,
        );

        if (!data || data.length === 0) {
          throw new InvalidDataError("Empty response from provider");
        }

        this.cache.set(cacheKey, data, provider.name);

        let filtered = data;
        if (options?.sector) {
          filtered = data.filter((s) => s.sector === options.sector);
        }

        return {
          data: filtered,
          source: provider.name,
          cached: false,
          cacheAge: null,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    throw new AllProvidersFailedError(
      `All providers failed. Last error: ${lastError?.message}`,
      attempted,
    );
  }

  async getStock(ticker: string, options?: GetStockOptions): Promise<{
    data: PsxStockRecord;
    source: string;
    cached: boolean;
    cacheAge: number | null;
  }> {
    const cacheKey = `stock:${ticker}`;

    if (!options?.forceRefresh) {
      const cached = this.singleCache.get(cacheKey);
      if (cached) {
        return {
          data: cached.data,
          source: cached.source,
          cached: true,
          cacheAge: this.singleCache.getAge(cacheKey),
        };
      }
    }

    let lastError: Error | null = null;
    const attempted: string[] = [];

    for (const provider of this.providers) {
      attempted.push(provider.name);
      try {
        const data = await withRetry(
          () => provider.fetchStock(ticker),
          this.retryConfig,
        );

        this.singleCache.set(cacheKey, data, provider.name);

        return {
          data,
          source: provider.name,
          cached: false,
          cacheAge: null,
        };
      } catch (error) {
        if (error instanceof StockNotFoundError) throw error;
        lastError = error instanceof Error ? error : new Error(String(error));
        continue;
      }
    }

    if (lastError?.message?.includes("not found")) {
      throw new StockNotFoundError(ticker);
    }

    throw new AllProvidersFailedError(
      `All providers failed for ${ticker}. Last error: ${lastError?.message}`,
      attempted,
    );
  }

  async getSectors(): Promise<{
    data: string[];
    source: string;
    cached: boolean;
    cacheAge: number | null;
  }> {
    const { data, source, cached, cacheAge } = await this.getTopStocks();
    const sectors = [...new Set(data.map((s) => s.sector))].sort();
    return { data: sectors, source, cached, cacheAge };
  }

  async invalidateCache(): Promise<void> {
    this.cache.invalidate();
    this.singleCache.invalidate();
  }
}
