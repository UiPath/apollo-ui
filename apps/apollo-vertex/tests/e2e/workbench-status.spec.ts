import { fitsSurface } from "@/lib/composition";
import { EXAMPLE_ROLES } from "@/lib/occupant-entry";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { expect, test } from "./fixtures";
import { floorMeasured, open, statusAt } from "./workbench-helpers";

/*
 * The workbench's width status, for every occupant and sample: Clips comes
 * from the live overflow check on the stage, never from the floor alone.
 */

// Clips comes from the live overflow check, never from the floor alone.
for (const { spec } of OCCUPANT_SPECS) {
  const surface = SURFACE_SPECS.find((s) => fitsSurface(s, spec).fits);
  for (const sample of EXAMPLE_ROLES) {
    test(`${spec.name}, ${sample}: Clips only where the stage overflows`, async ({
      page,
    }) => {
      const base = `?occupant=${spec.name}&surface=${surface?.name}&sample=${sample}`;
      await open(page, `${base}&details=open`);
      await floorMeasured(page);
      const floor = Number(
        await page.locator("[data-mark=floor]").getAttribute("data-at"),
      );
      expect(floor).toBeGreaterThan(0);
      // At and above the floor: nothing overflows, so never Clips.
      for (const width of [floor, floor + 24, floor + 160]) {
        const at = await statusAt(page, `${base}&width=${width}`);
        expect(at.overflows, `overflows at ${width}px`).toBe(false);
        expect(at.status, `at ${width}px`).not.toBe("clips");
      }
      // Below it, where the stage overflows: Clips.
      if (floor - 8 >= 40) {
        const at = await statusAt(page, `${base}&width=${floor - 8}`);
        expect(at.overflows, `overflows at ${floor - 8}px`).toBe(true);
        expect(at.status).toBe("clips");
      }
    });
  }
}
