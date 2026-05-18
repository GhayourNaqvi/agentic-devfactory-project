export interface TokenBucketConfig {
  capacity: number;
  refillRate: number;
  refillIntervalMs: number;
}

export interface RateLimiterQueueOptions {
  timeoutMs?: number;
}

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class RateLimiterError extends Error {
  constructor(message = "Rate limit timeout exceeded") {
    super(message);
    this.name = "RateLimiterError";
  }
}

export class TokenBucket {
  private tokens: number;
  private readonly capacity: number;
  private readonly refillRate: number;
  private readonly refillIntervalMs: number;
  private lastRefillAt: number;
  private queue: QueuedRequest[] = [];
  private processing = false;

  constructor(config: TokenBucketConfig) {
    this.capacity = config.capacity;
    this.refillRate = config.refillRate;
    this.refillIntervalMs = config.refillIntervalMs;
    this.tokens = config.capacity;
    this.lastRefillAt = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillAt;
    const intervals = Math.floor(elapsed / this.refillIntervalMs);

    if (intervals > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + intervals * this.refillRate);
      this.lastRefillAt = now;
    }
  }

  private tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      if (this.tryConsume()) {
        const request = this.queue.shift()!;
        clearTimeout(request.timeoutId);
        request.resolve();
      } else {
        await new Promise((resolve) => setTimeout(resolve, this.refillIntervalMs));
      }
    }

    this.processing = false;
  }

  async acquire(options: RateLimiterQueueOptions = {}): Promise<void> {
    const timeoutMs = options.timeoutMs ?? 30_000;

    if (this.tryConsume()) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.queue.findIndex((r) => r.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new RateLimiterError());
      }, timeoutMs);

      this.queue.push({ resolve, reject, timeoutId });
      void this.processQueue();
    });
  }

  get availableTokens(): number {
    this.refill();
    return this.tokens;
  }

  get queuedCount(): number {
    return this.queue.length;
  }

  reset(): void {
    for (const request of this.queue) {
      clearTimeout(request.timeoutId);
      request.reject(new RateLimiterError("Rate limiter reset"));
    }
    this.queue = [];
    this.tokens = this.capacity;
    this.lastRefillAt = Date.now();
    this.processing = false;
  }
}

export class PerSourceRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private defaultConfig: TokenBucketConfig;

  constructor(defaultConfig: TokenBucketConfig) {
    this.defaultConfig = defaultConfig;
  }

  getBucket(source: string, config?: Partial<TokenBucketConfig>): TokenBucket {
    if (!this.buckets.has(source)) {
      const merged = { ...this.defaultConfig, ...config };
      this.buckets.set(source, new TokenBucket(merged));
    }
    return this.buckets.get(source)!;
  }

  async acquire(source: string, options?: RateLimiterQueueOptions): Promise<void> {
    const bucket = this.getBucket(source);
    return bucket.acquire(options);
  }

  reset(source?: string): void {
    if (source) {
      this.buckets.get(source)?.reset();
    } else {
      for (const bucket of this.buckets.values()) {
        bucket.reset();
      }
    }
  }
}

export const DEFAULT_RATE_LIMITER_CONFIG: TokenBucketConfig = {
  capacity: 10,
  refillRate: 1,
  refillIntervalMs: 2000,
};
