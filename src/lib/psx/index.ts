export { PsxService } from "./service";
export { PsxCache } from "./cache";
export { withRetry, withTimeout, calculateBackoff } from "./retry";
export { BaseProvider } from "./providers/base";
export { YahooFinanceProvider } from "./providers/yahoo";
export { PsxScraperAdapter } from "./adapters/scraper";

export {
  PsxError,
  TimeoutError,
  RateLimitError,
  ProviderUnavailableError,
  InvalidDataError,
  AllProvidersFailedError,
  StockNotFoundError,
} from "./errors";

export {
  TokenBucket,
  PerSourceRateLimiter,
  RateLimiterError,
  DEFAULT_RATE_LIMITER_CONFIG,
} from "./rate-limiter";

export {
  CircuitBreaker,
  PerSourceCircuitBreaker,
  CircuitBreakerOpenError,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
} from "./circuit-breaker";

export type { CircuitState, CircuitBreakerConfig } from "./circuit-breaker";
export type { TokenBucketConfig, RateLimiterQueueOptions } from "./rate-limiter";

export type {
  Ohlcv,
  Ohlc,
  PsxStockRecord,
  CacheEntry,
  PsxDataProvider,
  RetryConfig,
  GetTopStocksOptions,
  GetStockOptions,
  PsxApiResponse,
} from "./types";

export { DEFAULT_RETRY_CONFIG, DEFAULT_CACHE_TTL_MS, PSX_TOP_SYMBOLS } from "./types";

export type { PsxServiceResult, PsxServiceOptions } from "./service";
import { PsxService } from "./service";
import { PsxCache } from "./cache";
import { YahooFinanceProvider } from "./providers/yahoo";
import { PsxScraperAdapter } from "./adapters/scraper";
import { DEFAULT_CACHE_TTL_MS } from "./types";
import type { PsxStockRecord } from "./types";

export interface CreatePsxServiceOptions {
  useScraper?: boolean;
  useYahoo?: boolean;
  cacheTtlMs?: number;
  cacheMaxEntries?: number;
}

export function createPsxService(options: CreatePsxServiceOptions = {}) {
  const { useScraper = false, useYahoo = true, cacheTtlMs, cacheMaxEntries } = options;

  const providers = [];

  if (useYahoo) {
    providers.push(new YahooFinanceProvider());
  }

  if (useScraper) {
    providers.push(new PsxScraperAdapter());
  }

  if (providers.length === 0) {
    providers.push(new YahooFinanceProvider());
  }

  const serviceOptions = {
    providers,
    ...(cacheTtlMs ? { cacheTtlMs } : {}),
  };

  const service = new PsxService(serviceOptions);

  if (cacheMaxEntries !== undefined) {
    const cache = new PsxCache(cacheTtlMs ?? DEFAULT_CACHE_TTL_MS, cacheMaxEntries);
    (service as unknown as { cache: PsxCache<PsxStockRecord[]> }).cache = cache;
    (service as unknown as { singleCache: PsxCache<PsxStockRecord> }).singleCache =
      new PsxCache(cacheTtlMs ?? DEFAULT_CACHE_TTL_MS, cacheMaxEntries);
  }

  return service;
}
