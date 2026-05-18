export type CircuitState = "closed" | "open" | "half-open";

export interface CircuitBreakerConfig {
  failureThreshold: number;
  windowMs: number;
  halfOpenDelayMs: number;
}

export class CircuitBreakerOpenError extends Error {
  constructor(
    message = "Circuit breaker is open",
    public readonly retryAfterMs: number,
  ) {
    super(message);
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures: number[] = [];
  private lastFailureAt: number | null = null;
  private lastStateChangeAt: number = Date.now();
  private readonly config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  get currentState(): CircuitState {
    if (this.state === "open") {
      const elapsed = Date.now() - this.lastStateChangeAt;
      if (elapsed >= this.config.halfOpenDelayMs) {
        this.transitionTo("half-open");
      }
    }
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.currentState;

    if (state === "open") {
      const elapsed = Date.now() - this.lastStateChangeAt;
      const retryAfter = this.config.halfOpenDelayMs - elapsed;
      throw new CircuitBreakerOpenError(
        `Circuit breaker is open, retry after ${retryAfter}ms`,
        Math.max(0, retryAfter),
      );
    }

    try {
      const result = await fn();

      if (state === "half-open") {
        this.transitionTo("closed");
      }

      return result;
    } catch (error) {
      this.recordFailure();

      if (this.currentState === "open") {
        throw new CircuitBreakerOpenError(
          `Circuit breaker opened after ${this.config.failureThreshold} failures`,
          this.config.halfOpenDelayMs,
        );
      }

      throw error;
    }
  }

  recordFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.lastFailureAt = now;

    this.pruneOldFailures(now);

    if (this.failures.length >= this.config.failureThreshold) {
      this.transitionTo("open");
    }
  }

  recordSuccess(): void {
    if (this.state === "half-open") {
      this.transitionTo("closed");
    }
    this.failures = [];
  }

  reset(): void {
    this.failures = [];
    this.lastFailureAt = null;
    this.transitionTo("closed");
  }

  get failureCount(): number {
    this.pruneOldFailures(Date.now());
    return this.failures.length;
  }

  get isStale(): boolean {
    return this.state === "open" || this.state === "half-open";
  }

  private pruneOldFailures(now: number): void {
    const cutoff = now - this.config.windowMs;
    this.failures = this.failures.filter((t) => t > cutoff);
  }

  private transitionTo(newState: CircuitState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.lastStateChangeAt = Date.now();
    }
  }
}

export class PerSourceCircuitBreaker {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private defaultConfig: CircuitBreakerConfig;

  constructor(defaultConfig: CircuitBreakerConfig) {
    this.defaultConfig = defaultConfig;
  }

  getBreaker(source: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(source)) {
      const merged = { ...this.defaultConfig, ...config };
      this.breakers.set(source, new CircuitBreaker(merged));
    }
    return this.breakers.get(source)!;
  }

  async execute<T>(source: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(source);
    return breaker.execute(fn);
  }

  reset(source?: string): void {
    if (source) {
      this.breakers.get(source)?.reset();
    } else {
      for (const breaker of this.breakers.values()) {
        breaker.reset();
      }
    }
  }

  getState(source: string): CircuitState | undefined {
    return this.breakers.get(source)?.currentState;
  }
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  windowMs: 60_000,
  halfOpenDelayMs: 120_000,
};
