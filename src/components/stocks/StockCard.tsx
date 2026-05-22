"use client";

import type { PsxStock } from "@/types/psx";
import { StockChart } from "./StockChart";

interface StockCardProps {
  stock: PsxStock;
  historicalData?: number[];
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

export function StockCard({ stock, historicalData }: StockCardProps) {
  const change = stock.ohlc.close - stock.ohlc.open;
  const changePercent = (change / stock.ohlc.open) * 100;
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{stock.ticker}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{stock.companyName}</p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
          {stock.sector}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatPrice(stock.ohlc.close)}
            <span className="ml-1 text-sm font-normal text-zinc-500 dark:text-zinc-400">{stock.currency}</span>
          </p>
          <p className={`mt-1 text-sm font-medium ${isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {isPositive ? "+" : ""}
            {formatPrice(change)} ({isPositive ? "+" : ""}
            {changePercent.toFixed(2)}%)
          </p>
        </div>
        {historicalData && historicalData.length > 1 && <StockChart data={historicalData} />}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-700">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Open</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(stock.ohlc.open)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">High</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(stock.ohlc.high)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Low</p>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{formatPrice(stock.ohlc.low)}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2 dark:border-zinc-700">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Volume: {formatVolume(stock.ohlc.volume)}</p>
        <p className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(stock.lastUpdated).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
