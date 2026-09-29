import { createRequire } from "node:module";
import type { Page } from "@playwright/test";
import {
  fitsSurface,
  occupantPadding,
  PADDED_INSET_PX,
} from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { expect, test, type Theme } from "./fixtures";
import { INNER, inspect, openFixture } from "./occupant-inspect";

/*
 * Every registered occupant, in every surface it claims (fitsSurface),
 * with every example (stress included). Occupants are checked against
 * surfaces, not a template's slots; templates keep their own slot checks.
 * Registering an occupant (pnpm generate:occupants) is all it takes.
 *
 * - No clipping or overflow from its minWidth up. Truncation passes only
 *   where the full text stays in a title. Core: three widths. Full: every
 *   16px to +480, in both themes.
 * - An axe scan. Core: ready, light and dark. Full: every standard state.
 */

const AXE = createRequire(__filename).resolve("axe-core/axe.min.js");
const CORE_WIDTHS = [0, 40, 200];
const SWEEP = Array.from({ length: 31 }, (_, i) => i * 16);
const STATES = ["loading", "empty", "error", "agent-updating"];

async function axeViolations(page: Page) {
  await page.addScriptTag({ path: AXE });
  return page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: {
          run: (context: Element) => Promise<{
            violations: { id: string; nodes: { target: string[] }[] }[];
          }>;
        };
      }
    ).axe;
    const result = await axe.run(
      document.querySelector("[data-slot=occupant-fixture]")!,
    );
    return result.violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    );
  });
}

interface Case {
  spec: (typeof OCCUPANT_SPECS)[number]["spec"];
  surface: string;
  example: string;
  query: string;
  inset: number;
}

// Every occupant, in every surface it claims, with every example.
const CASES: Case[] = OCCUPANT_SPECS.flatMap(({ spec, examples }) =>
  SURFACE_SPECS.filter((surface) => fitsSurface(surface, spec).fits).flatMap(
    (surface) =>
      examples.map((example) => ({
        spec,
        surface: surface.name,
        example,
        query: `occupant=${spec.name}&surface=${surface.name}&example=${example}`,
        inset: occupantPadding(spec) === "padded" ? 2 * PADDED_INSET_PX : 0,
      })),
  ),
);

const WIDTH_RUNS = [
  { steps: CORE_WIDTHS, theme: "light", tag: "" },
  { steps: SWEEP, theme: "light", tag: " (every 16px) @full" },
  { steps: SWEEP, theme: "dark", tag: " (every 16px) @full" },
] as const satisfies readonly {
  steps: readonly number[];
  theme: Theme;
  tag: string;
}[];

for (const { spec } of OCCUPANT_SPECS) {
  test(`${spec.name} claims at least one surface`, () => {
    expect(CASES.some((c) => c.spec.name === spec.name)).toBe(true);
  });
}

for (const c of CASES) {
  for (const run of WIDTH_RUNS) {
    test.describe(`${c.spec.name} in ${c.surface}, ${c.example}, ${run.theme}${run.tag}`, () => {
      test.use({ theme: run.theme });
      test(`no clipping from ${c.spec.requires.minWidth}px up`, async ({
        page,
      }) => {
        await openFixture(page, c.query);
        for (const extra of run.steps) {
          const width = c.spec.requires.minWidth + extra;
          const r = await inspect(
            page,
            INNER[c.surface] ?? "",
            width + c.inset,
          );
          expect(r.occupantWidth, `rendered at ${width}px`).toBe(width);
          expect(r.problems, `at ${width}px`).toEqual([]);
        }
      });
    });
  }
  for (const theme of ["light", "dark"] as const) {
    test.describe(`${c.spec.name} in ${c.surface}, ${c.example}, ${theme}`, () => {
      test.use({ theme });
      test("passes an axe scan", async ({ page }) => {
        await openFixture(page, c.query);
        expect(await axeViolations(page)).toEqual([]);
      });
      for (const state of STATES) {
        test(`passes an axe scan, ${state} @full`, async ({ page }) => {
          await openFixture(page, `${c.query}&state=${state}`);
          expect(await axeViolations(page)).toEqual([]);
        });
      }
    });
  }
}
