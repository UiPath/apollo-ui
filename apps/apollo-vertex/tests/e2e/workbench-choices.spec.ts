import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot, urlQuery } from "./workbench-helpers";

/*
 * Dropping onto a panel slot that has occupants: two large choices fill
 * it, "Add as tab" above and "Stack with" its showing tab below, and the
 * tab bar's precise places win where they overlap. An empty panel slot
 * is one choice, "Add to" it. Each drop says what it did, with Undo.
 */

const EDIT = "?view=template&mode=edit";

const zone = (page: Page, id: string) =>
  page.locator(`[data-slot=workbench-drop-zone][data-zone="${id}"]`);
const toast = (page: Page) => page.locator("[data-sonner-toast]");
const contents = (page: Page, slot: string) =>
  decodeURIComponent(urlQuery(page)).match(
    new RegExp(`${slot}-contents=([^&]+)`),
  )?.[1];

async function ready(page: Page, query: string) {
  await open(page, query);
  await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
  await settle(page);
}

async function pickUp(page: Page, occupant: string) {
  const from = await page
    .locator("#workbench-list li")
    .filter({ hasText: occupant })
    .getByRole("button")
    .first()
    .boundingBox();
  if (!from) throw new Error(`No ${occupant} row`);
  await page.mouse.move(from.x + 40, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 60, from.y + from.height / 2 + 16, {
    steps: 4,
  });
  await page.locator("[data-slot=workbench-drop-zones]").waitFor();
}

/** Over a point in a zone: its middle, or a point in it by fraction. */
async function over(page: Page, id: string, fx = 0.5, fy = 0.5) {
  const box = await zone(page, id).boundingBox();
  if (!box) throw new Error(`No ${id} zone`);
  await page.mouse.move(box.x + box.width * fx, box.y + box.height * fy, {
    steps: 10,
  });
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("over a one-tab panel, two labeled choices fill it; each does what it says", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue`);
  await pickUp(page, "Participants");
  await over(page, "end-panel:as-tab");
  // Shown, labeled, while the drag is over the slot.
  await expect(page.locator("[data-slot=workbench-drop-choice]")).toHaveText([
    "Add as tab",
    "Stack with Queue",
  ]);
  await expect(zone(page, "end-panel:as-tab")).toHaveAttribute(
    "data-over",
    "true",
  );
  await expect(zone(page, "end-panel:stack")).toHaveAttribute(
    "data-over",
    "false",
  );
  await page.mouse.up();
  expect(contents(page, "end-panel")).toBe("queue~participants");
  await expect(toast(page)).toContainText(
    "Participants added as a tab in End panel",
  );
  await toast(page).getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => contents(page, "end-panel")).toBe("queue");

  await pickUp(page, "Participants");
  await over(page, "end-panel:stack");
  await expect(zone(page, "end-panel:stack")).toHaveAttribute(
    "data-over",
    "true",
  );
  await page.mouse.up();
  expect(contents(page, "end-panel")).toBe("overview:queue.participants");
  await expect(toast(page)).toContainText(
    "Participants stacked with Queue in End panel",
  );
  // The inspector says the same.
  await selectSlot(page, "end-panel");
  await expect(
    inspector(page).locator("[data-slot=workbench-contents-card]"),
  ).toHaveText([/Queue/, /Participants/]);
});

test("a tab's label in the bar wins over the choice it sits in", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue~key-facts`);
  await pickUp(page, "Participants");
  // Key facts' label is inside "Add as tab": the label wins.
  await over(page, "end-panel:tab:1");
  await expect(zone(page, "end-panel:tab:1")).toHaveAttribute(
    "data-over",
    "true",
  );
  await expect(zone(page, "end-panel:as-tab")).toHaveAttribute(
    "data-over",
    "false",
  );
  await page.mouse.up();
  expect(contents(page, "end-panel")).toBe(
    "queue~overview:key-facts.participants",
  );
  // And between two tabs, a new tab there.
  await pickUp(page, "Activity timeline");
  await over(page, "end-panel:insert:1");
  await expect(zone(page, "end-panel:insert:1")).toHaveAttribute(
    "data-over",
    "true",
  );
  await page.mouse.up();
  expect(contents(page, "end-panel")).toBe(
    "queue~activity-timeline~overview:key-facts.participants",
  );
});

test("an empty panel slot is one choice: Add to it", async ({ page }) => {
  await ready(page, `${EDIT}&end-panel-contents=queue`);
  await pickUp(page, "Participants");
  await over(page, "start-panel:slot");
  await expect(
    zone(page, "start-panel:slot").locator("[data-slot=workbench-drop-choice]"),
  ).toHaveText("Add to Start panel");
  await expect(zone(page, "start-panel:as-tab")).toHaveCount(0);
  await page.mouse.up();
  expect(contents(page, "start-panel")).toBe("participants");
});

test("both choices refused: each says why, and nothing drops", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue`);
  // Stage strip only fits a page header.
  await pickUp(page, "Stage strip");
  await over(page, "end-panel:stack");
  for (const id of ["end-panel:as-tab", "end-panel:stack"]) {
    await expect(zone(page, id)).toHaveAttribute("data-refused", "true");
    await expect(
      zone(page, id).locator("[data-slot=workbench-drop-reason]"),
    ).toHaveText("It doesn't fit this slot's surface.");
  }
  await page.mouse.up();
  expect(contents(page, "end-panel")).toBe("queue");
});

test("by keyboard, the arrows move between the choices, which are announced", async ({
  page,
}) => {
  await ready(page, `${EDIT}&end-panel-contents=queue`);
  const handle = page
    .locator("#workbench-list li")
    .filter({ hasText: "Participants" })
    .getByRole("button", { name: "Drag Participants" });
  await handle.focus();
  await page.keyboard.press("Space");
  await page.locator("[data-slot=workbench-drop-zones]").waitFor();
  await settle(page);
  const order = await page
    .locator("[data-slot=workbench-drop-zone]")
    .evaluateAll((zones) =>
      zones.map((z) => (z instanceof HTMLElement ? z.dataset.zone : "")),
    );
  const live = page.locator("[id^=DndLiveRegion]");
  for (const id of order.slice(0, order.indexOf("end-panel:stack") + 1)) {
    await page.keyboard.press("ArrowRight");
    await expect(zone(page, id ?? "")).toHaveAttribute("data-over", "true");
    if (id === "end-panel:as-tab")
      await expect(live).toContainText("Add as tab.");
  }
  await expect(live).toContainText("Stack with Queue.");
  // And back up to Add as tab.
  await page.keyboard.press("ArrowLeft");
  await expect(zone(page, "end-panel:as-tab")).toHaveAttribute(
    "data-over",
    "true",
  );
  await page.keyboard.press("Space");
  await expect
    .poll(() => contents(page, "end-panel"))
    .toBe("queue~participants");
  await expect(live).toContainText("Dropped Participants: Add as tab.");
});
