import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RefreshButton } from "../RefreshButton";

describe("RefreshButton", () => {
  it("renders with refresh icon", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    expect(button).toBeTruthy();
  });

  it("calls onRefresh when clicked", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    button.click();
    await vi.waitFor(() => {
      expect(onRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("is disabled when isLoading is true", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} isLoading />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("shows pulse animation when secondsRemaining is 5 or less", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} secondsRemaining={3} />);
    const pulse = document.querySelector(".animate-pulse-ring");
    expect(pulse).toBeTruthy();
  });

  it("does not show pulse when secondsRemaining is above 5", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} secondsRemaining={10} />);
    const pulse = document.querySelector(".animate-pulse-ring");
    expect(pulse).toBeFalsy();
  });

  it("does not show pulse when isLoading is true", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} secondsRemaining={3} isLoading />);
    const pulse = document.querySelector(".animate-pulse-ring");
    expect(pulse).toBeFalsy();
  });

  it("applies custom className", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} className="custom-class" />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    expect(button.className).toContain("custom-class");
  });
});
