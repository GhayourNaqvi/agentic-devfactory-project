"use client";

import { useMemo, useState } from "react";
import { StockSearch, SectorFilter, StockTable, StockCard, ErrorBoundary } from "@/components/stocks";
import { useStocks } from "@/hooks/useStocks";
import type { ViewMode, RefreshInterval } from "@/types/psx";

const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: "Off", value: 0 },
  { label: "30s", value: 30 },
  { label: "60s", value: 60 },
  { label: "5m", value: 300 },
];

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(0);

  const { stocks, loading, error, lastUpdated, cached, cacheAge, refresh } = useStocks({
    sector: selectedSector,
    refreshInterval,
  });

  const sectors = useMemo(() => {
    const unique = new Set(stocks.map((s) => s.sector));
    return Array.from(unique).sort();
  }, [stocks]);

  const filteredStocks = useMemo(() => {
    if (!searchQuery) return stocks;
    const q = searchQuery.toLowerCase();
    return stocks.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q),
    );
  }, [stocks, searchQuery]);

  return (
    <ErrorBoundary>
      <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-zinc-900">
        <header className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">PSX Dashboard</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Pakistan Stock Exchange &mdash; Top 100 Stocks</p>
              </div>
              <div className="flex items-center gap-3">
                {lastUpdated && (
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    Updated {lastUpdated.toLocaleTimeString()}
                    {cached && ` (cached, ${cacheAge}s ago)`}
                  </span>
                )}
                <button
                  onClick={refresh}
                  disabled={loading}
                  className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                  aria-label="Refresh data"
                >
                  <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-.001 4.992H2.985m9.015-12.644h-4.992m.001 0H2.985m12.038 4.992v4.992m0 0h-4.992m4.992-4.992h4.992" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <StockSearch value={searchQuery} onChange={setSearchQuery} />
              <SectorFilter sectors={sectors} selectedSector={selectedSector} onChange={setSelectedSector} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-700 dark:bg-zinc-800">
                <button
                  onClick={() => setViewMode("table")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${viewMode === "table" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                  aria-label="Table view"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m7.5 0V5.625m0-1.5H12m7.5 0v1.5m0-1.5H12m0 12.75h7.5m-7.5-11.25h7.5m-7.5 3.75h7.5m-7.5 3.75h7.5" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("card")}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${viewMode === "card" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"}`}
                  aria-label="Card view"
                >
                  <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </button>
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value) as RefreshInterval)}
                className="rounded-lg border border-zinc-200 bg-white py-1.5 px-2 text-sm text-zinc-700 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                aria-label="Auto-refresh interval"
              >
                {REFRESH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    Auto: {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            {filteredStocks.length} stock{filteredStocks.length !== 1 ? "s" : ""}
            {searchQuery && ` matching "${searchQuery}"`}
            {selectedSector && ` in ${selectedSector}`}
          </div>

          {viewMode === "table" ? (
            <StockTable stocks={filteredStocks} loading={loading} error={error} onRefresh={refresh} />
          ) : (
            <>
              {error ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
                  <button onClick={refresh} className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                    Retry
                  </button>
                </div>
              ) : loading && filteredStocks.length === 0 ? (
                <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 dark:border-zinc-700 dark:bg-zinc-800">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading stock data...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredStocks.map((stock) => (
                    <StockCard key={stock.ticker} stock={stock} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
