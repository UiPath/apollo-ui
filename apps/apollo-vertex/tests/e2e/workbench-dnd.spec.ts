import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open, urlQuery } from "./workbench-helpers";

/*
 * Dragging an occupant from the list onto the template view, in Edit
 * mode: a new tab at a position, stacking onto a tab or the showing tab's
 * content, replacing a single slot's occupant, refused places with why,
 * the keyboard, and the link. Queue is focused in the end panel.
 */

const EDIT = "?occupant=queue&view=template&slot=end-panel&mode=edit";

const end = (page: Page) =>
  page.locator("[data-slot=workbench-page] [data-slot=detail-page-end-panel]");
const bar = (page: Page) => end(page).locator("[data-part=tab-bar]");
const tabNames = (page: Page) =>
  bar(page).locator("[role=tab]:not([hidden])").allTextContents();
const selected = (page: Page) =>
  bar(page).locator("[role=tab][aria-selected=true]");
const row = (page: Page, occupant: string) =>
  page.locator("#workbench-list li").filter({ hasText: occupant });
const zone = (page: Page, id: string) =>
  page.locator(`[data-slot=workbench-drop-zone][data-zone="${id}"]`);

async function ready(page: Page, query: string) {
  await open(page, query);
  await page
    .locator("[data-slot=workbench-page] [data-occupant]")
    .first()
    .waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
}

/** Picks up an occupant's row by pointer, past the threshold. */
async function pickUp(page: Page, occupant: string) {
  const box = await row(page, occupant)
    .getByRole("button")
    .first()
    .boundingBox();
  if (!box) throw new Error(`No ${occupant} row`);
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 60, box.y + box.height / 2 + 16, { steps: 4 });
  await page.locator("[data-slot=workbench-drop-zones]").waitFor();
}

/** Moves the drag over a zone. */
async function over(page: Page, id: string) {
  const box = await zone(page, id).boundingBox();
  if (!box) throw new Error(`No ${id} zone`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 10,
  });
  await expect(zone(page, id)).toHaveAttribute("data-over", "true");
}

async function drag(page: Page, occupant: string, id: string) {
  await pickUp(page, occupant);
  await over(page, id);
  await page.mouse.up();
  await expect(page.locator("[data-slot=workbench-drop-zones]")).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("dropping between two tabs makes a new tab there, and shows it", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~participants`);
  await pickUp(page, "Key facts");
  await over(page, "end-panel:insert:1");
  await expect(page.locator("[data-slot=workbench-insert-line]")).toBeVisible();
  await page.mouse.up();
  await expect
    .poll(() => tabNames(page))
    .toEqual(["Queue", "Key facts", "Participants"]);
  await expect(selected(page)).toHaveText("Key facts");
  // The link says so, and opens the same.
  const query =
    "end-panel-contents=queue~key-facts~participants&end-panel-tab=key-facts";
  await expect.poll(() => urlQuery(page)).toContain(query);
  await page.reload();
  await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
  await expect
    .poll(() => tabNames(page))
    .toEqual(["Queue", "Key facts", "Participants"]);
  await expect(selected(page)).toHaveText("Key facts");
});

test("dropping on a tab's label stacks into it, which highlights", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~key-facts`);
  await pickUp(page, "Participants");
  await over(page, "end-panel:tab:1");
  await expect(zone(page, "end-panel:tab:1")).toHaveClass(/ring-primary/);
  await page.mouse.up();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  await expect(selected(page)).toHaveText("Overview");
  expect(urlQuery(page)).toContain(
    "end-panel-contents=queue~overview:key-facts.participants",
  );
});

test("dropping on the content stacks into the tab that's showing", async ({
  page,
}) => {
  await ready(
    page,
    `${EDIT}&end-panel-contents=queue~key-facts&end-panel-tab=key-facts`,
  );
  await drag(page, "Participants", "end-panel:content");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  expect(urlQuery(page)).toContain("overview:key-facts.participants");
});

