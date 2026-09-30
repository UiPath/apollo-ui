import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { OCCUPANT_SPECS } from "@/lib/occupants.generated";

const APP = new URL("../../app/", import.meta.url).pathname;

// The design architecture pages: every number on them renders from the specs.
const PAGES = [
  "guidelines/design-architecture/page.mdx",
  "templates/detail-page/page.mdx",
  "guidelines/design-architecture/creating-occupants/page.mdx",
  ...OCCUPANT_SPECS.map(({ spec }) => `patterns/${spec.name}/page.mdx`),
  ...readdirSync(join(APP, "surfaces"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `surfaces/${entry.name}/page.mdx`),
];

describe.each(PAGES)("%s", (page) => {
  const source = readFileSync(join(APP, page), "utf8");
  // Outside fenced code blocks, where examples may show braces on purpose.
  const prose = source.replaceAll(/```[\s\S]*?```/g, "");

  it("has no expression inside inline code, which MDX renders literally", () => {
    expect(prose.match(/`\{[A-Za-z_][\w.]*\}`/g) ?? []).toEqual([]);
  });

  it("has no em dashes", () => {
    expect(prose.match(/ — /g) ?? []).toEqual([]);
  });
});
