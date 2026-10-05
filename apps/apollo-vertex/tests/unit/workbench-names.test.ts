import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";

/*
 * The workbench knows templates only through the template registry. No
 * workbench code outside the Detail page's registry entry may name the
 * Detail page, its slots, or its own vocabulary; the registry may only
 * register it.
 */

const APP = new URL("../../", import.meta.url).pathname;
const ROOTS = ["app/preview/occupants", "app/_components", "lib"];

// The Detail page's entry, and the registry that lists it.
const ENTRY = new Set([
  "app/_components/detail-page-host.ts",
  "app/_components/detail-page-frame.tsx",
]);
const REGISTRY = "app/_components/template-hosts.ts";

const files = (dir: string): string[] =>
  readdirSync(join(APP, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.includes(".generated.")
      ? [path]
      : [];
  });

const slots = detailPageTemplate.slots.map((slot) => slot.name);
const NAMES: readonly [string, RegExp][] = [
  ["the Detail page", /detail-page|detailPage|DetailPage|DETAIL_PAGE/],
  ["one of its slots", new RegExp(`["'\`](${slots.join("|")})["'\`]`)],
  [
    "its own vocabulary",
    /\b(PanelSide|enabledPanels|DetailPagePanels|PanelPlacement)\b|["'`](below|beside)-header["'`]/,
  ],
];

// What the registry may say: the line that registers the entry.
const registryLine = (line: string) =>
  /^import \{ DETAIL_PAGE_HOST \} from "\.\/detail-page-host";$/.test(line) ||
  /^\s*"detail-page": DETAIL_PAGE_HOST,$/.test(line);

const sources = ROOTS.flatMap((root) => files(root)).filter(
  (path) => !ENTRY.has(path),
);

describe("the workbench names no template", () => {
  it("reads every file it should", () => {
    expect(sources.length).toBeGreaterThan(20);
    expect(sources).toContain(REGISTRY);
  });

  it.each(sources)("%s", (path) => {
    const lines = readFileSync(join(APP, path), "utf8").split("\n");
    const found = lines.flatMap((line, index) =>
      path === REGISTRY && registryLine(line)
        ? []
        : NAMES.filter(([, pattern]) => pattern.test(line)).map(
            ([what]) => `${relative(".", path)}:${index + 1} names ${what}`,
          ),
    );
    expect(found).toEqual([]);
  });
});
