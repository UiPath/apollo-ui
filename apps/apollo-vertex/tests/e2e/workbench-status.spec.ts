import { fitsSurface } from "@/lib/composition";
import { EXAMPLE_ROLES } from "@/lib/occupant-entry";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { expect, test } from "./fixtures";
import { floorMeasured, open, statusAt } from "./workbench-helpers";

/*
 * The workbench's width status, for every occupant and sample: Clips shows
 * exactly where the occupant checks' overflow function finds a problem on
 * the stage, never from the floor alone.
 */

const CLIPS = "Clips";

async function measuredFloor(page: import("@playwright/test").Page) {
  await floorMeasured(page);
  return Number(
    await page.locator("[data-mark=floor]").getAttribute("data-at"),
  );
}

for (const { spec } of OCCUPANT_SPECS) {
  const surface = SURFACE_SPECS.find((s) => fitsSurface(s, spec).fits)!.name;
  for (const sample of EXAMPLE_ROLES) {
    test(`${spec.name}, ${sample}: Clips only where the stage overflows`, async ({
      page,
    }) => {
      const base = `?occupant=${spec.name}&surface=${surface}&sample=${sample}`;
      await open(page, `${base}&details=open`);
      const floor = await measuredFloor(page);
      expect(floor).toBeGreaterThan(0);
      // At and above the floor: nothing overflows, so never Clips.
      for (const width of [floor, floor + 24, floor + 160]) {
        const at = await statusAt(page, `${base}&width=${width}`, surface);
        expect(at.problems, `at ${width}px`).toEqual([]);
        expect(at.status, `at ${width}px`).not.toBe(CLIPS);
      }
      // Below it, where the stage overflows: Clips.
      if (floor - 8 >= 40) {
        const at = await statusAt(page, `${base}&width=${floor - 8}`, surface);
        expect(at.problems, `at ${floor - 8}px`).not.toEqual([]);
        expect(at.status).toBe(CLIPS);
      }
    });
  }
}

// The floor is measured in the ready state. In the others, Clips still
// follows what's on the stage: a spinner or skeleton overflows, or doesn't,
// on its own.
for (const state of ["loading", "agent-updating"]) {
  test(`queue, ${state}: Clips only where the stage overflows`, async ({
    page,
  }) => {
    const base = `?occupant=queue&surface=side-panel&state=${state}`;
    await open(page, `${base}&details=open`);
    const floor = await measuredFloor(page);
    for (const width of [40, floor - 8, floor, floor + 160]) {
      const at = await statusAt(page, `${base}&width=${width}`, "side-panel");
      expect(
        at.status === CLIPS,
        `at ${width}px: ${at.problems.join("; ")}`,
      ).toBe(at.problems.length > 0);
    }
  });
}
