import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot, urlQuery } from "./workbench-helpers";

/*
 * Dragging an occupant from the list onto the template view, in Edit
 * mode: a new tab at a position, stacking onto a tab or the showing tab's
 * content, replacing a single slot's occupant, refused places with why,
 * the keyboard, and the link. Queue starts in the end panel.
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

/**
 * Moves a keyboard drag place by place to a zone, waiting for each place
 * to be the one under the drag before the next press.
 */
async function keyTo(page: Page, id: string) {
  const order = await page
    .locator("[data-slot=workbench-drop-zone]")
    .evaluateAll((zones) =>
      zones.map((z) => (z instanceof HTMLElement ? z.dataset.zone : "")),
    );
  const steps = order.indexOf(id) + 1;
  expect(steps).toBeGreaterThan(0);
  // dnd-kit starts listening for keys a moment after the drag starts.
  await settle(page);
  for (const place of order.slice(0, steps)) {
    await page.keyboard.press("ArrowRight");
    await expect(zone(page, place ?? "")).toHaveAttribute("data-over", "true");
  }
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

/** Whether two boxes overlap. */
const overlaps = (
  a: { x: number; y: number; width: number; height: number } | null,
  b: { x: number; y: number; width: number; height: number } | null,
) =>
  !!a &&
  !!b &&
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

test("the drag preview stays clear of the insertion line and the highlighted tab", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~participants`);
  const preview = page.locator("[data-slot=workbench-drag-preview]");
  const line = page.locator("[data-slot=workbench-insert-line]");
  await pickUp(page, "Key facts");
  await over(page, "end-panel:insert:1");
  await expect(line).toBeVisible();
  expect(overlaps(await line.boundingBox(), await preview.boundingBox())).toBe(
    false,
  );
  await over(page, "end-panel:tab:1");
  expect(
    overlaps(
      await zone(page, "end-panel:tab:1").boundingBox(),
      await preview.boundingBox(),
    ),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await page.mouse.up();

  // By keyboard too.
  await row(page, "Key facts")
    .getByRole("button", { name: "Drag Key facts" })
    .focus();
  await page.keyboard.press("Space");
  await page.locator("[data-slot=workbench-drop-zones]").waitFor();
  await keyTo(page, "end-panel:insert:1");
  await expect(line).toBeVisible();
  expect(overlaps(await line.boundingBox(), await preview.boundingBox())).toBe(
    false,
  );
  await page.keyboard.press("Escape");
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
  expect(urlQuery(page)).not.toContain("stage-strip");
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
  // The arrow keys move place by place.
  await keyTo(page, "end-panel:insert:1");
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

const location = (page: Page, occupant: string) =>
  row(page, occupant).locator("[data-slot=workbench-location]");

test("the list says where each placed occupant is, and those don't drag", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~participants`);
  for (const occupant of ["Queue", "Participants"]) {
    await expect(location(page, occupant)).toHaveText("In End panel");
    await expect(
      row(page, occupant).getByRole("button", { name: `Drag ${occupant}` }),
    ).toHaveCount(0);
  }
  await expect(location(page, "Key facts")).toHaveCount(0);
  // A plain click still selects an occupant: no drag starts.
  const keyFacts = row(page, "Key facts").getByRole("button").first();
  await keyFacts.click();
  await expect(keyFacts).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-slot=workbench-drop-zones]")).toHaveCount(0);
});

test("an occupant in a hidden slot is still placed: muted, never offered, and selectable", async ({
  page,
}) => {
  await ready(
    page,
    "?view=template&start-panel-contents=participants~activity-timeline&start-panel-present=false&end-panel-contents=queue&end-panel-state=closed&main-contents=key-facts&mode=edit",
  );
  await expect(location(page, "Participants")).toHaveText(
    "In Start panel · left out",
  );
  await expect(location(page, "Queue")).toHaveText("In End panel · closed");
  await expect(location(page, "Key facts")).toHaveText("In Main");
  // Hidden: muted, unlike a slot that shows.
  const color = (occupant: string) =>
    location(page, occupant).evaluate((el) => getComputedStyle(el).color);
  expect(await color("Participants")).not.toBe(await color("Key facts"));
  expect(await color("Queue")).toBe(await color("Participants"));
  await expect(
    row(page, "Participants").getByRole("button", {
      name: "Drag Participants",
    }),
  ).toHaveCount(0);
  // The ghost and the strip say how many they keep.
  await expect(
    page.locator("[data-ghost-slot=start-panel]"),
  ).toHaveAccessibleName("Start panel, left out · 2 occupants");
  await expect(
    page.locator("[data-slot=workbench-closed-slot][data-edit-slot=end-panel]"),
  ).toHaveAccessibleName("End panel, closed · 1 occupant");
  // Never offered again, hidden or not.
  await selectSlot(page, "main");
  await inspector(page).getByRole("button", { name: "Replace" }).click();
  // Every one that fits main is placed: Key facts here, three hidden.
  await expect(
    inspector(page).locator("[data-slot=workbench-picker] button"),
  ).toHaveCount(0);
  await expect(
    inspector(page).locator("[data-slot=workbench-picker-left-out]").first(),
  ).toHaveText("4 are on the page already");
  // A click in the list selects its slot's ghost, or its strip.
  await row(page, "Participants").getByRole("button").first().click();
  await expect(page.locator("[data-ghost-slot=start-panel]")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(inspector(page)).toHaveAttribute(
    "data-inspector-slot",
    "start-panel",
  );
  await row(page, "Queue").getByRole("button").first().click();
  await expect(
    page.locator("[data-slot=workbench-closed-slot][data-edit-slot=end-panel]"),
  ).toHaveAttribute("aria-pressed", "true");
});

test("there's no dragging in Preview", async ({ page }) => {
  await ready(page, "?occupant=queue&view=template&slot=end-panel");
  await expect(page.locator("[data-slot=workbench-drag-handle]")).toHaveCount(
    0,
  );
  // Where each is still shows: it's the template view's.
  await expect(location(page, "Queue")).toHaveText("In End panel");
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
