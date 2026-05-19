import type {
  PsxStockRecord,
  PsxDataProvider,
  RetryConfig,
  GetTopStocksOptions,
  GetStockOptions,
} from "./types";
import type { CircuitBreakerConfig } from "./circuit-breaker";
import type { TokenBucketConfig } from "./rate-limiter";
import { PsxCache } from "./cache";
import { withRetry } from "./retry";
import { CircuitBreaker } from "./circuit-breaker";
import { TokenBucket } from "./rate-limiter";
import {
  AllProvidersFailedError,
  InvalidDataError,
  StockNotFoundError,
} from "./errors";
import { DEFAULT_RETRY_CONFIG, DEFAULT_CACHE_TTL_MS } from "./types";

export interface PsxServiceResult<T> {
  data: T;
  source: string;
  cached: boolean;
  cacheAge: number | null;
  isStale: boolean;
}

export interface PsxServiceOptions {
  providers: PsxDataProvider[];
  cacheTtlMs?: number;
  retryConfig?: RetryConfig;
  circuitBreakerConfig?: CircuitBreakerConfig;
  rateLimiterConfig?: TokenBucketConfig;
}

export class PsxService {
  private providers: PsxDataProvider[];
  private cache: PsxCache<PsxStockRecord[]>;
  private singleCache: PsxCache<PsxStockRecord>;
  private retryConfig: RetryConfig;
  private circuitBreaker: CircuitBreaker | null;
  private rateLimiter: TokenBucket | null;

  constructor(
    providers: PsxDataProvider[],
    retryConfig?: Partial<RetryConfig>,
  );
  constructor(options: PsxServiceOptions);
  constructor(
    providersOrOptions: PsxDataProvider[] | PsxServiceOptions,
    retryConfig?: Partial<RetryConfig>,
  ) {
    if (Array.isArray(providersOrOptions)) {
      this.providers = providersOrOptions;
      this.cache = new PsxCache<PsxStockRecord[]>(DEFAULT_CACHE_TTL_MS);
      this.singleCache = new PsxCache<PsxStockRecord>(DEFAULT_CACHE_TTL_MS);
      this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
      this.circuitBreaker = null;
      this.rateLimiter = null;
    } else {
      this.providers = providersOrOptions.providers;
      const ttl = providersOrOptions.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
      this.cache = new PsxCache<PsxStockRecord[]>(ttl);
      this.singleCache = new PsxCache<PsxStockRecord>(ttl);
      this.retryConfig = providersOrOptions.retryConfig ?? DEFAULT_RETRY_CONFIG;
      this.circuitBreaker = providersOrOptions.circuitBreakerConfig
        ? new CircuitBreaker(providersOrOptions.circuitBreakerConfig)
        : null;
      this.rateLimiter = providersOrOptions.rateLimiterConfig
        ? new TokenBucket(providersOrOptions.rateLimiterConfig)
        : null;
    }
  }

  async getTopStocks(options?: GetTopStocksOptions): Promise<PsxServiceResult<PsxStockRecord[]>> {
    const cacheKey = `top:${options?.sector ?? "all"}`;

    if (!options?.forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        let data = cached.data;
        if (options?.sector) {
          data = data.filter((s) => s.sector.toLowerCase().includes(options.sector!.toLowerCase()));
        }
        const isStale = this.circuitBreaker?.isStale ?? false;
        return {
          data,
          source: cached.source,
          cached: true,
          cacheAge: this.cache.getAge(cacheKey),
          isStale,
        };
      }
    }

    if (this.rateLimiter) {
      await this.rateLimiter.acquire({ timeoutMs: this.retryConfig.timeoutMs });
    }

    const executeFetch = async (): Promise<PsxServiceResult<PsxStockRecord[]>> => {
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
            throw new InvalidDataError(provider.name, "Empty response");
          }

          this.cache.set(cacheKey, data, provider.name);

          let filtered = data;
          if (options?.sector) {
            filtered = data.filter((s) => s.sector.toLowerCase().includes(options.sector!.toLowerCase()));
          }

          return {
            data: filtered,
            source: provider.name,
            cached: false,
            cacheAge: null,
            isStale: false,
          };
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }
      }

      const cached = this.cache.get(cacheKey);
      if (cached) {
        let data = cached.data;
        if (options?.sector) {
          data = data.filter((s) => s.sector.toLowerCase().includes(options.sector!.toLowerCase()));
        }
        return {
          data,
          source: cached.source,
          cached: true,
          cacheAge: this.cache.getAge(cacheKey),
          isStale: true,
        };
      }

      throw new AllProvidersFailedError(attempted);
    };

    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(executeFetch);
    }

    return executeFetch();
  }

  async getStock(ticker: string, options?: GetStockOptions): Promise<PsxServiceResult<PsxStockRecord>> {
    const cacheKey = `stock:${ticker}`;

    if (!options?.forceRefresh) {
      const cached = this.singleCache.get(cacheKey);
      if (cached) {
        const isStale = this.circuitBreaker?.isStale ?? false;
        return {
          data: cached.data,
          source: cached.source,
          cached: true,
          cacheAge: this.singleCache.getAge(cacheKey),
          isStale,
        };
      }
    }

    if (this.rateLimiter) {
      await this.rateLimiter.acquire({ timeoutMs: this.retryConfig.timeoutMs });
    }

    const executeFetch = async (): Promise<PsxServiceResult<PsxStockRecord>> => {
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
            isStale: false,
          };
        } catch (error) {
          if (error instanceof StockNotFoundError) throw error;
          lastError = error instanceof Error ? error : new Error(String(error));
          continue;
        }
      }

      const cached = this.singleCache.get(cacheKey);
      if (cached) {
        return {
          data: cached.data,
          source: cached.source,
          cached: true,
          cacheAge: this.singleCache.getAge(cacheKey),
          isStale: true,
        };
      }

      if (lastError?.message?.includes("not found")) {
        throw new StockNotFoundError(ticker);
      }

      throw new AllProvidersFailedError(attempted);
    };

    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(executeFetch);
    }

    return executeFetch();
  }

  async getSectors(): Promise<PsxServiceResult<string[]>> {
    const result = await this.getTopStocks();
    const sectors = [...new Set(result.data.map((s) => s.sector))].sort();
    return { data: sectors, source: result.source, cached: result.cached, cacheAge: result.cacheAge, isStale: result.isStale };
  }

  async invalidateCache(): Promise<void> {
    this.cache.invalidate();
    this.singleCache.invalidate();
  }
}
