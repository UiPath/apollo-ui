import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, urlQuery } from "./workbench-helpers";

/*
 * The template view's Preview and Edit modes, and its inspector. Preview
 * is the page as people use it; Edit outlines every slot, makes the
 * occupants inert, and a click anywhere in a slot selects it for the
 * inspector, the template view's right-hand column. Details is the
 * surface view's column only.
 */

const QUERY = "?occupant=queue&view=template&slot=end-panel";

const editSlot = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-edit-slot][data-edit-slot=${slot}]`);
const slotBox = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-page] [data-slot=detail-page-${slot}]`);
const modeButton = (page: Page, name: "Preview" | "Edit") =>
  page
    .getByRole("group", { name: "Mode" })
    .getByRole("radio", { name, exact: true });
const panelToggle = (page: Page, name: "inspector" | "details") =>
  page.getByRole("button", { name: new RegExp(`^(Show|Hide) ${name}$`) });
const details = (page: Page) => page.locator("#workbench-details");
const heading = (page: Page) =>
  page.locator("[data-slot=workbench-inspector-heading]");
const empty = (page: Page) =>
  page.locator("[data-slot=workbench-inspector-empty]");
/** Each slot's own width, before the stage's scale. */
const slotWidths = (page: Page) =>
  page
    .locator("[data-template=detail-page] > [data-slot]")
    .evaluateAll((slots) =>
      slots.map((slot) => (slot instanceof HTMLElement ? slot.offsetWidth : 0)),
    );
const pageWidth = (page: Page) =>
  page
    .locator("[data-slot=workbench-page]")
    .evaluate((el) => (el instanceof HTMLElement ? el.offsetWidth : 0));
const outlineStyle = (page: Page, slot: string) =>
  editSlot(page, slot).evaluate((el) => getComputedStyle(el).outlineStyle);

