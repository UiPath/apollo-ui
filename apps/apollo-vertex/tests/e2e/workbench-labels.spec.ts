import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * Edit mode's slot labels: just above each slot's outline, so they never
 * cover what's in the slot, or inside the top-right corner where there's
 * no room above (the header, at the top of the page).
 */

const editSlot = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-edit-slot][data-edit-slot=${slot}]`);
const slotBox = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-page] [data-slot=detail-page-${slot}]`);

async function ready(page: Page, query: string) {
  await open(page, query);
  await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
  await settle(page);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("in Edit, slot labels sit above each outline, clear of the occupants", async ({
  page,
}) => {
  await ready(
    page,
    "?view=template&header-contents=stage-strip&start-panel-contents=participants~activity-timeline~key-facts&main-contents=queue&mode=edit",
  );
  const label = (slot: string) =>
    editSlot(page, slot).locator("[data-slot=workbench-edit-slot-label]");
  for (const slot of ["start-panel", "main", "end-panel"]) {
    await expect(label(slot)).toHaveAttribute("data-label-at", "above");
    const [box, outline] = await Promise.all([
      label(slot).boundingBox(),
      editSlot(page, slot).boundingBox(),
    ]);
    // Just outside: its bottom on or above the outline's top edge.
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
      Math.ceil(outline?.y ?? 0),
    );
    expect(Math.round(box?.x ?? 0)).toBe(Math.round(outline?.x ?? 0));
  }
  // The header has no room above it: inside, at its top-right corner.
  await expect(label("header")).toHaveAttribute("data-label-at", "inside");
  const [header, outline] = await Promise.all([
    label("header").boundingBox(),
    editSlot(page, "header").boundingBox(),
  ]);
  expect((header?.x ?? 0) + (header?.width ?? 0)).toBeGreaterThan(
    (outline?.x ?? 0) + (outline?.width ?? 0) - 16,
  );
  expect(header?.y ?? 0).toBeGreaterThanOrEqual(outline?.y ?? 0);
  // No label covers any occupant's content, the start panel's tabs included.
  await expect(
    slotBox(page, "start-panel").getByRole("tab").first(),
  ).toBeVisible();
  const covered = await page.evaluate(() => {
    const labels = [
      ...document.querySelectorAll("[data-slot=workbench-edit-slot-label]"),
    ].map((el) => ({ name: el.textContent, box: el.getBoundingClientRect() }));
    const content = [
      ...document.querySelectorAll(
        "[data-slot=workbench-page] [data-occupant] *, [data-slot=workbench-page] [role=tab]",
      ),
    ].filter(
      (el) =>
        el.children.length === 0 &&
        (el.textContent?.trim() || el.tagName === "svg"),
    );
    return labels.flatMap(({ name, box }) =>
      content
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return (
            r.width > 0 &&
            r.left < box.right &&
            box.left < r.right &&
            r.top < box.bottom &&
            box.top < r.bottom
          );
        })
        .map((el) => `${name}: ${el.textContent?.trim() || el.tagName}`),
    );
  });
  expect(covered).toEqual([]);
});
