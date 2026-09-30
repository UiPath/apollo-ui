import { fitsSurface } from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { expect, test } from "./fixtures";

/*
 * The occupant workbench: every registered occupant renders in each surface
 * it claims, and every other surface says why not, from fits(). Where the
 * surface's minimum is narrower than the occupant needs, it says that too.
 */
for (const { spec } of OCCUPANT_SPECS) {
  test(`the workbench shows ${spec.name} in the surfaces it fits, and why not elsewhere`, async ({
    page,
  }) => {
    await page.goto(`/preview/occupants?occupant=${spec.name}`);
    for (const surface of SURFACE_SPECS) {
      const bench = page.locator(`[data-workbench-surface=${surface.name}]`);
      const claim = fitsSurface(surface, spec);
      if (claim.fits) {
        const slider = bench.getByRole("slider");
        // Its width slider starts at the surface's own minimum.
        if (surface.width)
          await expect(slider).toHaveAttribute(
            "aria-valuemin",
            String(surface.width.min),
          );
        // Too narrow there, it says so, and fits once the surface is wider.
        const needs = bench.getByText(/^Needs \d+px/);
        if (await needs.isVisible()) {
          await slider.focus();
          await page.keyboard.press("End");
        }
        await expect(
          bench.locator(`[data-occupant=${spec.name}]`),
        ).toBeVisible();
      } else {
        for (const reason of claim.reasons)
          await expect(bench).toContainText(reason);
      }
    }
  });
}
