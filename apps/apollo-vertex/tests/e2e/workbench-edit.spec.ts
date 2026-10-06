import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open, urlQuery } from "./workbench-helpers";

/*
 * The template view's Preview and Edit modes. Preview is the page as
 * people use it; Edit outlines every slot, makes the occupants inert, and
 * opens a slot's popover from a click anywhere in it.
 */

const QUERY = "?occupant=queue&view=template&slot=end-panel";

const editSlot = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-edit-slot][data-edit-slot=${slot}]`);
const slotBox = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-page] [data-slot=detail-page-${slot}]`);
const popover = (page: Page) =>
  page.locator("[data-slot=workbench-slot-popover]");
const modeButton = (page: Page, name: "Preview" | "Edit") =>
  page
    .getByRole("group", { name: "Mode" })
    .getByRole("radio", { name, exact: true });
const slotWidths = (page: Page) =>
  page
    .locator("[data-template=detail-page] > [data-slot]")
    .evaluateAll((slots) =>
      slots.map((slot) => Math.round(slot.getBoundingClientRect().width)),
    );

async function ready(page: Page, query = QUERY) {
  await open(page, query);
  await slotBox(page, "end-panel").locator("[data-occupant]").first().waitFor();
  await settle(page);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("Preview, the default, has no outlines, and occupants work", async ({
  page,
}) => {
  await ready(page);
  await expect(modeButton(page, "Preview")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  // A labeled segmented control: its words show, and the chosen one is filled.
  await expect(page.getByRole("group", { name: "Mode" })).toHaveText(
    "PreviewEdit",
  );
  const fill = (name: "Preview" | "Edit") =>
    modeButton(page, name).evaluate(
      (el) => getComputedStyle(el).backgroundColor,
    );
  expect(await fill("Preview")).not.toBe(await fill("Edit"));
  await expect(page.locator("[data-slot=workbench-edit-slot]")).toHaveCount(0);
  await expect(page.locator("[data-slot=workbench-page]")).not.toHaveAttribute(
    "inert",
  );
  const waiting = slotBox(page, "end-panel").getByRole("tab", {
    name: "Waiting",
  });
  await waiting.click();
  await expect(waiting).toHaveAttribute("aria-selected", "true");
  expect(urlQuery(page)).not.toContain("mode=");
});

test("Edit outlines every slot, makes occupants inert, and opens a slot on a click", async ({
  page,
}) => {
  await ready(page);
  const before = await slotWidths(page);
  await modeButton(page, "Edit").click();
  expect(urlQuery(page)).toContain("mode=edit");
  await expect(page.locator("[data-slot=workbench-edit-slot]")).toHaveCount(4);
  await expect(page.locator("[data-slot=workbench-page]")).toHaveAttribute(
    "inert",
  );
  // Edit changes no slot's width.
  expect(await slotWidths(page)).toEqual(before);
  // Each outline is its slot's box, named for it.
  const [outline, slot] = await Promise.all([
    editSlot(page, "main").boundingBox(),
    slotBox(page, "main").boundingBox(),
  ]);
  expect(outline).toEqual(slot);
  await expect(editSlot(page, "main")).toHaveAccessibleName("Main settings");
  await expect(editSlot(page, "main")).toHaveAttribute(
    "aria-haspopup",
    "dialog",
  );

  // A click on the occupant opens its slot, not the occupant's own control.
  const waiting = slotBox(page, "end-panel").getByRole("tab", {
    name: "Waiting",
  });
  const box = await waiting.boundingBox();
  if (!box) throw new Error("No Waiting tab");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(popover(page)).toHaveAttribute("data-popover-slot", "end-panel");
  await expect(waiting).toHaveAttribute("aria-selected", "false");
  await expect(editSlot(page, "end-panel")).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  // Beside the slot, toward the page's middle, never over it; clear of the dock.
  const [shown, end, dock] = await Promise.all([
    popover(page).boundingBox(),
    slotBox(page, "end-panel").boundingBox(),
    page.locator("[data-slot=workbench-dock]").boundingBox(),
  ]);
  expect((shown?.x ?? 0) + (shown?.width ?? 0)).toBeLessThanOrEqual(
    end?.x ?? 0,
  );
  expect((shown?.y ?? 0) + (shown?.height ?? 0)).toBeLessThanOrEqual(
    dock?.y ?? 0,
  );
  await page.keyboard.press("Escape");
  await expect(popover(page)).toHaveCount(0);
  await expect(editSlot(page, "end-panel")).toBeFocused();
});

test("a slot opened on the stage gets its popover beside it, toward the middle", async ({
  page,
}) => {
  await ready(page, `${QUERY}&mode=edit`);
  const placed = async (slot: string) => {
    await editSlot(page, slot).click();
    await expect(popover(page)).toHaveAttribute("data-popover-slot", slot);
    const [shown, box] = await Promise.all([
      popover(page).boundingBox(),
      slotBox(page, slot).boundingBox(),
    ]);
    await page.keyboard.press("Escape");
    await expect(popover(page)).toHaveCount(0);
    return { shown, box };
  };
  // The start panel's opens on its right.
  const start = await placed("start-panel");
  expect(start.shown?.x ?? 0).toBeGreaterThanOrEqual(
    (start.box?.x ?? 0) + (start.box?.width ?? 0),
  );
  // The header spans the page: its opens below it.
  const header = await placed("header");
  expect(header.shown?.y ?? 0).toBeGreaterThanOrEqual(
    (header.box?.y ?? 0) + (header.box?.height ?? 0),
  );
  // From the dock, it still opens above the chip.
  const chip = page.locator(
    "[data-slot=workbench-slot-chip][data-chip-slot=main]",
  );
  await chip.click();
  const [shown, chipBox] = await Promise.all([
    popover(page).boundingBox(),
    chip.boundingBox(),
  ]);
  expect((shown?.y ?? 0) + (shown?.height ?? 0)).toBeLessThanOrEqual(
    chipBox?.y ?? 0,
  );
});

test("in Edit, slots are focusable and Enter opens one", async ({ page }) => {
  await ready(page, `${QUERY}&mode=edit`);
  await editSlot(page, "header").focus();
  for (const next of ["start-panel", "main"]) {
    await page.keyboard.press("Tab");
    await expect(editSlot(page, next)).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(popover(page)).toHaveAttribute("data-popover-slot", "main");
});

test("the dock's slot chips open popovers in both modes", async ({ page }) => {
  for (const query of [QUERY, `${QUERY}&mode=edit`]) {
    await ready(page, query);
    await page
      .locator("[data-slot=workbench-slot-chip][data-chip-slot=start-panel]")
      .click();
    await expect(popover(page)).toHaveAttribute(
      "data-popover-slot",
      "start-panel",
    );
  }
});

test("the mode survives a link round trip, and belongs to the template view", async ({
  page,
}) => {
  await ready(page, `${QUERY}&mode=edit`);
  await page.reload();
  await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
  await expect(modeButton(page, "Edit")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(urlQuery(page)).toContain("mode=edit");
  await modeButton(page, "Preview").click();
  await expect(page.locator("[data-slot=workbench-edit-slot]")).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("mode=");
  // The surface view has no modes, and drops the param.
  await open(page, "?occupant=queue&mode=edit");
  await expect(page.getByRole("group", { name: "Mode" })).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("mode=");
});
