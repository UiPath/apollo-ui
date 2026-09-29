import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests for the Detail page template, its surfaces, and the design
 * architecture docs. Two projects:
 *
 * - core: every test not tagged @full. Runs on each PR that touches
 *   apollo-vertex (.github/workflows/apollo-vertex-e2e.yml).
 * - full: everything, including the @full sweeps across every theme, shell,
 *   placement, and padding. Runs nightly and on demand.
 *
 * Locally it reuses a running dev server on port 3000, or starts one. In CI
 * it serves a production build with `next start`.
 */
const PORT = Number(process.env.E2E_PORT ?? 3000);
const CI = Boolean(process.env.CI);
const VIEWPORT = { width: 1440, height: 900 };

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : 4,
  timeout: 60_000,
  reporter: CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Most checks measure end states. The motion spec turns motion back on.
    reducedMotion: "reduce",
    navigationTimeout: 120_000,
    trace: "retain-on-failure",
  },
  // The device preset brings its own 1280px viewport; ours wins.
  projects: [
    {
      name: "core",
      grepInvert: /@full/,
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORT },
    },
    { name: "full", use: { ...devices["Desktop Chrome"], viewport: VIEWPORT } },
  ],
  webServer: {
    command: CI
      ? `pnpm exec next start --port ${PORT}`
      : `pnpm dev --port ${PORT}`,
    url: `http://localhost:${PORT}/preview/detail-page`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
