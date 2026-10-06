import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * Opening a slot's popover from the stage: pointing at a slot outlines it
 * and shows its chip above the frame, in place of the tag. Nothing covers
 * the page, so the occupant stays fully interactive.
 */

const QUERY = "?occupant=queue&view=template&slot=end-panel";

const slotBox = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-page] [data-slot=detail-page-${slot}]`);
const chip = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-stage-chip][data-chip-slot=${slot}]`);
const shownChips = (page: Page) =>
  page
    .locator("[data-slot=workbench-stage-chip][data-shown=true]")
    .evaluateAll((chips) =>
      chips.map((c) => (c instanceof HTMLElement ? c.dataset.chipSlot : "")),
    );
const outline = (page: Page) =>
  page.locator("[data-slot=workbench-stage-outline]");
const popover = (page: Page) =>
  page.locator("[data-slot=workbench-slot-popover]");
const tag = (page: Page) => page.locator("[data-slot=workbench-frame-tag]");

async function ready(page: Page) {
  await open(page, QUERY);
  await slotBox(page, "end-panel").locator("[data-occupant]").first().waitFor();
  await settle(page);
}

/** Points at the middle of a slot. */
async function pointAt(page: Page, slot: string) {
  const box = await slotBox(page, slot).boundingBox();
  if (!box) throw new Error(`No ${slot} box`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("pointing at a slot outlines it, and its chip takes the tag's place", async ({
  page,
}) => {
  await ready(page);
  await expect(tag(page)).toBeVisible();
  expect(await shownChips(page)).toEqual([]);
  await pointAt(page, "main");
  await expect.poll(() => shownChips(page)).toEqual(["main"]);
  await expect(outline(page)).toHaveAttribute("data-outline-slot", "main");
  await expect(tag(page)).toBeHidden();
  // The outline sits on the slot, and takes no clicks.
  const [slot, drawn] = await Promise.all([
    slotBox(page, "main").boundingBox(),
    outline(page).boundingBox(),
  ]);
  expect(drawn).toEqual(slot);
  expect(
    await outline(page).evaluate((el) => getComputedStyle(el).pointerEvents),
  ).toBe("none");
  // The chip is above the frame, at the slot's start, over nothing.
  const chipBox = await chip(page, "main").boundingBox();
  const frame = await page.locator("[data-slot=workbench-frame]").boundingBox();
  expect((chipBox?.y ?? 0) + (chipBox?.height ?? 0)).toBeLessThanOrEqual(
    frame?.y ?? 0,
  );
  expect(Math.round(chipBox?.x ?? 0)).toBe(Math.round(slot?.x ?? 0));

  // Off the page, nothing shows, and the tag is back.
  await page.mouse.move(5, 500);
  await expect.poll(() => shownChips(page)).toEqual([]);
  await expect(tag(page)).toBeVisible();
});

test("the chip opens the slot's popover, inside the slot", async ({ page }) => {
  await ready(page);
  await pointAt(page, "end-panel");
  const end = chip(page, "end-panel");
  await expect(end).toHaveAttribute("aria-haspopup", "dialog");
  await expect(end).toHaveAttribute("aria-expanded", "false");
  // Up across the header to the chip, at a normal pace: it stays.
  const box = await end.boundingBox();
  if (!box) throw new Error("No chip");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 8,
  });
  await expect.poll(() => shownChips(page)).toEqual(["end-panel"]);
  await end.click();
  await expect(popover(page)).toHaveAttribute("data-popover-slot", "end-panel");
  await expect(end).toHaveAttribute("aria-expanded", "true");
  // The same popover as the dock's, placed against the slot.
  const [slot, shown] = await Promise.all([
    slotBox(page, "end-panel").boundingBox(),
    popover(page).boundingBox(),
  ]);
  expect(shown?.y ?? 0).toBeGreaterThanOrEqual(slot?.y ?? 0);
  // Escape closes it, and focus goes back to the chip.
  await page.keyboard.press("Escape");
  await expect(popover(page)).toHaveCount(0);
  await expect(end).toBeFocused();
  await expect(end).toHaveAttribute("aria-expanded", "false");
});

test("the occupant stays fully interactive while its slot is outlined", async ({
  page,
}) => {
  await ready(page);
  await pointAt(page, "end-panel");
  await expect(outline(page)).toHaveAttribute("data-outline-slot", "end-panel");
  const waiting = slotBox(page, "end-panel").getByRole("tab", {
    name: "Waiting",
  });
  await waiting.click();
  await expect(waiting).toHaveAttribute("aria-selected", "true");
  await expect(popover(page)).toHaveCount(0);
});

test("the keyboard reaches every chip, in slot order", async ({ page }) => {
  await ready(page);
  await chip(page, "header").focus();
  await expect.poll(() => shownChips(page)).toEqual(["header"]);
  await expect(outline(page)).toHaveAttribute("data-outline-slot", "header");
  for (const next of ["start-panel", "main", "end-panel"]) {
    await page.keyboard.press("Tab");
    await expect(chip(page, next)).toBeFocused();
    await expect.poll(() => shownChips(page)).toEqual([next]);
  }
  await page.keyboard.press("Enter");
  await expect(popover(page)).toHaveAttribute("data-popover-slot", "end-panel");
});

test("one popover at a time, from the stage or the dock", async ({ page }) => {
  await ready(page);
  await chip(page, "main").focus();
  await page.keyboard.press("Enter");
  await expect(popover(page)).toHaveAttribute("data-popover-slot", "main");
  await page
    .locator("[data-slot=workbench-slot-chip][data-chip-slot=start-panel]")
    .click();
  await expect(popover(page)).toHaveCount(1);
  await expect(popover(page)).toHaveAttribute(
    "data-popover-slot",
    "start-panel",
  );
  // An outside click closes it.
  await page.mouse.click(5, 500);
  await expect(popover(page)).toHaveCount(0);
});
