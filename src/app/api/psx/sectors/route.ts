import { NextRequest, NextResponse } from "next/server";
import { psxService } from "@/lib/psx-server";
import { AllProvidersFailedError, TimeoutError, RateLimitError } from "@/lib/psx";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const forceRefresh = searchParams.get("cache") === "false";

  try {
    const result = await psxService.getSectors();

    return NextResponse.json({
      data: result.data,
      meta: {
        count: result.data.length,
        source: result.source,
        cached: result.cached,
        cacheAge: result.cacheAge ?? undefined,
      },
    });
  } catch (error) {
    return handlePsxError(error);
  }
}

function handlePsxError(error: unknown): NextResponse {
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
  console.error(`[PSX:sectors] Unexpected error (${requestId}):`, error);

  return NextResponse.json(
    { error: "Internal server error", requestId },
    { status: 500 },
  );
}
