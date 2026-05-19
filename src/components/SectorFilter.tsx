"use client";

import { useCallback } from "react";

interface SectorFilterProps {
  sectors: string[];
  selected: string | null;
  onChange: (sector: string | null) => void;
  loading?: boolean;
}

export function SectorFilter({ sectors, selected, onChange, loading }: SectorFilterProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value || null);
    },
    [onChange],
  );

  return (
    <select
      value={selected ?? ""}
      onChange={handleChange}
      disabled={loading}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
      aria-label="Filter by sector"
    >
      <option value="">All Sectors</option>
      {sectors.map((sector) => (
        <option key={sector} value={sector}>
          {sector}
        </option>
      ))}
    </select>
  );
}
