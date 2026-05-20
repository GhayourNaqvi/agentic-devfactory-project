"use client";

interface CountdownTimerProps {
  seconds: number;
  totalSeconds?: number;
  className?: string;
}

export function CountdownTimer({ seconds, totalSeconds = 30, className }: CountdownTimerProps) {
  const progress = seconds / totalSeconds;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs tabular-nums text-zinc-400 dark:text-zinc-500 ${className || ""}`}
      aria-label={`${seconds} seconds until next refresh`}
    >
      <span className="relative inline-block h-2 w-2">
        <span
          className="absolute inset-0 rounded-full bg-zinc-300 dark:bg-zinc-600"
          style={{
            clipPath: `inset(${(1 - progress) * 100}% 0 0 0)`,
          }}
        />
      </span>
      {seconds}s
    </span>
  );
}
