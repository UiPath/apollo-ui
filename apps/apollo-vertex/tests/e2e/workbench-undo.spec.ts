import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open, urlQuery } from "./workbench-helpers";

/*
 * Every change to what the template view holds, or how it's laid out,
 * says what it did in a toast, with an Undo for that change only; Edit
 * mode's Reset layout goes back to the template's defaults, and can be
 * undone the same way.
 */

const QUERY = "?occupant=queue&view=template&slot=end-panel";

const toast = (page: Page) => page.locator("[data-sonner-toast]");
const undo = (page: Page) => toast(page).getByRole("button", { name: "Undo" });
const popover = (page: Page) =>
  page.locator("[data-slot=workbench-slot-popover]");
const end = (page: Page) =>
  page.locator("[data-slot=workbench-page] [data-slot=detail-page-end-panel]");
const tabNames = (page: Page) =>
  end(page)
    .locator("[data-part=tab-bar] [role=tab]:not([hidden])")
    .allTextContents();

async function ready(page: Page, query: string) {
  await open(page, query);
  await page
    .locator("[data-slot=workbench-page] [data-occupant]")
    .first()
    .waitFor();
  await settle(page);
}

async function openSlot(page: Page, slot: string) {
  await page
    .locator(`[data-slot=workbench-slot-chip][data-chip-slot=${slot}]`)
    .click();
  await popover(page)
    .and(page.locator(`[data-popover-slot=${slot}]`))
    .waitFor();
}

/** Adds an occupant to the end panel as a new tab, from its popover. */
async function addTab(page: Page, occupant: string) {
  await openSlot(page, "end-panel");
  await popover(page).getByRole("button", { name: "New tab" }).click();
  await popover(page)
    .locator("[data-slot=workbench-picker]")
    .getByRole("button", { name: occupant, exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(popover(page)).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("a change says what it did, and Undo takes it back", async ({ page }) => {
  // Narrow enough that the dock reaches the toast's corner.
  await page.setViewportSize({ width: 1600, height: 1000 });
  await ready(page, QUERY);
  await addTab(page, "Key facts");
  await expect(toast(page)).toContainText("Key facts added to End panel");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Key facts"]);
  // Above the dock, never over it.
  const [shown, dock] = await Promise.all([
    toast(page).boundingBox(),
    page.locator("[data-slot=workbench-dock]").boundingBox(),
  ]);
  expect((shown?.y ?? 0) + (shown?.height ?? 0)).toBeLessThanOrEqual(
    dock?.y ?? 0,
  );
  await undo(page).click();
  await expect.poll(() => tabNames(page)).toEqual([]);
  await expect(toast(page)).toContainText(
    "Undone: Key facts added to End panel",
  );
  await expect(undo(page)).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("end-panel-contents");
});

test("Undo takes back that change only, the latest", async ({ page }) => {
  await ready(page, QUERY);
  await addTab(page, "Key facts");
  await addTab(page, "Participants");
  // One toast: the latest change's.
  await expect(toast(page)).toHaveCount(1);
  await expect(toast(page)).toContainText("Participants added to End panel");
  await undo(page).click();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Key facts"]);
});

test("a layout change says so, and undoes too", async ({ page }) => {
  await ready(page, QUERY);
  await openSlot(page, "start-panel");
  await popover(page)
    .getByRole("group", { name: "Start panel in the page" })
    .getByRole("radio", { name: "Left out" })
    .click();
  await expect(toast(page)).toContainText("Start panel left out");
  expect(urlQuery(page)).toContain("start-panel-present=false");
  await page.keyboard.press("Escape");
  await undo(page).click();
  await expect.poll(() => urlQuery(page)).not.toContain("start-panel-present");
});

test("Reset layout, in Edit mode, goes back to the defaults and undoes", async ({
  page,
}) => {
  const busy =
    "&end-panel-contents=queue~overview:key-facts.participants&start-panel-present=false&end-panel-placement=beside-header";
  await ready(page, `${QUERY}${busy}`);
  await expect(page.getByRole("button", { name: "Reset layout" })).toHaveCount(
    0,
  );
  await ready(page, `${QUERY}${busy}&mode=edit`);
  await page.getByRole("button", { name: "Reset layout" }).click();
  await expect(toast(page)).toContainText(
    "Layout reset to the template's defaults",
  );
  // Queue stays in its slot; everything else is the template's own.
  await expect.poll(() => urlQuery(page)).toBe(`${QUERY}&mode=edit`);
  await expect(end(page).locator("[data-occupant=queue]")).toBeVisible();
  await undo(page).click();
  await expect
    .poll(() => urlQuery(page))
    .toContain("end-panel-contents=queue~overview:key-facts.participants");
  expect(urlQuery(page)).toContain("start-panel-present=false");
  expect(urlQuery(page)).toContain("end-panel-placement=beside-header");
});
