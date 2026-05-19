"use client";

import type { StockSummary, SortConfig, SortField } from "@/types";

interface StockTableProps {
  stocks: StockSummary[];
  loading: boolean;
  error: string | null;
  sortConfig: SortConfig;
  onSort: (field: SortField) => void;
  onRetry?: () => void;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

function formatPrice(price: number): string {
  return price.toFixed(2);
}

function SortIcon({ field, config }: { field: SortField; config: SortConfig }) {
  if (config.field !== field) {
    return <span className="ml-1 text-zinc-300 dark:text-zinc-600">↕</span>;
  }
  return <span className="ml-1 text-zinc-600 dark:text-zinc-300">{config.direction === "asc" ? "↑" : "↓"}</span>;
}

export function StockTable({ stocks, loading, error, sortConfig, onSort, onRetry }: StockTableProps) {
  if (loading) {
    return (
      <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
        <table className="w-full text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              {["Ticker", "Company", "Price (PKR)", "Change %", "Volume", "Sector"].map((h) => (
                <th key={h} className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-b border-zinc-100 dark:border-zinc-800">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-4 w-20 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 px-6 py-8 dark:border-red-800 dark:bg-red-900/20">
        <svg className="mb-2 h-8 w-8 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 px-6 py-12 dark:border-zinc-700 dark:bg-zinc-800/50">
        <svg className="mb-2 h-10 w-10 text-zinc-300 dark:text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No stocks match your filters</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          <tr>
            <th className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400" onClick={() => onSort("ticker")}>
              <span className="inline-flex items-center">Ticker<SortIcon field="ticker" config={sortConfig} /></span>
            </th>
            <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">Company</th>
            <th className="cursor-pointer px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400" onClick={() => onSort("ltp")}>
              <span className="inline-flex items-center">Price (PKR)<SortIcon field="ltp" config={sortConfig} /></span>
            </th>
            <th className="cursor-pointer px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400" onClick={() => onSort("changePercent")}>
              <span className="inline-flex items-center">Change %<SortIcon field="changePercent" config={sortConfig} /></span>
            </th>
            <th className="cursor-pointer px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400" onClick={() => onSort("volume")}>
              <span className="inline-flex items-center">Volume<SortIcon field="volume" config={sortConfig} /></span>
            </th>
            <th className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400" onClick={() => onSort("sector")}>
              <span className="inline-flex items-center">Sector<SortIcon field="sector" config={sortConfig} /></span>
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.ticker} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50">
              <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">{stock.ticker}</td>
              <td className="max-w-[200px] truncate px-4 py-3 text-zinc-600 dark:text-zinc-300">{stock.companyName}</td>
              <td className="px-4 py-3 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatPrice(stock.ltp)}</td>
              <td className={`px-4 py-3 text-right font-medium tabular-nums ${stock.changePercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-600 dark:text-zinc-300">{formatVolume(stock.volume)}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{stock.sector}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
