import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import {
  inspector,
  open,
  selectSlot,
  setMode,
  urlQuery,
} from "./workbench-helpers";

/*
 * The template view's composer, in the inspector for the slot selected
 * in Edit mode: adding an occupant as a new tab or into a tab, a stack's
 * label, taking one out, replacing or clearing a slot that holds one,
 * no locks with no focused occupant, each occupant once on the page, and
 * the link. Queue starts in the Detail page's end panel throughout.
 */

const SLOT = "?occupant=queue&view=template&slot=end-panel";
const BASE = `${SLOT}&zoom=100`;

const menu = inspector;
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

/** Shows a slot in the inspector, selecting it on the stage. */
const openMenu = (page: Page, slot = "end-panel") => selectSlot(page, slot);

async function ready(page: Page, query: string) {
  await open(page, query);
  await shown(page).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
}

/** The tab rows in a panel slot's inspector, by number. */
const tabRow = (page: Page, number: number) =>
  menu(page)
    .locator("[data-slot=workbench-contents-tab]")
    .nth(number - 1);

/** Picks an occupant in the picker that's open. */
const pick = (page: Page, occupant: string) =>
  menu(page)
    .locator("[data-slot=workbench-picker]")
    .getByRole("button", { name: occupant, exact: true });

/** The occupant focus is on: its row in the inspector. */
const focusedRow = (page: Page) =>
  page.evaluate(
    () => (document.activeElement as HTMLElement | null)?.dataset.row ?? null,
  );

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("adds an occupant as a new tab, in one click", async ({ page }) => {
  await ready(page, BASE);
  await expect(bar(page)).toHaveCount(0);
  await openMenu(page);
  const newTab = menu(page).getByRole("button", { name: "New tab" });
  await newTab.click();
  await expect(newTab).toHaveAttribute("aria-expanded", "true");
  // Only what fits a side panel and isn't on the page; the rest is counted.
  await expect(
    menu(page).locator("[data-slot=workbench-picker] button"),
  ).toHaveText(["Activity timeline", "Key facts", "Participants"]);
  await expect(
    menu(page).locator("[data-slot=workbench-picker-left-out]"),
  ).toHaveText(["1 is on the page already", "1 doesn't fit a side panel"]);
  await pick(page, "Key facts").click();
  // The picker closes, and focus is on the new row.
  await expect(menu(page).locator("[data-slot=workbench-picker]")).toHaveCount(
    0,
  );
  expect(await focusedRow(page)).toBe("key-facts");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Key facts"]);
  // The new tab is the one showing.
  await expect(selected(page)).toHaveText("Key facts");
  expect(urlQuery(page)).toContain("end-panel-contents=queue~key-facts");
  expect(urlQuery(page)).toContain("end-panel-tab=key-facts");
  // The inspector lists both tabs.
  await expect(
    menu(page).locator("[data-slot=workbench-contents-tab]"),
  ).toHaveCount(2);
});

test("stacks an occupant into a tab, which takes a label", async ({ page }) => {
  await ready(page, `${BASE}&end-panel-contents=queue~key-facts`);
  await openMenu(page);
  // A tab of one occupant shows no label: it's one row, its name, ×, and +.
  await expect(
    menu(page).locator("[data-slot=workbench-contents-label]"),
  ).toHaveCount(0);
  const plus = tabRow(page, 2).getByRole("button", { name: "Add to this tab" });
  await expect(tabRow(page, 2).locator("[data-row]")).toHaveCount(1);
  await plus.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Add to this tab");
  await plus.click();
  // The picker opens under that row.
  await expect(
    tabRow(page, 2).locator("[data-slot=workbench-picker]"),
  ).toBeVisible();
  await pick(page, "Participants").click();
  expect(await focusedRow(page)).toBe("participants");
  // Becoming a stack, it takes the first preset no tab has.
  const chip = tabRow(page, 2).locator("[data-slot=workbench-contents-label]");
  await expect(chip).toHaveText("Overview");
  // Its occupants are rows under the label, each with ×.
  await expect(tabRow(page, 2).locator("[data-row]")).toHaveText([
    "Key facts",
    "Participants",
  ]);
  await expect(
    tabRow(page, 2).getByRole("button", { name: /^Remove / }),
  ).toHaveCount(2);
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  // The tab it went in is the one showing.
  await expect(selected(page)).toHaveText("Overview");
  expect(urlQuery(page)).toContain(
    "end-panel-contents=queue~overview:key-facts.participants",
  );
  // The page is inert in Edit mode: its tabs are clicked in Preview.
  await setMode(page, "Preview");
  await tab(page, "Overview").click();
  const body = end(page).locator('[data-tab="key-facts"]');
  await expect(body.locator("[data-occupant=key-facts]")).toBeVisible();
  await expect(body.locator("[data-occupant=participants]")).toBeVisible();

  // The chip picks another preset.
  await openMenu(page);
  await chip.click();
  await expect(chip).toHaveAttribute("aria-expanded", "true");
  await menu(page)
    .getByRole("group", { name: "Labels for tab 2" })
    .getByRole("radio", { name: "People" })
    .click();
  await expect(chip).toHaveText("People");
  await expect(chip).toBeFocused();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "People"]);
  expect(urlQuery(page)).toContain("people:key-facts.participants");
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
  // Each tab is named as the page names it; a stack by its label chip.
  await expect(
    menu(page).locator("[data-slot=workbench-contents-tab-name]"),
  ).toHaveText(["Queue", "Overview", "Activity timeline"]);
  await expect(
    tabRow(page, 2).locator("[data-slot=workbench-contents-label]"),
  ).toHaveText("Overview");
  const remove = (name: string) =>
    menu(page)
      .getByRole("button", { name: `Remove ${name}` })
      .click();

  await remove("Activity timeline");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  // Back to one occupant, the tab takes that occupant's title again.
  await remove("Participants");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Key facts"]);
  await expect(
    menu(page).locator("[data-slot=workbench-contents-tab-name]"),
  ).toHaveText(["Queue", "Key facts"]);
  await expect(
    menu(page).locator("[data-slot=workbench-contents-label]"),
  ).toHaveCount(0);
  await remove("Key facts");
  await expect(bar(page)).toHaveCount(0);
  expect(urlQuery(page)).toContain("end-panel-contents=queue");
  expect(urlQuery(page)).not.toContain("key-facts");
  // No occupant is focused: the last one goes too, and the slot is empty.
  await remove("Queue");
  await expect.poll(() => urlQuery(page)).not.toContain("end-panel-contents");
});

