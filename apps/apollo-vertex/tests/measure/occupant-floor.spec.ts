import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "@playwright/test";
import {
  fitsSurface,
  occupantPadding,
  PADDED_INSET_PX,
} from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { INNER, inspect, openFixture } from "../e2e/occupant-inspect";

/*
 * Run by `pnpm measure:occupant <name>`, not by the test projects. For each
 * surface the occupant claims and each example role, it steps down from well
 * above the declared minWidth, 4px at a time, and records the narrowest width
 * with no clipping: the measured floor. Each test writes its own result, so
 * they run in parallel.
 */

const NAME = process.env.OCCUPANT ?? "";
/** A directory for the results, one file per surface and example. */
const OUT = process.env.MEASURE_OUT ?? "";
const STEP = 4;
const LOWEST = 40;

const entry = OCCUPANT_SPECS.find((o) => o.spec.name === NAME);

if (entry) {
  const { spec, examples } = entry;
  const inset = occupantPadding(spec) === "padded" ? 2 * PADDED_INSET_PX : 0;
  const from = Math.max(spec.requires.minWidth + 200, 480);
  for (const surface of SURFACE_SPECS.filter(
    (s) => fitsSurface(s, spec).fits,
  )) {
    for (const example of examples) {
      test(`${surface.name}, ${example}`, async ({ page }) => {
        await openFixture(
          page,
          `occupant=${spec.name}&surface=${surface.name}&example=${example}`,
        );
        // The first width, stepping down, that clips; the floor is one step above.
        let floor: number | null = null;
        for (let width = from; width >= LOWEST; width -= STEP) {
          const r = await inspect(
            page,
            INNER[surface.name] ?? "",
            width + inset,
            0,
          );
          if (r.problems.length > 0) break;
          floor = width;
        }
        const result = {
          surface: surface.name,
          orientation: surface.provides.orientation,
          example,
          floor,
          from,
          declared: spec.requires.minWidth,
        };
        if (OUT)
          writeFileSync(
            join(OUT, `${surface.name}.${example}.json`),
            JSON.stringify(result),
          );
      });
    }
  }
}