async function ready(page: Page, query = QUERY) {
  await open(page, query);
  await slotBox(page, "end-panel").locator("[data-occupant]").first().waitFor();
  await settle(page);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("Preview, the default, has no outlines or inspector, and occupants work", async ({
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
  await expect(inspector(page)).toBeHidden();
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

test("Edit opens the inspector, and a click in a slot selects it", async ({
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
  await settle(page);
  expect(await slotWidths(page)).toEqual(before);
  // Each outline is its slot's box, named for it, and controls the inspector.
  const [outline, slot] = await Promise.all([
    editSlot(page, "main").boundingBox(),
    slotBox(page, "main").boundingBox(),
  ]);
  const round = (b: typeof slot) =>
    b && [b.x, b.y, b.width, b.height].map((n) => Math.round(n));
  expect(round(outline)).toEqual(round(slot));
  await expect(editSlot(page, "main")).toHaveAccessibleName("Main settings");
  await expect(editSlot(page, "main")).toHaveAttribute(
    "aria-controls",
    "workbench-inspector",
  );
  // Nothing selected: the inspector says what to do.
  await expect(inspector(page)).toBeVisible();
  await expect(empty(page)).toHaveText(
    "Select a slot to see its contents and layout.",
  );
  expect(await outlineStyle(page, "end-panel")).toBe("dashed");

  // A click on the occupant selects its slot, not the occupant's own control.
  const waiting = slotBox(page, "end-panel").getByRole("tab", {
    name: "Waiting",
  });
  const box = await waiting.boundingBox();
  if (!box) throw new Error("No Waiting tab");
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(inspector(page)).toHaveAttribute(
    "data-inspector-slot",
    "end-panel",
  );
  await expect(heading(page)).toHaveText("End panel");
  await expect(waiting).toHaveAttribute("aria-selected", "false");
  await expect(editSlot(page, "end-panel")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // It keeps a solid outline once the pointer leaves.
  await page.mouse.move(0, 0);
  expect(await outlineStyle(page, "end-panel")).toBe("solid");
  // Escape deselects.
  await page.keyboard.press("Escape");
  await expect(empty(page)).toBeVisible();
  await expect(editSlot(page, "end-panel")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  // Focus is back on it, so its outline is the focus ring's, not selection's.
  await expect(editSlot(page, "end-panel")).toBeFocused();
  await expect(editSlot(page, "end-panel")).toHaveAttribute(
    "data-selected",
    "false",
  );
});

test("a ghost and a closed slot are selected the same way", async ({
  page,
}) => {
  // Not a legacy link, which keeps its occupant's panel open.
  await open(
    page,
    "?view=template&end-panel-contents=queue&start-panel-present=false&end-panel-state=closed&mode=edit",
  );
  const ghost = page.locator("[data-ghost-slot=start-panel]");
  await ghost.click();
  await expect(ghost).toHaveAttribute("aria-pressed", "true");
  expect(await ghost.evaluate((el) => getComputedStyle(el).borderStyle)).toBe(
    "solid",
  );
  await expect(heading(page)).toHaveText("Start panel");
  await expect(
    inspector(page).locator("[data-slot=workbench-slot-left-out]"),
  ).toHaveText("Kept for when the start panel is shown again.");
  // A closed panel has no width: a strip on its edge stands for it.
  const closed = page.locator(
    "[data-slot=workbench-closed-slot][data-edit-slot=end-panel]",
  );
  await expect(closed).toHaveAccessibleName("End panel, closed · 1 occupant");
  await closed.click();
  await expect(heading(page)).toHaveText("End panel");
  await expect(ghost).toHaveAttribute("aria-pressed", "false");
});

test("in Edit, Enter moves focus into the inspector, and Escape back to the slot", async ({
  page,
}) => {
  await ready(page, `${QUERY}&mode=edit`);
  await editSlot(page, "header").focus();
  for (const next of ["start-panel", "main"]) {
    await page.keyboard.press("Tab");
    await expect(editSlot(page, next)).toBeFocused();
  }
  await page.keyboard.press("Enter");
  await expect(inspector(page)).toHaveAttribute("data-inspector-slot", "main");
  await expect(heading(page)).toBeFocused();
  await expect(heading(page)).toHaveText("Main");
  await page.keyboard.press("Escape");
  await expect(editSlot(page, "main")).toBeFocused();
  await expect(empty(page)).toBeVisible();
});

test("the right-hand column is one view's: the inspector, or Details", async ({
  page,
}) => {
  await ready(page);
  // The template view never shows Details, and its toggle is the inspector's.
  await expect(details(page)).toHaveCount(0);
  await expect(panelToggle(page, "details")).toHaveCount(0);
  const toggle = panelToggle(page, "inspector");
  await expect(toggle).toHaveAccessibleName("Show inspector");
  // It's open only in Edit: from Preview, the toggle switches to Edit.
  await toggle.click();
  await expect(modeButton(page, "Edit")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(inspector(page)).toBeVisible();
  await expect(toggle).toHaveAccessibleName("Hide inspector");
  // In Edit, it closes and opens the inspector, and Edit stays.
  await toggle.click();
  await expect(inspector(page)).toBeHidden();
  await expect(modeButton(page, "Edit")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await toggle.click();
  await expect(inspector(page)).toBeVisible();
  // Preview closes it; Edit opens it.
  await modeButton(page, "Preview").click();
  await expect(inspector(page)).toBeHidden();
  await modeButton(page, "Edit").click();
  await expect(inspector(page)).toBeVisible();
  await modeButton(page, "Preview").click();
  await expect(inspector(page)).toBeHidden();
  // The surface view has Details, and no inspector.
  await page.getByRole("radio", { name: "Surface", exact: true }).click();
  await expect(inspector(page)).toHaveCount(0);
  await panelToggle(page, "details").click();
  await expect(details(page)).toBeVisible();
});

test("the list selects an occupant's slot, or says how to add it, in Edit", async ({
  page,
}) => {
  // From Preview: a click in the list switches to Edit.
  await ready(page);
  const row = (name: string) =>
    page
      .locator("#workbench-list li")
      .filter({ hasText: name })
      .getByRole("button")
      .first();
  // On the page: its slot is selected.
  await row("Queue").click();
  await expect(modeButton(page, "Edit")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(urlQuery(page)).toContain("mode=edit");
  await expect(inspector(page)).toHaveAttribute(
    "data-inspector-slot",
    "end-panel",
  );
  await expect(editSlot(page, "end-panel")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  // Off it, from Preview again: Edit, and the inspector says how to put it there.
  await modeButton(page, "Preview").click();
  await expect(inspector(page)).toBeHidden();
  await row("Key facts").click();
  await expect(modeButton(page, "Edit")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(heading(page)).toHaveText("Key facts");
  await expect(
    inspector(page).locator("[data-slot=workbench-inspector-hint]"),
  ).toHaveText("Drag it onto a slot, or add it from a slot's contents.");
  await expect(editSlot(page, "end-panel")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  // The surface view opens the occupant last selected in the list.
  await page.getByRole("radio", { name: "Surface", exact: true }).click();
  await expect(
    page.locator("[data-slot=workbench-stage] [data-occupant=key-facts]"),
  ).toBeVisible();
  expect(urlQuery(page)).toContain("occupant=key-facts");
});

test("the inspector narrows the stage: Fit rescales, and no width changes", async ({
  page,
}) => {
  // Narrow enough that the page fits the stage only without the inspector.
  await page.setViewportSize({ width: 1600, height: 1000 });
  await ready(page);
  const zoom = () =>
    page.locator("[data-slot=workbench-zoom-level]").innerText();
  const shown = () =>
    page
      .locator("[data-slot=workbench-page]")
      .evaluate((el) => el.getBoundingClientRect().width);
  const page0 = await pageWidth(page);
  const slots0 = await slotWidths(page);
  const [zoom0, shown0] = [await zoom(), await shown()];
  await panelToggle(page, "inspector").click();
  await expect(inspector(page)).toBeVisible();
  // Fit scales the page down to the narrower stage.
  await expect.poll(zoom).not.toBe(zoom0);
  await settle(page);
  expect(await shown()).toBeLessThan(shown0);
  // The page and every slot keep their own widths.
  expect(await pageWidth(page)).toBe(page0);
  expect(await slotWidths(page)).toEqual(slots0);
  await panelToggle(page, "inspector").click();
  await expect.poll(zoom).toBe(zoom0);
  expect(await slotWidths(page)).toEqual(slots0);
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
  // A link in Edit opens with the inspector open.
  await expect(inspector(page)).toBeVisible();
  expect(urlQuery(page)).toContain("mode=edit");
  await modeButton(page, "Preview").click();
  await expect(page.locator("[data-slot=workbench-edit-slot]")).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("mode=");
  // The surface view has no modes, and drops the param.
  await open(page, "?occupant=queue&mode=edit");
  await expect(page.getByRole("group", { name: "Mode" })).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("mode=");
});
