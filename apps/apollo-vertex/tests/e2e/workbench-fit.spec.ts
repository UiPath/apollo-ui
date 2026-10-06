import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * At Fit, the template view scales the page into the stage above the
 * dock, with a gap, so the frame's bottom edge is never under it: with
 * the columns open or closed, and after arriving from the surface view,
 * whose dock is a different height. The surface view has no Fit: like
 * 100%, it scrolls under the dock instead.
 */

/** The dock's top less the frame's bottom, in px: positive is clear. */
const clearance = (page: Page) =>
  page.evaluate(() => {
    const frame = document.querySelector("[data-slot=workbench-frame]");
    const dock = document.querySelector("[data-slot=workbench-dock]");
    if (!frame || !dock) return Number.NEGATIVE_INFINITY;
    return (
      dock.getBoundingClientRect().top - frame.getBoundingClientRect().bottom
    );
  });

async function clearOfTheDock(page: Page, label: string) {
  await settle(page);
  await settle(page);
  expect(await clearance(page), label).toBeGreaterThanOrEqual(16);
}

for (const [width, height] of [
  [1280, 720],
  [1100, 720],
  [1920, 1080],
] as const) {
  test(`at Fit, the frame's bottom stays above the dock, ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    // From the surface view, with Details open: its dock is taller.
    await open(page, "?occupant=queue&details=open");
    await page.getByRole("radio", { name: "Template", exact: true }).click();
    await page
      .locator("[data-slot=workbench-page] [data-occupant=queue]")
      .waitFor();
    await clearOfTheDock(page, "Preview, list open");
    const toggle = (panel: string) =>
      page
        .locator(`[data-slot=workbench-header] [aria-controls="${panel}"]`)
        .click();
    await page
      .getByRole("group", { name: "Mode" })
      .getByRole("radio", { name: "Edit" })
      .click();
    await clearOfTheDock(page, "Edit, list and inspector open");
    await toggle("workbench-list");
    await clearOfTheDock(page, "Edit, inspector open, list closed");
    await toggle("workbench-inspector");
    await clearOfTheDock(page, "Edit, both closed");
    await toggle("workbench-list");
    await clearOfTheDock(page, "Edit, list open, inspector closed");
  });
}

test("at 100%, the page can still run under the dock, and scrolls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page, "?occupant=queue&view=template&zoom=100");
  await page
    .locator("[data-slot=workbench-page] [data-occupant=queue]")
    .waitFor();
  await settle(page);
  expect(await clearance(page)).toBeLessThan(0);
  const stage = page.locator("[data-slot=workbench-stage]");
  await stage.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await settle(page);
  expect(await clearance(page)).toBeGreaterThanOrEqual(16);
});
