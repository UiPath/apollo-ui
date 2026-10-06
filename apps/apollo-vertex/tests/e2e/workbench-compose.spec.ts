import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open, urlQuery } from "./workbench-helpers";

/*
 * The template view's composer, in each slot's popover: adding an
 * occupant to a slot as a new tab or into a tab, taking one out, the
 * focused occupant's lock, and the link. Queue is focused in the Detail
 * page's end panel throughout.
 */

const SLOT = "?occupant=queue&view=template&slot=end-panel";
const BASE = `${SLOT}&zoom=100`;

const menu = (page: Page) => page.locator("[data-slot=workbench-slot-popover]");
const section = (page: Page, slot: string) =>
  menu(page).locator(`[data-contents-slot=${slot}]`);
const end = (page: Page) =>
  page.locator("[data-slot=workbench-page] [data-slot=detail-page-end-panel]");
/** The panel's own tab bar; an occupant can have tabs of its own. */
const bar = (page: Page) => end(page).locator("[data-part=tab-bar]");
const tabNames = (page: Page) =>
  bar(page).locator("[role=tab]:not([hidden])").allTextContents();
const tab = (page: Page, name: string) =>
  bar(page).getByRole("tab", { name, exact: true });
const selected = (page: Page) =>
  bar(page).locator("[role=tab][aria-selected=true]");
const shown = (page: Page) =>
  end(page).locator("[data-occupant]").filter({ visible: true }).first();

/** Opens a slot's popover from its dock chip. */
async function openMenu(page: Page, slot = "end-panel") {
  await page
    .locator(`[data-slot=workbench-slot-chip][data-chip-slot=${slot}]`)
    .click();
  await section(page, slot).waitFor();
}

async function ready(page: Page, query: string) {
  await open(page, query);
  await shown(page).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
}

/** Picks an occupant in a slot's Add list. */
const pick = (page: Page, slot: string, occupant: string) =>
  section(page, slot)
    .getByRole("group", { name: /^Add an occupant to / })
    .getByRole("button", { name: occupant, exact: true });

const where = (page: Page, occupant: string) =>
  menu(page).getByRole("group", { name: `Where ${occupant} goes` });

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("adds an occupant as a new tab", async ({ page }) => {
  await ready(page, BASE);
  await expect(bar(page)).toHaveCount(0);
  await openMenu(page);
  await pick(page, "end-panel", "Key facts").click();
  await where(page, "Key facts")
    .getByRole("button", { name: "New tab" })
    .click();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Key facts"]);
  expect(urlQuery(page)).toContain("end-panel-contents=queue~key-facts");
  await expect(
    page.locator("[data-slot=workbench-map] [data-region=end-panel]"),
  ).toHaveAttribute("data-count", "2");
});

test("stacks an occupant into a tab, with a label", async ({ page }) => {
  await ready(page, `${BASE}&end-panel-contents=queue~key-facts`);
  await openMenu(page);
  await pick(page, "end-panel", "Participants").click();
  await where(page, "Participants")
    .getByRole("button", { name: "Add to tab Key facts" })
    .click();
  // A tab that becomes a stack needs a label.
  await menu(page).getByRole("radio", { name: "Overview" }).click();
  await menu(page).getByRole("button", { name: "Add", exact: true }).click();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  expect(urlQuery(page)).toContain(
    "end-panel-contents=queue~overview:key-facts.participants",
  );
  await tab(page, "Overview").click();
  const body = end(page).locator('[data-tab="key-facts"]');
  await expect(body.locator("[data-occupant=key-facts]")).toBeVisible();
  await expect(body.locator("[data-occupant=participants]")).toBeVisible();
});

test("removes occupants, and a tab they empty goes", async ({ page }) => {
  await ready(
    page,
    `${BASE}&end-panel-contents=queue~overview:key-facts.participants~activity-timeline`,
  );
  await expect
    .poll(() => tabNames(page))
    .toEqual(["Queue", "Overview", "Activity timeline"]);
  await openMenu(page);
  const remove = (name: string) =>
    section(page, "end-panel")
      .getByRole("button", { name: `Remove ${name}` })
      .click();

  await remove("Activity timeline");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  // Back to one occupant, the tab takes that occupant's title again.
  await remove("Participants");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Key facts"]);
  await remove("Key facts");
  await expect(bar(page)).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("end-panel-contents");
});

