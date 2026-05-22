"use client";

interface StockChartProps {
  data: number[];
  width?: number;
  height?: number;
}

export function StockChart({ data, width = 120, height = 40 }: StockChartProps) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} className="text-zinc-300 dark:text-zinc-600">
        <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" className="text-xs" fill="currentColor">
          No data
        </text>
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lineColor = data[data.length - 1] >= data[0] ? "#16a34a" : "#dc2626";
  const fillColor = data[data.length - 1] >= data[0] ? "rgba(22, 163, 74, 0.1)" : "rgba(220, 38, 38, 0.1)";

  const areaPoints = `${padding},${height - padding} ${points.join(" ")} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polygon points={areaPoints} fill={fillColor} />
      <polyline points={points.join(" ")} fill="none" stroke={lineColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
