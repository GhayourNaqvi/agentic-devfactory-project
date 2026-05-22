"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PsxStock, RefreshInterval } from "@/types/psx";

interface UseStocksOptions {
  sector?: string | null;
  refreshInterval?: RefreshInterval;
}

interface UseStocksResult {
  stocks: PsxStock[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  cached: boolean;
  cacheAge: number;
  refresh: () => void;
}

interface FetchResult {
  stocks: PsxStock[];
  meta: { cached: boolean; cacheAge: number; source: string };
}

async function fetchStocks(signal: AbortSignal): Promise<FetchResult> {
  const res = await fetch("/api/psx/top100", { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  return {
    stocks: json.data as PsxStock[],
    meta: json.meta,
  };
}

export function useStocks({ sector, refreshInterval = 0 }: UseStocksOptions = {}): UseStocksResult {
  const [stocks, setStocks] = useState<PsxStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cached, setCached] = useState(false);
  const [cacheAge, setCacheAge] = useState(0);
  const [requestKey, setRequestKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    setRequestKey((k) => k + 1);
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let cancelled = false;

    fetchStocks(controller.signal)
      .then(({ stocks: data, meta }) => {
        if (cancelled) return;
        const filtered = sector ? data.filter((s) => s.sector === sector) : data;
        setStocks(filtered);
        setLastUpdated(new Date());
        setCached(meta.cached);
        setCacheAge(meta.cacheAge);
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to fetch stock data");
        setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sector, requestKey]);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const id = setInterval(() => setRequestKey((k) => k + 1), refreshInterval * 1000);
    return () => clearInterval(id);
  }, [refreshInterval]);

  return { stocks, loading, error, lastUpdated, cached, cacheAge, refresh };
}
