import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

/** For `pnpm measure:occupant`: the same server and browser as the tests. */
export default defineConfig({
  ...base,
  testDir: "tests/measure",
  retries: 0,
  reporter: [["line"]],
  projects: [{ name: "measure", use: base.projects?.[0]?.use ?? {} }],
});
