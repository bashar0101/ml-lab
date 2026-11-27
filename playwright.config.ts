import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3100",
    // Every test starts as a returning visitor, so the first-visit tour stays out of the way (tour.spec.ts opts out).
    storageState: { cookies: [], origins: [{ origin: "http://localhost:3100", localStorage: [{ name: "mllab:tour-done", value: "1" }] }] },
  },
  webServer: { command: "npx serve out -l 3100", port: 3100, reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "phone", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
});