test("the focused occupant stays, and says why", async ({ page }) => {
  await ready(page, `${BASE}&end-panel-contents=queue~key-facts`);
  await openMenu(page);
  const reason =
    "It's the occupant you're looking at, so it stays where it is.";
  const remove = section(page, "end-panel").getByRole("button", {
    name: "Remove Queue",
  });
  await expect(remove).toBeDisabled();
  await expect(remove).toHaveAccessibleDescription(reason);
  // Not offered in another slot either.
  await openMenu(page, "start-panel");
  const elsewhere = pick(page, "start-panel", "Queue");
  await expect(elsewhere).toBeDisabled();
  await expect(elsewhere).toHaveAccessibleDescription(reason);
  // Another occupant can go.
  await openMenu(page);
  await expect(
    section(page, "end-panel").getByRole("button", {
      name: "Remove Key facts",
    }),
  ).toBeEnabled();
});

test("a link opens the same contents and tab", async ({ page }) => {
  // In the order the workbench writes its params.
  const query = `${SLOT}&start-panel-contents=participants&end-panel-contents=queue~overview:key-facts.activity-timeline&end-panel-tab=key-facts&zoom=100`;
  await ready(page, query);
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  await expect(selected(page)).toHaveText("Overview");
  await expect(
    page.locator(
      "[data-slot=workbench-page] [data-slot=detail-page-start-panel] [data-occupant=participants]",
    ),
  ).toBeVisible();
  expect(urlQuery(page)).toBe(query);

  // Choosing another tab goes in the link; the one it opens on doesn't.
  await tab(page, "Queue").click();
  await expect.poll(() => urlQuery(page)).not.toContain("end-panel-tab");
  await tab(page, "Overview").click();
  await expect.poll(() => urlQuery(page)).toContain("end-panel-tab=key-facts");
  await page.reload();
  await shown(page).waitFor();
  await expect(selected(page)).toHaveText("Overview");
});

const FOUR_TABS = `${BASE}&end-panel-contents=queue~key-facts~participants~activity-timeline`;
const FOUR_NAMES = ["Queue", "Key facts", "Participants", "Activity timeline"];
const more = (page: Page) =>
  end(page).getByRole("button", { name: "More tabs" });

test("the panel's width stays the same across tab switches", async ({
  page,
}) => {
  await ready(page, FOUR_TABS);
  const panelWidth = () =>
    end(page)
      .locator("[data-surface=side-panel]")
      .evaluate((el) => el.getBoundingClientRect().width);
  const first = await panelWidth();
  // At its default width, a tab that doesn't fit is in More.
  for (const name of FOUR_NAMES) {
    if (await tab(page, name).isVisible()) await tab(page, name).click();
    else {
      await more(page).click();
      await page.getByRole("menuitem", { name }).click();
    }
    await expect(selected(page)).toHaveText(name);
    await settle(page);
    expect(await panelWidth(), name).toBe(first);
  }
});

test("at the end panel's minimum width, tabs past the room go into More", async ({
  page,
}) => {
  await ready(page, FOUR_TABS);
  const handle = page.locator(
    "[data-slot=workbench-page] [role=separator][aria-label='Resize end panel']",
  );
  await handle.focus();
  await page.keyboard.press("Home");
  const min = Number(await handle.getAttribute("aria-valuemin"));
  await expect(handle).toHaveAttribute("aria-valuenow", String(min));
  await settle(page);
  await settle(page);

  const visible = await tabNames(page);
  expect(visible.length).toBeGreaterThan(0);
  expect(visible.length).toBeLessThan(FOUR_NAMES.length);
  expect(visible).toEqual(FOUR_NAMES.slice(0, visible.length));
  await expect(more(page)).toBeVisible();
  await more(page).click();
  await expect(page.getByRole("menuitem")).toHaveText(
    FOUR_NAMES.slice(visible.length),
  );
  await page.keyboard.press("Escape");
});
