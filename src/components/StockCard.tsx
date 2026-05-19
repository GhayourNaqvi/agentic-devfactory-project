"use client";

import type { StockSummary } from "@/types";

interface StockCardProps {
  stock: StockSummary;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

export function StockCard({ stock }: StockCardProps) {
  const isPositive = stock.changePercent >= 0;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stock.ticker}</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{stock.companyName}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {stock.sector}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
            {stock.ltp.toFixed(2)}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">PKR</p>
        </div>
        <div className={`text-right ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          <p className="text-lg font-semibold tabular-nums">
            {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
          </p>
          <p className="text-xs tabular-nums">
            {isPositive ? "+" : ""}{stock.change.toFixed(2)}
          </p>
        </div>
      </div>
      <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-700">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Vol: {formatVolume(stock.volume)}
        </p>
      </div>
    </div>
  );
}
