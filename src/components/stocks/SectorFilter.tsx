"use client";

interface SectorFilterProps {
  sectors: string[];
  selectedSector: string | null;
  onChange: (sector: string | null) => void;
}

export function SectorFilter({ sectors, selectedSector, onChange }: SectorFilterProps) {
  return (
    <select
      value={selectedSector ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      className="rounded-lg border border-zinc-200 bg-white py-2 px-3 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500"
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
