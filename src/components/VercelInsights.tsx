import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Vercel Web Analytics (page views, referrers, countries; no cookies) and Speed Insights
 * (real-visitor load times). Their scripts are served by Vercel at /_vercel/..., so they are
 * only added to builds that run on Vercel (VERCEL=1); local builds and tests would just 404.
 */
export function VercelInsights({ enabled = process.env.VERCEL === "1" }: { enabled?: boolean }) {
  if (!enabled) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
