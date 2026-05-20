"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAutoRefreshOptions {
  intervalSeconds?: number;
  enabled?: boolean;
}

interface UseAutoRefreshReturn {
  secondsRemaining: number;
  isPaused: boolean;
  isRefreshing: boolean;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  refreshNow: () => Promise<void>;
}

export function useAutoRefresh(
  onRefresh: () => Promise<void>,
  options: UseAutoRefreshOptions = {},
): UseAutoRefreshReturn {
  const { intervalSeconds = 30, enabled = true } = options;

  const [secondsRemaining, setSecondsRemaining] = useState(intervalSeconds);
  const [isPaused, setIsPaused] = useState(!enabled);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefreshRef = useRef(onRefresh);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intervalSecRef = useRef(intervalSeconds);
  const isPausedRef = useRef(isPaused);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    intervalSecRef.current = intervalSeconds;
  }, [intervalSeconds]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setSecondsRemaining(intervalSecRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearTimer();
          setIsRefreshing(true);
          onRefreshRef.current()
            .catch(() => {})
            .finally(() => {
              setIsRefreshing(false);
              if (!isPausedRef.current) {
                setSecondsRemaining(intervalSecRef.current);
                startTimer();
              }
            });
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsPaused(true);
  }, [clearTimer]);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setIsRefreshing(false);
    setSecondsRemaining(intervalSecRef.current);
  }, [clearTimer]);

  const refreshNow = useCallback(async () => {
    clearTimer();
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
    } finally {
      setIsRefreshing(false);
      setSecondsRemaining(intervalSecRef.current);
      if (!isPausedRef.current) {
        startTimer();
      }
    }
  }, [clearTimer, startTimer]);

  useEffect(() => {
    if (enabled && !isPaused) {
      startTimer();
    }
    return clearTimer;
  }, [enabled, isPaused, startTimer, clearTimer]);

  useEffect(() => {
    setSecondsRemaining(intervalSeconds);
    if (!isPaused && enabled) {
      clearTimer();
      startTimer();
    }
  }, [intervalSeconds]);

  return {
    secondsRemaining,
    isPaused,
    isRefreshing,
    pause,
    resume,
    reset,
    refreshNow,
  };
}