test("any occupant can be taken out, and none is offered twice", async ({
  page,
}) => {
  await ready(page, `${BASE}&end-panel-contents=queue~key-facts`);
  await openMenu(page);
  // No lock: the template view has no focused occupant.
  await expect(menu(page).getByRole("img", { name: "Locked" })).toHaveCount(0);
  await expect(
    menu(page).getByRole("button", { name: "Remove Queue" }),
  ).toBeEnabled();
  // Neither is offered in another slot: each is on the page once.
  await openMenu(page, "start-panel");
  await menu(page).getByRole("button", { name: "New tab" }).click();
  const offered = menu(page).locator("[data-slot=workbench-picker] button");
  await expect(offered).toHaveText(["Activity timeline", "Participants"]);
  await expect(
    menu(page).locator("[data-slot=workbench-picker-left-out]").first(),
  ).toHaveText("2 are on the page already");
});

test("a slot that holds one: Replace and Clear, and the picker when empty", async ({
  page,
}) => {
  await ready(page, `${BASE}&main-contents=key-facts`);
  const main = page.locator(
    "[data-slot=workbench-page] [data-slot=detail-page-main]",
  );
  await expect(main.locator("[data-occupant=key-facts]")).toBeVisible();
  await openMenu(page, "main");
  // No tabs and no stacks: one occupant, replaced or cleared.
  await expect(menu(page).getByRole("button", { name: "New tab" })).toHaveCount(
    0,
  );
  await menu(page).getByRole("button", { name: "Replace" }).click();
  await pick(page, "Participants").click();
  await expect(main.locator("[data-occupant=participants]")).toBeVisible();
  expect(urlQuery(page)).toContain("main-contents=participants");
  expect(await focusedRow(page)).toBe("participants");

  await menu(page).getByRole("button", { name: "Clear" }).click();
  // Empty, it opens the picker straight away, and focus goes into it.
  await expect(menu(page)).toContainText("Nothing here yet.");
  await expect(
    menu(page).locator("[data-slot=workbench-picker] button").first(),
  ).toBeFocused();
  expect(urlQuery(page)).not.toContain("main-contents");
  await pick(page, "Key facts").click();
  await expect(main.locator("[data-occupant=key-facts]")).toBeVisible();
});

test("a tall inspector scrolls itself, down to the layout", async ({
  page,
}) => {
  // Short enough that the inspector is taller than the window.
  await page.setViewportSize({ width: 1920, height: 560 });
  await ready(
    page,
    `${SLOT}&end-panel-contents=queue~overview:key-facts.participants~activity-timeline`,
  );
  await openMenu(page);
  // It's the window's height, beside the stage, never over the dock.
  const [box, dock] = await Promise.all([
    menu(page).boundingBox(),
    page.locator("[data-slot=workbench-dock]").boundingBox(),
  ]);
  expect(box?.height).toBe(560);
  expect(box?.x ?? 0).toBeGreaterThanOrEqual(
    (dock?.x ?? 0) + (dock?.width ?? 0),
  );
  expect(
    await menu(page).evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  const placement = menu(page)
    .getByRole("group", { name: "End panel placement" })
    .getByRole("radio", { name: "Beside header" });
  await placement.click();
  await expect(placement).toHaveAttribute("aria-checked", "true");
  expect(urlQuery(page)).toContain("end-panel-placement=beside-header");
});

test("a link opens the same contents and tab", async ({ page }) => {
  // In the order the workbench writes its params.
  const query = `?view=template&start-panel-contents=participants&end-panel-contents=queue~overview:key-facts.activity-timeline&end-panel-tab=key-facts&zoom=100`;
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
  // Choosing a hidden tab from More once looped the tab bar's fit.
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page, FOUR_TABS);
  // The underlined tablist keeps its gap between tabs, and the fit counts it.
  const gap = await bar(page)
    .getByRole("tablist")
    .evaluate((list) => Number.parseFloat(getComputedStyle(list).columnGap));
  expect(gap).toBeGreaterThan(0);
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
  expect(errors).toEqual([]);
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
