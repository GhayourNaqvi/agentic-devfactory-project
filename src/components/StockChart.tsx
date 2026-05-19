"use client";

import { useCallback, useEffect, useState } from "react";

type ChartPeriod = "1D" | "1W" | "1M" | "3M" | "1Y";

interface StockChartProps {
  ticker: string;
  period: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
}

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const PERIODS: ChartPeriod[] = ["1D", "1W", "1M", "3M", "1Y"];

function generateMockData(ticker: string, period: ChartPeriod): CandleData[] {
  const seed = ticker.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  let price = 50 + (seed % 200);
  const count = period === "1D" ? 24 : period === "1W" ? 7 : period === "1M" ? 30 : period === "3M" ? 90 : 365;
  const data: CandleData[] = [];
  const now = new Date();

  for (let i = count; i >= 0; i--) {
    const date = new Date(now);
    if (period === "1D") {
      date.setHours(date.getHours() - i);
    } else {
      date.setDate(date.getDate() - i);
    }

    const volatility = 0.02 + (seed % 3) * 0.01;
    const change = (Math.sin(seed + i * 0.1) * volatility + (Math.random() - 0.5) * volatility) * price;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    const volume = Math.floor(100000 + Math.random() * 900000 + seed * 1000);

    data.push({
      time: date.toISOString().split("T")[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });

    price = close;
    if (price < 10) price = 10 + Math.random() * 5;
  }

  return data;
}

export function StockChart({ ticker, period, onPeriodChange }: StockChartProps) {
  const [data, setData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setData(generateMockData(ticker, period));
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [ticker, period]);

  const svgWidth = 800;
  const svgHeight = 300;
  const padding = { top: 20, right: 60, bottom: 40, left: 10 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const volumeHeight = 50;
  const priceHeight = chartHeight - volumeHeight - 10;

  const prices = data.flatMap((d) => [d.high, d.low]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 100;
  const priceRange = maxPrice - minPrice || 1;
  const maxVolume = data.length > 0 ? Math.max(...data.map((d) => d.volume)) : 1;

  const scaleY = (price: number) => padding.top + priceHeight - ((price - minPrice) / priceRange) * priceHeight;
  const scaleX = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;

  const closePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(i).toFixed(1)} ${scaleY(d.close).toFixed(1)}`)
    .join(" ");

  const areaPath = closePath + ` L ${scaleX(data.length - 1).toFixed(1)} ${(padding.top + priceHeight).toFixed(1)} L ${padding.left.toFixed(1)} ${(padding.top + priceHeight).toFixed(1)} Z`;

  const isPositive = data.length >= 2 ? data[data.length - 1].close >= data[0].close : true;
  const lineColor = isPositive ? "#16a34a" : "#dc2626";
  const areaGradientId = `area-${ticker}-${period}`;

  const priceLabels = Array.from({ length: 5 }, (_, i) => {
    const price = minPrice + (priceRange * i) / 4;
    return { price, y: scaleY(price) };
  });

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-lg font-semibold text-zinc-900 dark:text-zinc-100">{ticker}</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                p === period
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
        </div>
      ) : (
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          {priceLabels.map((label, i) => (
            <g key={i}>
              <line x1={padding.left} y1={label.y} x2={svgWidth - padding.right} y2={label.y} stroke="currentColor" className="text-zinc-100 dark:text-zinc-700" strokeWidth="1" />
              <text x={svgWidth - padding.right + 5} y={label.y + 4} className="fill-zinc-400 dark:fill-zinc-500" fontSize="10">
                {label.price.toFixed(1)}
              </text>
            </g>
          ))}

          {data.length > 1 && <path d={areaPath} fill={`url(#${areaGradientId})`} />}
          {data.length > 1 && <path d={closePath} fill="none" stroke={lineColor} strokeWidth="1.5" />}

          {data.map((d, i) => {
            const x = scaleX(i);
            const barWidth = Math.max(1, chartWidth / data.length * 0.6);
            const volBarHeight = (d.volume / maxVolume) * volumeHeight;
            const volY = padding.top + priceHeight + 10 + volumeHeight - volBarHeight;
            const candleUp = d.close >= d.open;
            return (
              <g key={i}>
                <line x1={x} y1={scaleY(d.high)} x2={x} y2={scaleY(d.low)} stroke={candleUp ? "#16a34a" : "#dc2626"} strokeWidth="1" />
                <rect
                  x={x - barWidth / 2}
                  y={scaleY(Math.max(d.open, d.close))}
                  width={barWidth}
                  height={Math.max(1, Math.abs(scaleY(d.open) - scaleY(d.close)))}
                  fill={candleUp ? "#16a34a" : "#dc2626"}
                  opacity="0.8"
                />
                <rect x={x - barWidth / 2} y={volY} width={barWidth} height={volBarHeight} fill={candleUp ? "#16a34a" : "#dc2626"} opacity="0.3" />
              </g>
            );
          })}
        </svg>
      )}

      {data.length > 0 && (
        <div className="mt-2 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{data[0].time}</span>
          <span>{data[data.length - 1].time}</span>
        </div>
      )}
    </div>
  );
}
