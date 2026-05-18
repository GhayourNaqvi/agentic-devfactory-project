"use client";

import { useState } from "react";
import type { PsxStock, SortField, SortDirection } from "@/types/psx";
import { StockChart } from "./StockChart";

interface StockTableProps {
  stocks: PsxStock[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  historicalData?: Record<string, number[]>;
}

interface SortHeaderProps {
  field: SortField;
  activeField: SortField;
  direction: SortDirection;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

function SortHeader({ field, activeField, direction, onSort, children }: SortHeaderProps) {
  return (
    <th
      className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        <span className="text-zinc-400 dark:text-zinc-500">
          {activeField === field ? (direction === "asc" ? "\u2191" : "\u2193") : "\u2195"}
        </span>
      </div>
    </th>
  );
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}K`;
  return volume.toString();
}

function formatPrice(price: number): string {
  return price.toFixed(2);
}

const ITEMS_PER_PAGE = 25;

export function StockTable({ stocks, loading, error, onRefresh, historicalData = {} }: StockTableProps) {
  const [sortField, setSortField] = useState<SortField>("ticker");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    const multiplier = sortDirection === "asc" ? 1 : -1;
    switch (sortField) {
      case "ticker":
        return multiplier * a.ticker.localeCompare(b.ticker);
      case "companyName":
        return multiplier * a.companyName.localeCompare(b.companyName);
      case "close":
        return multiplier * (a.ohlc.close - b.ohlc.close);
      case "volume":
        return multiplier * (a.ohlc.volume - b.ohlc.volume);
      case "change": {
        const changeA = (a.ohlc.close - a.ohlc.open) / a.ohlc.open;
        const changeB = (b.ohlc.close - b.ohlc.open) / b.ohlc.open;
        return multiplier * (changeA - changeB);
      }
      default:
        return 0;
    }
  });

  const totalPages = Math.ceil(sortedStocks.length / ITEMS_PER_PAGE);
  const paginatedStocks = sortedStocks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-900/20">
        <svg className="mb-3 h-10 w-10 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={onRefresh}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900"
        >
          Retry
        </button>
      </div>
    );
  }

  if (loading && stocks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-12 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-300" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
            <tr>
              <SortHeader field="ticker" activeField={sortField} direction={sortDirection} onSort={handleSort}>
                Ticker
              </SortHeader>
              <SortHeader field="companyName" activeField={sortField} direction={sortDirection} onSort={handleSort}>
                Company
              </SortHeader>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 sm:table-cell">Sector</th>
              <SortHeader field="close" activeField={sortField} direction={sortDirection} onSort={handleSort}>
                Price (PKR)
              </SortHeader>
              <SortHeader field="change" activeField={sortField} direction={sortDirection} onSort={handleSort}>
                Change
              </SortHeader>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 lg:table-cell">Chart</th>
              <SortHeader field="volume" activeField={sortField} direction={sortDirection} onSort={handleSort}>
                Volume
              </SortHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700">
            {paginatedStocks.map((stock) => {
              const change = stock.ohlc.close - stock.ohlc.open;
              const changePercent = (change / stock.ohlc.open) * 100;
              const isPositive = change >= 0;
              const histData = historicalData[stock.ticker];

              return (
                <tr key={stock.ticker} className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stock.ticker}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{stock.companyName}</td>
                  <td className="hidden px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400 sm:table-cell">
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-700">{stock.sector}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(stock.ohlc.close)}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {isPositive ? "+" : ""}
                    {changePercent.toFixed(2)}%
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {histData && histData.length > 1 ? <StockChart data={histData} width={80} height={32} /> : <span className="text-xs text-zinc-400">--</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-600 dark:text-zinc-300">{formatVolume(stock.ohlc.volume)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3 dark:border-zinc-700">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, stocks.length)} of {stocks.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-zinc-200 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-zinc-200 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
