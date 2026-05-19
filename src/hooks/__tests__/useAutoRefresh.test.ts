import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoRefresh } from "./useAutoRefresh";

describe("useAutoRefresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with the default interval", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutoRefresh(onRefresh));

    expect(result.current.secondsRemaining).toBe(30);
    expect(result.current.isPaused).toBe(false);
    expect(result.current.isRefreshing).toBe(false);
  });

  it("initializes with a custom interval", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 60 }),
    );

    expect(result.current.secondsRemaining).toBe(60);
  });

  it("starts paused when enabled is false", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { enabled: false }),
    );

    expect(result.current.isPaused).toBe(true);
  });

  it("calls onRefresh when timer reaches zero", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 5 }),
    );

    expect(result.current.secondsRemaining).toBe(5);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("decrements secondsRemaining over time", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 10 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsRemaining).toBe(7);
  });

  it("pauses the timer", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 10 }),
    );

    await act(async () => {
      result.current.pause();
    });

    expect(result.current.isPaused).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("resumes the timer after pause", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 10 }),
    );

    await act(async () => {
      result.current.pause();
    });

    await act(async () => {
      result.current.resume();
    });

    expect(result.current.isPaused).toBe(false);
    expect(result.current.secondsRemaining).toBe(10);
  });

  it("resets the timer", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 10 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    expect(result.current.secondsRemaining).toBe(6);

    await act(async () => {
      result.current.reset();
    });

    expect(result.current.secondsRemaining).toBe(10);
  });

  it("refreshNow calls onRefresh and resets timer", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 10 }),
    );

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsRemaining).toBe(7);

    await act(async () => {
      await result.current.refreshNow();
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(result.current.secondsRemaining).toBe(10);
  });

  it("sets isRefreshing during refreshNow", async () => {
    let resolveRefresh: () => void;
    const refreshPromise = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    const onRefresh = vi.fn().mockReturnValue(refreshPromise);
    const { result } = renderHook(() =>
      useAutoRefresh(onRefresh, { intervalSeconds: 10 }),
    );

    let refreshDone = false;
    act(() => {
      result.current.refreshNow().then(() => {
        refreshDone = true;
      });
    });

    expect(result.current.isRefreshing).toBe(true);

    await act(async () => {
      resolveRefresh!();
      await refreshPromise;
    });

    expect(refreshDone).toBe(true);
    expect(result.current.isRefreshing).toBe(false);
  });
});
