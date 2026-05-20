import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RefreshButton } from "../RefreshButton";

describe("RefreshButton", () => {
  it("renders with refresh icon", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    expect(button).toBeInTheDocument();
  });

  it("calls onRefresh when clicked", async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<RefreshButton onRefresh={onRefresh} />);

    await user.click(screen.getByRole("button", { name: /refresh data/i }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("is disabled when isLoading is true", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} isLoading />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    expect(button).toBeDisabled();
  });

  it("shows pulse animation when secondsRemaining is 5 or less", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} secondsRemaining={3} />);
    const pulse = document.querySelector(".animate-pulse-ring");
    expect(pulse).toBeInTheDocument();
  });

  it("does not show pulse when secondsRemaining is above 5", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} secondsRemaining={10} />);
    const pulse = document.querySelector(".animate-pulse-ring");
    expect(pulse).not.toBeInTheDocument();
  });

  it("does not show pulse when isLoading is true", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} secondsRemaining={3} isLoading />);
    const pulse = document.querySelector(".animate-pulse-ring");
    expect(pulse).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined);
    render(<RefreshButton onRefresh={onRefresh} className="custom-class" />);
    const button = screen.getByRole("button", { name: /refresh data/i });
    expect(button.className).toContain("custom-class");
  });
});
