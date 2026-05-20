import type { RetryConfig } from "./types";
import { TimeoutError } from "./errors";

export function calculateBackoff(attempt: number, config: RetryConfig): number {
  const exponential = config.baseDelay * 2 ** attempt;
  const jitter = Math.random() * config.baseDelay;
  const maxDelay = "maxDelay" in config ? config.maxDelay : Infinity;
  return Math.min(exponential + jitter, maxDelay);
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await withTimeout(fn, config.timeoutMs);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxRetries) {
        const delay = calculateBackoff(attempt, config);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error("Retry exhausted");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
