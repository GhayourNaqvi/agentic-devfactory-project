import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CountdownTimer } from "../CountdownTimer";

describe("CountdownTimer", () => {
  it("renders with seconds remaining", () => {
    render(<CountdownTimer seconds={15} totalSeconds={30} />);
    expect(screen.getByText("15s")).toBeTruthy();
  });

  it("shows correct aria label", () => {
    render(<CountdownTimer seconds={10} totalSeconds={30} />);
    const timer = screen.getByLabelText("10 seconds until next refresh");
    expect(timer).toBeTruthy();
  });

  it("renders with default totalSeconds of 30", () => {
    render(<CountdownTimer seconds={5} />);
    expect(screen.getByText("5s")).toBeTruthy();
  });

  it("applies custom className", () => {
    render(<CountdownTimer seconds={20} className="custom-class" />);
    const span = screen.getByText("20s");
    expect(span.className).toContain("custom-class");
  });

  it("shows 0s when timer is at zero", () => {
    render(<CountdownTimer seconds={0} totalSeconds={30} />);
    expect(screen.getByText("0s")).toBeTruthy();
  });
});
