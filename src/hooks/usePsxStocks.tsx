"use client";

import { useCallback, useEffect, useState } from "react";
import type { StockSummary, SortConfig, SortField } from "@/types";
import { toStockSummary } from "@/types";
import type { PsxStockRecord, PsxApiResponse } from "@/lib/psx";
import { StockTable } from "@/components/StockTable";
import { StockCard } from "@/components/StockCard";
import { StockSearch } from "@/components/StockSearch";
import { SectorFilter } from "@/components/SectorFilter";

type ViewMode = "table" | "card";

export function usePsxStocks() {
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: "ticker", direction: "asc" });
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const fetchStocks = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (forceRefresh) params.set("cache", "false");
      if (selectedSector) params.set("sector", selectedSector);

      const [stocksRes, sectorsRes] = await Promise.all([
        fetch(`/api/psx/stocks?${params}`),
        fetch("/api/psx/sectors"),
      ]);

      if (!stocksRes.ok) {
        const errData = await stocksRes.json().catch(() => ({ error: "Failed to fetch stocks" }));
        throw new Error(errData.error || "Failed to fetch stocks");
      }

      const stocksData: PsxApiResponse<PsxStockRecord[]> = await stocksRes.json();
      const summaries = stocksData.data.map(toStockSummary);
      setStocks(summaries);

      if (sectorsRes.ok) {
        const sectorsData: PsxApiResponse<string[]> = await sectorsRes.json();
        setSectors(sectorsData.data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedSector]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleSort = useCallback((field: SortField) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const filteredStocks = stocks
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return s.ticker.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const { field, direction } = sortConfig;
      const multiplier = direction === "asc" ? 1 : -1;
      const aVal = a[field];
      const bVal = b[field];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return multiplier * aVal.localeCompare(bVal);
      }
      return multiplier * ((aVal as number) - (bVal as number));
    });

  return {
    stocks: filteredStocks,
    sectors,
    loading,
    error,
    lastUpdated,
    selectedSector,
    searchQuery,
    sortConfig,
    viewMode,
    setSelectedSector,
    setSearchQuery,
    handleSort,
    setViewMode,
    refresh: () => fetchStocks(true),
  };
}

export function PsxDashboard() {
  const {
    stocks,
    sectors,
    loading,
    error,
    lastUpdated,
    selectedSector,
    searchQuery,
    sortConfig,
    viewMode,
    setSelectedSector,
    setSearchQuery,
    handleSort,
    setViewMode,
    refresh,
  } = usePsxStocks();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">PSX Dashboard</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pakistan Stock Exchange — Top 100 Stocks
            {lastUpdated && (
              <span className="ml-1">
                · Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "table"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("card")}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === "card"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              Cards
            </button>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            aria-label="Refresh data"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <StockSearch value={searchQuery} onChange={setSearchQuery} />
        <SectorFilter sectors={sectors} selected={selectedSector} onChange={setSelectedSector} loading={loading} />
      </div>

      {viewMode === "table" ? (
        <StockTable
          stocks={stocks}
          loading={loading}
          error={error}
          sortConfig={sortConfig}
          onSort={handleSort}
          onRetry={refresh}
        />
      ) : (
        <>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-700" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-8 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
              <button onClick={refresh} className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                Retry
              </button>
            </div>
          ) : stocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-12 dark:border-zinc-700 dark:bg-zinc-800/50">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No stocks match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stocks.map((stock) => (
                <StockCard key={stock.ticker} stock={stock} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
