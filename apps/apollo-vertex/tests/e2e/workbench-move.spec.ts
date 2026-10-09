import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot, urlQuery } from "./workbench-helpers";

/*
 * Moving things in the inspector's end panel: a tab by its grip, an
 * occupant by its card's, by pointer, by the keyboard sensor, and by each
 * card's Move up and Move down. The panel rules decide every move, the
 * link follows, the tab showing stays the same tab, and a toast says
 * what moved, with Undo.
 */

const TWO = "?view=template&end-panel-contents=queue~key-facts&mode=edit";
const STACK =
  "?view=template&end-panel-contents=queue~overview:activity-timeline.participants&end-panel-tab=activity-timeline&mode=edit";

const toast = (page: Page) => page.locator("[data-sonner-toast]");
const contents = (page: Page) =>
  decodeURIComponent(urlQuery(page)).match(/end-panel-contents=([^&]+)/)?.[1];
const end = (page: Page) =>
  page.locator("[data-slot=workbench-page] [data-slot=detail-page-end-panel]");
const grip = (page: Page, name: string) =>
  inspector(page).getByRole("button", { name: `Move ${name}`, exact: true });
const card = (page: Page, occupant: string) =>
  inspector(page).locator(
    `[data-slot=workbench-contents-card][data-row="${occupant}"]`,
  );
const dropSlot = (page: Page) =>
  inspector(page).locator("[data-slot=workbench-contents-drop-slot]");

async function ready(page: Page, query: string) {
  await open(page, query);
  await end(page)
    .locator("[data-occupant]")
    .first()
    .waitFor({ state: "attached" });
  await settle(page);
  await selectSlot(page, "end-panel");
}

/** Picks up by a grip, and moves to a place in a target's height (0 its top, 1 its bottom). */
async function pickUp(page: Page, name: string) {
  const from = await grip(page, name).boundingBox();
  if (!from) throw new Error(`No grip for ${name}`);
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + 12, from.y + 10, { steps: 4 });
}
/**
 * Moves to a place on a target, as a person does: there, then again to
 * wherever the target is once a slot opening on the way has moved it.
 */
async function overAt(page: Page, target: string, at: number) {
  for (let pass = 0; pass < 2; pass += 1) {
    const box = await inspector(page).locator(target).first().boundingBox();
    if (!box) throw new Error(`No ${target}`);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * at, {
      steps: 10,
    });
    await settle(page);
  }
}
async function drop(page: Page) {
  await page.mouse.up();
  await settle(page);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
});

test("a tab moves by its grip, says so, and undoes", async ({ page }) => {
  await ready(page, TWO);
  await pickUp(page, "Key facts");
  // Over Queue's top edge: a new place before it.
  await overAt(page, '[data-row="queue"]', 0.05);
  await expect(dropSlot(page)).toHaveCount(1);
  await drop(page);
  expect(contents(page)).toBe("key-facts~queue");
  await expect(toast(page)).toContainText("Key facts tab moved in End panel");
  await toast(page).getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => contents(page)).toBe("queue~key-facts");
});

test("two occupants in a stack swap, and the stack stays the tab showing", async ({
  page,
}) => {
  await ready(page, STACK);
  await pickUp(page, "Activity timeline");
  await overAt(page, '[data-row="participants"]', 0.8);
  await drop(page);
  expect(contents(page)).toBe("queue~overview:participants.activity-timeline");
  // The stack's id follows its first occupant, and it still shows.
  expect(urlQuery(page)).toContain("end-panel-tab=participants");
  await expect(
    end(page).locator("[data-part=tab-bar] [role=tab][aria-selected=true]"),
  ).toHaveText("Overview");
  await expect(toast(page)).toContainText(
    "Activity timeline moved in End panel",
  );
});

test("an occupant moves into another tab, and to a new one", async ({
  page,
}) => {
  await ready(page, STACK);
  // Onto Queue's middle: into its tab, which takes the next label. The
  // stack, back to one, drops its own.
  await pickUp(page, "Participants");
  await overAt(page, '[data-row="queue"]', 0.5);
  await drop(page);
  expect(contents(page)).toBe("details:queue.participants~activity-timeline");
  // Onto the dashed card: a new tab at the end.
  await pickUp(page, "Queue");
  await overAt(page, "[data-slot=workbench-contents-new-tab]", 0.5);
  await expect(
    inspector(page).locator("[data-slot=workbench-contents-new-tab]"),
  ).toHaveAttribute("data-over", "true");
  await drop(page);
  expect(contents(page)).toBe("participants~activity-timeline~queue");
});

test("mid-drag the card lifts, and a slot its size opens where it lands", async ({
  page,
}) => {
  await ready(page, TWO);
  const height = (await card(page, "key-facts").boundingBox())?.height ?? 0;
  const queue = (await card(page, "queue").boundingBox())?.height;
  await pickUp(page, "Key facts");
  await overAt(page, '[data-row="queue"]', 0.05);
  const preview = page.locator("[data-slot=workbench-move-preview]");
  await expect(preview).toBeVisible();
  const look = await preview.evaluate((el) => getComputedStyle(el).boxShadow);
  expect(look).not.toBe("none");
  // The slot is the dragged card's size; the other cards keep theirs.
  expect(Math.round((await dropSlot(page).boundingBox())?.height ?? 0)).toBe(
    Math.round(height),
  );
  expect((await card(page, "queue").boundingBox())?.height).toBe(queue);
  // Where it came from, it stays, faded.
  await expect(card(page, "key-facts")).toHaveAttribute(
    "data-dragging",
    "true",
  );
  // Reduced motion, as the suite runs: no tilt.
  expect(await preview.evaluate((el) => getComputedStyle(el).rotate)).toBe(
    "none",
  );
  await page.keyboard.press("Escape");
  await drop(page);
  expect(contents(page)).toBe("queue~key-facts");
});

test("each card's menu moves it up and down, by keyboard", async ({ page }) => {
  await ready(page, STACK);
  const menu = (name: string) =>
    inspector(page).getByRole("button", {
      name: `${name} options`,
      exact: true,
    });
  // A stack's occupant, within its stack.
  await menu("Participants").focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("menuitem", { name: "Move down" }),
  ).toBeDisabled();
  await page.getByRole("menuitem", { name: "Move up" }).click();
  await expect
    .poll(() => contents(page))
    .toBe("queue~overview:participants.activity-timeline");
  // A tab, along the tabs.
  await menu("Queue").click();
  await expect(page.getByRole("menuitem", { name: "Move up" })).toBeDisabled();
  await page.getByRole("menuitem", { name: "Move down" }).click();
  await expect
    .poll(() => contents(page))
    .toBe("overview:participants.activity-timeline~queue");
});

test("the keyboard sensor drags: Space, the arrows, and Space", async ({
  page,
}) => {
  await ready(page, TWO);
  await grip(page, "Key facts").focus();
  await page.keyboard.press("Space");
  await settle(page);
  // The first place: a new tab before Queue.
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("[data-slot=workbench-move-said]")).toHaveText(
    "A new tab, before Queue.",
  );
  await expect(dropSlot(page)).toHaveCount(1);
  await page.keyboard.press("Space");
  await expect.poll(() => contents(page)).toBe("key-facts~queue");
  await expect(page.locator("[data-slot=workbench-move-said]")).toHaveText(
    "Dropped Key facts: A new tab, before Queue.",
  );
});
