import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { VercelInsights } from "./VercelInsights";

vi.mock("@vercel/analytics/next", () => ({ Analytics: () => <i data-testid="analytics" /> }));
vi.mock("@vercel/speed-insights/next", () => ({ SpeedInsights: () => <i data-testid="speed-insights" /> }));

describe("VercelInsights", () => {
  it("adds nothing outside Vercel, so local builds make no requests to missing scripts", () => {
    render(<VercelInsights enabled={false} />);
    expect(screen.queryByTestId("analytics")).toBeNull();
    expect(screen.queryByTestId("speed-insights")).toBeNull();
  });

  it("loads Web Analytics and Speed Insights on Vercel", () => {
    render(<VercelInsights enabled />);
    expect(screen.getByTestId("analytics")).toBeTruthy();
    expect(screen.getByTestId("speed-insights")).toBeTruthy();
  });

  it("is on only for builds that run on Vercel", () => {
    vi.stubEnv("VERCEL", "1");
    const { unmount } = render(<VercelInsights />);
    expect(screen.getByTestId("analytics")).toBeTruthy();
    unmount();
    vi.stubEnv("VERCEL", "");
    render(<VercelInsights />);
    expect(screen.queryByTestId("analytics")).toBeNull();
    vi.unstubAllEnvs();
  });
});
