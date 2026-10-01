import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// check:occupant-scope, run against a throwaway repository with the app in a
// subdirectory, as it is in this monorepo.
const SCRIPT = join(__dirname, "../../scripts/check-occupant-scope.ts");

let repo = "";
let app = "";
const git = (...args: string[]) =>
  execFileSync(
    "git",
    [
      "-c",
      "user.name=Test",
      "-c",
      "user.email=test@example.com",
      "-c",
      "commit.gpgsign=false",
      ...args,
    ],
    { cwd: repo, encoding: "utf8" },
  ).trim();
const write = (path: string, content: unknown) => {
  const full = join(app, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(
    full,
    typeof content === "string" ? content : JSON.stringify(content, null, 2),
  );
};
const commit = (message: string) => {
  git("add", "-A");
  git("commit", "-q", "-m", message);
};
const check = () =>
  spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--no-warnings",
      SCRIPT,
      "--app",
      app,
      "--range",
      "base..HEAD",
    ],
    { encoding: "utf8" },
  );

const REGISTRY = (extra: object[] = []) => ({
  items: [
    { name: "occupant", files: [] },
    { name: "demo", meta: { layer: "occupant" }, title: "Demo" },
    ...extra,
  ],
});

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "occupant-scope-"));
  app = join(repo, "apps/app");
  git("init", "-q");
  write("scripts/check-occupant-scope.ts", "// present from here on\n");
  write("registry.json", REGISTRY());
  write("locales/en.json", { demo_label: "Demo", retry: "Retry" });
  write("registry/demo/demo.tsx", "export {};\n");
  write("registry/occupant/occupant.tsx", "export {};\n");
  commit("base");
  git("tag", "base");
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe("check:occupant-scope", () => {
  it("passes an occupant commit that stays in its folder and registration", () => {
    write("registry/demo/demo.tsx", "export const changed = true;\n");
    write("registry/demo/examples/primary.example-adapter.ts", "export {};\n");
    write("app/patterns/demo/page.mdx", "# Demo\n");
    write("registry.json", {
      items: [
        { name: "occupant", files: [] },
        { name: "demo", meta: { layer: "occupant" }, title: "Demo, renamed" },
      ],
    });
    write("locales/en.json", {
      demo_empty: "Nothing yet.",
      demo_label: "Demo",
      retry: "Retry",
    });
    commit("feat: change demo");
    expect(check().status).toBe(0);
  });

  it("passes a shared-layer commit that changes no occupant", () => {
    write("registry/occupant/occupant.tsx", "export const kit = true;\n");
    commit("feat: change the kit");
    expect(check().status).toBe(0);
  });

  it("fails an occupant commit that also changes the kit", () => {
    write("registry/demo/demo.tsx", "export const changed = true;\n");
    write("registry/occupant/occupant.tsx", "export const kit = true;\n");
    commit("feat: change demo and the kit");
    const result = check();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "registry/occupant/occupant.tsx is outside the demo occupant",
    );
  });

  it("fails an occupant commit that changes another item's registration or copy", () => {
    write("registry/demo/demo.tsx", "export const changed = true;\n");
    write("registry.json", REGISTRY([{ name: "extra", files: [] }]));
    write("locales/en.json", { demo_label: "Demo", retry: "Try again" });
    commit("feat: change demo and more");
    const result = check();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "registry.json changes more than the demo registration",
    );
    expect(result.stderr).toContain(
      "locales/en.json changes more than the demo registration",
    );
  });

  it("passes a new occupant with its registration", () => {
    write("registry/fresh/fresh.tsx", "export {};\n");
    write(
      "registry.json",
      REGISTRY([{ name: "fresh", meta: { layer: "occupant" } }]),
    );
    write("locales/en.json", {
      demo_label: "Demo",
      fresh_label: "Fresh",
      retry: "Retry",
    });
    commit("feat: add fresh");
    expect(check().status).toBe(0);
  });

  it("skips commits from before the check existed", () => {
    git("rm", "-q", "apps/app/scripts/check-occupant-scope.ts");
    commit("chore: before the check");
    git("tag", "-f", "base", "HEAD~1");
    write("registry/demo/demo.tsx", "export const changed = true;\n");
    write("registry/occupant/occupant.tsx", "export const kit = true;\n");
    commit("feat: mixed, but before the check");
    expect(check().status).toBe(0);
  });
});
