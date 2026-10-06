import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot, urlQuery } from "./workbench-helpers";

/*
 * Every change to what the template view holds, or how it's laid out,
 * says what it did in a toast, with an Undo for that change only; Edit
 * mode's Reset layout goes back to the template's defaults, and can be
 * undone the same way.
 */

const QUERY = "?occupant=queue&view=template&slot=end-panel";

const toast = (page: Page) => page.locator("[data-sonner-toast]");
const undo = (page: Page) => toast(page).getByRole("button", { name: "Undo" });
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

/** Adds an occupant to the end panel as a new tab, in the inspector. */
async function addTab(page: Page, occupant: string) {
  await selectSlot(page, "end-panel");
  await inspector(page).getByRole("button", { name: "New tab" }).click();
  await inspector(page)
    .locator("[data-slot=workbench-picker]")
    .getByRole("button", { name: occupant, exact: true })
    .click();
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
  // Above the dock, never over it, and clear of the inspector.
  const [shown, dock, column] = await Promise.all([
    toast(page).boundingBox(),
    page.locator("[data-slot=workbench-dock]").boundingBox(),
    inspector(page).boundingBox(),
  ]);
  expect((shown?.y ?? 0) + (shown?.height ?? 0)).toBeLessThanOrEqual(
    dock?.y ?? 0,
  );
  expect((shown?.x ?? 0) + (shown?.width ?? 0)).toBeLessThanOrEqual(
    column?.x ?? 0,
  );
  await undo(page).click();
  await expect.poll(() => tabNames(page)).toEqual([]);
  await expect(toast(page)).toContainText(
    "Undone: Key facts added to End panel",
  );
  await expect(undo(page)).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("key-facts");
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
  await selectSlot(page, "start-panel");
  await inspector(page)
    .getByRole("group", { name: "Start panel in the page" })
    .getByRole("radio", { name: "Left out" })
    .click();
  await expect(toast(page)).toContainText("Start panel left out");
  expect(urlQuery(page)).toContain("start-panel-present=false");
  await undo(page).click();
  await expect.poll(() => urlQuery(page)).not.toContain("start-panel-present");
});

test("Reset layout, in Edit mode, empties the page and undoes", async ({
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
  // No occupant is focused: every slot empties, and the layout is the
  // template's own.
  await expect.poll(() => urlQuery(page)).toBe("?view=template&mode=edit");
  await expect(
    page.locator("[data-slot=workbench-page] [data-occupant=queue]"),
  ).toHaveCount(0);
  await undo(page).click();
  await expect
    .poll(() => urlQuery(page))
    .toContain("end-panel-contents=queue~overview:key-facts.participants");
  expect(urlQuery(page)).toContain("start-panel-present=false");
  expect(urlQuery(page)).toContain("end-panel-placement=beside-header");
});

const ghost = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-ghost-slot][data-ghost-slot=${slot}]`);
const LEFT_OUT = `${QUERY}&start-panel-present=false`;

test("in Edit, a left-out slot is a ghost where it would sit; the inspector includes it", async ({
  page,
}) => {
  await ready(page, LEFT_OUT);
  await expect(ghost(page, "start-panel")).toHaveCount(0);
  await ready(page, `${LEFT_OUT}&mode=edit`);
  const start = ghost(page, "start-panel");
  await expect(start).toHaveText("Start panel, left out");
  await expect(start).toHaveAccessibleName("Start panel, left out");
  // Where it would sit: at the template's start, in main's rows.
  const [box, main, template] = await Promise.all([
    start.boundingBox(),
    page
      .locator("[data-slot=workbench-page] [data-slot=detail-page-main]")
      .boundingBox(),
    page
      .locator("[data-slot=workbench-page] [data-template=detail-page]")
      .boundingBox(),
  ]);
  expect(Math.round(box?.x ?? 0)).toBe(Math.round(template?.x ?? 0));
  expect(Math.round(box?.y ?? 0)).toBe(Math.round(main?.y ?? 0));
  // A click selects it; the inspector puts it back.
  await selectSlot(page, "start-panel");
  await inspector(page)
    .getByRole("group", { name: "Start panel in the page" })
    .getByRole("radio", { name: "Included" })
    .click();
  await expect(toast(page)).toContainText("Start panel included");
  await expect.poll(() => urlQuery(page)).not.toContain("start-panel-present");
  await expect(start).toHaveCount(0);
  await undo(page).click();
  await expect
    .poll(() => urlQuery(page))
    .toContain("start-panel-present=false");
});

test("dropping on a ghost includes the slot and adds the occupant, as one change", async ({
  page,
}) => {
  await ready(page, `${LEFT_OUT}&mode=edit`);
  const row = page
    .locator("#workbench-list li")
    .filter({ hasText: "Key facts" })
    .getByRole("button")
    .first();
  const from = await row.boundingBox();
  if (!from) throw new Error("No row");
  await page.mouse.move(from.x + 40, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 60, from.y + from.height / 2 + 16, {
    steps: 4,
  });
  const zone = page.locator(
    '[data-slot=workbench-drop-zone][data-zone="start-panel:ghost"]',
  );
  const to = await zone.boundingBox();
  if (!to) throw new Error("No ghost zone");
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, {
    steps: 8,
  });
  await expect(zone).toHaveAttribute("data-over", "true");
  await page.mouse.up();
  await expect(toast(page)).toContainText("Key facts added to Start panel");
  await expect
    .poll(() => urlQuery(page))
    .toContain("start-panel-contents=key-facts");
  expect(urlQuery(page)).not.toContain("start-panel-present");
  // One Undo takes back both.
  await undo(page).click();
  await expect
    .poll(() => urlQuery(page))
    .toContain("start-panel-present=false");
  expect(urlQuery(page)).not.toContain("start-panel-contents");
});
