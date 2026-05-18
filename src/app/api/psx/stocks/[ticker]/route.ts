import { NextRequest, NextResponse } from "next/server";
import { psxService } from "@/lib/psx-server";
import {
  AllProvidersFailedError,
  TimeoutError,
  RateLimitError,
  StockNotFoundError,
} from "@/lib/psx";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;

  try {
    const result = await psxService.getStock(ticker);

    return NextResponse.json({
      data: result.data,
      meta: {
        source: result.source,
        cached: result.cached,
        cacheAge: result.cacheAge ?? undefined,
      },
    });
  } catch (error) {
    return handlePsxError(error, ticker);
  }
}

function handlePsxError(error: unknown, ticker: string): NextResponse {
  if (error instanceof StockNotFoundError) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 },
    );
  }

  if (error instanceof TimeoutError) {
    return NextResponse.json(
      { error: "Request timeout", timeoutMs: error.timeoutMs },
      { status: 504 },
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfter: error.retryAfter },
      { status: 429 },
    );
  }

  if (error instanceof AllProvidersFailedError) {
    return NextResponse.json(
      { error: "Data source unavailable", fallbacksAttempted: error.fallbacksAttempted },
      { status: 502 },
    );
  }

  const requestId = crypto.randomUUID();
  console.error(`[PSX:${ticker}] Unexpected error (${requestId}):`, error);

  return NextResponse.json(
    { error: "Internal server error", requestId },
    { status: 500 },
  );
}