test("dropping on a slot that holds one puts it in place of the one there", async ({
  page,
}) => {
  await ready(page, `${EDIT}&main-contents=key-facts`);
  const main = page.locator(
    "[data-slot=workbench-page] [data-slot=detail-page-main]",
  );
  await expect(main.locator("[data-occupant=key-facts]")).toBeVisible();
  await drag(page, "Participants", "main:slot");
  await expect(main.locator("[data-occupant=participants]")).toBeVisible();
  await expect
    .poll(() => urlQuery(page))
    .toContain("main-contents=participants");
});

test("a refused place is dimmed while dragging, and says why when it's under the drag", async ({
  page,
}) => {
  // Stage strip doesn't fit a side panel.
  await ready(page, EDIT);
  await pickUp(page, "Stage strip");
  await expect(zone(page, "end-panel:content")).toHaveAttribute(
    "data-refused",
    "true",
  );
  await expect(zone(page, "header:slot")).toHaveAttribute(
    "data-refused",
    "false",
  );
  await over(page, "end-panel:content");
  await expect(
    zone(page, "end-panel:content").locator(
      "[data-slot=workbench-drop-reason]",
    ),
  ).toHaveText("It doesn't fit this slot's surface.");
  await page.mouse.up();
  await expect.poll(() => tabNames(page)).toEqual([]);
  expect(urlQuery(page)).not.toContain("end-panel-contents");

  // The focused occupant's slot that holds one keeps it.
  await ready(page, "?occupant=key-facts&view=template&slot=main&mode=edit");
  await pickUp(page, "Participants");
  await over(page, "main:slot");
  await expect(
    zone(page, "main:slot").locator("[data-slot=workbench-drop-reason]"),
  ).toHaveText("It's the occupant you're looking at, so it stays where it is.");
  await page.mouse.up();
  expect(urlQuery(page)).not.toContain("main-contents");
});

test("the keyboard drags from a row's handle, and is announced", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~participants`);
  const handle = row(page, "Key facts").getByRole("button", {
    name: "Drag Key facts",
  });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.locator("[data-slot=workbench-drop-zones]").waitFor();
  const order = await page
    .locator("[data-slot=workbench-drop-zone]")
    .evaluateAll((zones) =>
      zones.map((z) => (z instanceof HTMLElement ? z.dataset.zone : "")),
    );
  const steps = order.indexOf("end-panel:insert:1") + 1;
  for (let i = 0; i < steps; i++) await page.keyboard.press("ArrowRight");
  await expect(zone(page, "end-panel:insert:1")).toHaveAttribute(
    "data-over",
    "true",
  );
  const live = page.locator("[id^=DndLiveRegion]");
  await expect(live).toContainText(
    "A new tab in the end panel, before Participants.",
  );
  await page.keyboard.press("Space");
  await expect
    .poll(() => tabNames(page))
    .toEqual(["Queue", "Key facts", "Participants"]);
  await expect(live).toContainText(
    "Dropped Key facts: A new tab in the end panel, before Participants.",
  );
});

test("the list marks what's on the page, which doesn't drag", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~participants`);
  for (const occupant of ["Queue", "Participants"]) {
    await expect(row(page, occupant)).toContainText("On the page");
    await expect(
      row(page, occupant).getByRole("button", { name: `Drag ${occupant}` }),
    ).toHaveCount(0);
  }
  await expect(row(page, "Key facts")).not.toContainText("On the page");
  // A plain click still selects an occupant.
  await row(page, "Key facts").getByRole("button").first().click();
  await expect(page.locator("[data-slot=workbench-header] h2")).toHaveText(
    "Key facts",
  );
});

test("there's no dragging in Preview", async ({ page }) => {
  await ready(page, "?occupant=queue&view=template&slot=end-panel");
  await expect(page.locator("[data-slot=workbench-drag-handle]")).toHaveCount(
    0,
  );
  await expect(page.locator("#workbench-list")).not.toContainText(
    "On the page",
  );
  const box = await row(page, "Key facts")
    .getByRole("button")
    .first()
    .boundingBox();
  if (!box) throw new Error("No row");
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 300, box.y + 200, { steps: 8 });
  await expect(page.locator("[data-slot=workbench-drop-zones]")).toHaveCount(0);
  await expect(page.locator("[data-slot=workbench-drag-preview]")).toHaveCount(
    0,
  );
  await page.mouse.up();
});
