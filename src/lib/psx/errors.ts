export class PsxError extends Error {
  constructor(message: string, public readonly statusCode: number = 500) {
    super(message);
    this.name = "PsxError";
  }
}

export class TimeoutError extends PsxError {
  constructor(public readonly timeoutMs: number = 10000) {
    super(`Request timed out after ${timeoutMs}ms`, 504);
    this.name = "TimeoutError";
  }
}

export class RateLimitError extends PsxError {
  constructor(public readonly retryAfter: number = 60) {
    super(`Rate limit exceeded`, 429);
    this.name = "RateLimitError";
  }
}

export class ProviderUnavailableError extends PsxError {
  constructor(
    public readonly provider: string,
    public readonly cause?: Error,
  ) {
    super(`Provider ${provider} unavailable${cause ? `: ${cause.message}` : ""}`, 502);
    this.name = "ProviderUnavailableError";
  }
}

export class InvalidDataError extends PsxError {
  constructor(
    public readonly provider: string,
    public readonly detail?: string,
  ) {
    super(`Invalid data from ${provider}${detail ? `: ${detail}` : ""}`, 500);
    this.name = "InvalidDataError";
  }
}

export class AllProvidersFailedError extends PsxError {
  constructor(public readonly fallbacksAttempted: string[]) {
    super(`All data sources failed: ${fallbacksAttempted.join(", ")}`, 502);
    this.name = "AllProvidersFailedError";
  }
}

export class StockNotFoundError extends PsxError {
  constructor(ticker: string) {
    super(`Stock not found: ${ticker}`, 404);
    this.name = "StockNotFoundError";
  }
}
