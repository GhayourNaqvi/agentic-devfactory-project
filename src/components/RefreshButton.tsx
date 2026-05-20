"use client";

import { useCallback } from "react";

interface RefreshButtonProps {
  onRefresh: () => Promise<void>;
  isLoading?: boolean;
  secondsRemaining?: number;
  className?: string;
}

export function RefreshButton({
  onRefresh,
  isLoading = false,
  secondsRemaining,
  className,
}: RefreshButtonProps) {
  const handleClick = useCallback(async () => {
    await onRefresh();
  }, [onRefresh]);

  const showPulse = secondsRemaining !== undefined && secondsRemaining <= 5 && secondsRemaining > 0 && !isLoading;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`group relative inline-flex items-center justify-center rounded-lg border border-zinc-200 p-2 text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 ${className || ""}`}
      aria-label="Refresh data"
    >
      {showPulse && <span className="absolute inset-0 animate-pulse-ring rounded-lg border border-blue-400/50" />}
      <svg
        className={`h-4 w-4 transition-transform ${isLoading ? "animate-spin" : "group-hover:rotate-180"}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
        />
      </svg>
    </button>
  );
}
