import type { Page } from "@playwright/test";
import { PANEL_MAX_TABS } from "@/lib/panel";
import {
  expect,
  occupantWidth,
  openCard,
  openPreview,
  settle,
  test,
} from "./fixtures";

/*
 * Tabs and stacks in a side panel, through the Detail page preview's fixed
 * arrangements (preview-panels.ts), opened from a link with
 * end-panel-arrangement, or picked in the Configure card.
 */

const end = (page: Page) => page.locator("[data-slot=detail-page-end-panel]");
const tablist = (page: Page) => end(page).getByRole("tablist");
const shownTabs = (page: Page) =>
  end(page).locator("[role=tab]:not([hidden])").allTextContents();
const selectedTab = (page: Page) =>
  end(page).locator("[role=tab][aria-selected=true]");
const more = (page: Page) =>
  end(page).getByRole("button", { name: "More tabs" });
const tabBody = (page: Page, id: string) =>
  end(page).locator(`[data-tab="${id}"]`);

/**
 * Opens a composed panel and waits for its tab bar to settle: fonts change
 * the tabs' widths, so how many fit.
 */
async function openPanel(page: Page, query: string, width?: number) {
  await openPreview(page, query, width);
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  await settle(page);
}

// End panel, Details, and the fill stand-in, Document.
const THREE_TABS = "?end-panel-arrangement=tabs";
// One tab: the end panel's own placeholder stacked with Details.
const STACK = "?end-panel-arrangement=stack";
// End panel, Details, Activity, People, Notes.
const FIVE_TABS = "?end-panel-arrangement=overflow";

test("one tab shows no tab bar; several tabs show one", async ({ page }) => {
  await openPreview(page);
  await expect(tablist(page)).toHaveCount(0);
  await expect(end(page).locator("[data-occupant]")).toHaveCount(1);

  // A stack is one tab, so it has no tab bar either.
  await openPreview(page, STACK);
  await expect(tablist(page)).toHaveCount(0);
  await expect(end(page).locator("[data-occupant]")).toHaveCount(2);

  await openPreview(page, THREE_TABS);
  await expect(tablist(page)).toBeVisible();
  expect(await shownTabs(page)).toEqual(["End panel", "Details", "Document"]);
  // Each tab is a panel of its own, and only the active one shows.
  await expect(end(page).locator("[data-tab]")).toHaveCount(3);
  await expect(end(page).locator("[data-tab]:visible")).toHaveCount(1);
});

test("a stack has a heading per occupant; a single occupant has none", async ({
  page,
}) => {
  await openPreview(page, STACK);
  const headings = tabBody(page, "base").getByRole("heading", { level: 2 });
  await expect(headings).toHaveText(["End panel", "Details"]);
  // Each heading names its occupant's section.
  await expect(
    tabBody(page, "base").getByRole("region", { name: "Details" }),
  ).toBeVisible();

  await openPreview(page, THREE_TABS);
  await expect(tabBody(page, "base").getByRole("heading")).toHaveCount(0);
});

test("a fill occupant is alone in its tab and scrolls itself", async ({
  page,
}) => {
  await openPreview(page, THREE_TABS);
  await end(page).getByRole("tab", { name: "Document" }).click();
  const body = tabBody(page, "document");
  await expect(body).toBeVisible();
  await expect(body.locator("[data-occupant]")).toHaveCount(1);
  await expect(body.getByRole("heading")).toHaveCount(0);
  // The tab hands scrolling to it, and it takes the tab's whole height.
  await expect(body).toHaveAttribute("data-scroll", "occupant");
  const [tabHeight, occupantHeight] = await body.evaluate((el) => [
    el.getBoundingClientRect().height,
    el.querySelector("[data-occupant]")?.getBoundingClientRect().height ?? 0,
  ]);
  expect(occupantHeight).toBe(tabHeight);
});

test("the panel's width stays the same across tab switches", async ({
  page,
}) => {
  await openPanel(page, FIVE_TABS, 1600);
  const panelWidth = () =>
    end(page)
      .locator("[data-surface=side-panel]")
      .evaluate((el) => el.getBoundingClientRect().width);
  const first = await panelWidth();
  const occupant = await occupantWidth(page, "end");
  for (const name of await shownTabs(page)) {
    await end(page).getByRole("tab", { name, exact: true }).click();
    await settle(page);
    expect(await panelWidth(), name).toBe(first);
    expect(await occupantWidth(page, "end"), name).toBe(occupant);
  }
});

test("each tab keeps its scroll position", async ({ page }) => {
  await openPreview(page, `${THREE_TABS}&end-panel-content=long`);
  const body = tabBody(page, "base");
  await body.evaluate((el) => {
    el.scrollTop = 240;
  });
  await end(page).getByRole("tab", { name: "Details" }).click();
  await expect(tabBody(page, "details")).toBeVisible();
  expect(await tabBody(page, "details").evaluate((el) => el.scrollTop)).toBe(0);
  await end(page).getByRole("tab", { name: "End panel" }).click();
  await expect(body).toBeVisible();
  expect(await body.evaluate((el) => el.scrollTop)).toBe(240);
});

test("a link opens on its tab; an unknown tab opens the first", async ({
  page,
}) => {
  await openPreview(page, `${THREE_TABS}&end-panel-tab=document`);
  await expect(selectedTab(page)).toHaveText("Document");
  await expect(tabBody(page, "document")).toBeVisible();

  await openPreview(page, `${THREE_TABS}&end-panel-tab=nope`);
  await expect(selectedTab(page)).toHaveText("End panel");
  await expect(tabBody(page, "base")).toBeVisible();

  // Switching writes the tab to the URL.
  await end(page).getByRole("tab", { name: "Details" }).click();
  await expect(page).toHaveURL(/end-panel-tab=details/);
});

test("the Configure card switches a panel's arrangement, and links it", async ({
  page,
}) => {
  await openPreview(page);
  await openCard(page);
  const arrangement = page.getByRole("group", {
    name: "End panel arrangement",
  });
  await expect(arrangement.getByRole("radio")).toHaveText([
    "Single",
    "Stack",
    "Tabs",
    "Overflow",
  ]);
  await arrangement.getByRole("radio", { name: "Tabs" }).click();
  await expect(page).toHaveURL(/end-panel-arrangement=tabs/);
  await expect(tablist(page)).toBeVisible();
  await arrangement.getByRole("radio", { name: "Single" }).click();
  await expect(tablist(page)).toHaveCount(0);
  await expect(page).not.toHaveURL(/end-panel-arrangement/);

  // An unknown arrangement in a link is single.
  await openPreview(page, "?end-panel-arrangement=nope");
  await expect(tablist(page)).toHaveCount(0);
  await expect(end(page).locator("[data-occupant]")).toHaveCount(1);
});

test(`at a narrow width, tabs past the room go into More`, async ({ page }) => {
  // The end panel at its minimum width, with all five tabs.
  await openPanel(page, `${FIVE_TABS}&end-width=280`, 1440);
  const shown = await shownTabs(page);
  expect(shown.length).toBeGreaterThan(0);
  expect(shown.length).toBeLessThan(PANEL_MAX_TABS);
  await expect(more(page)).toBeVisible();
  // The tabs still showing are the first ones, in order.
  const all = ["End panel", "Details", "Activity", "People", "Notes"];
  expect(shown).toEqual(all.slice(0, shown.length));

  // Picking a hidden tab swaps it in for the last visible one.
  await more(page).click();
  const hidden = all.slice(shown.length);
  await expect(page.getByRole("menuitem")).toHaveText(hidden);
  const picked = hidden.at(-1) ?? "";
  await page.getByRole("menuitem", { name: picked }).click();
  await expect(selectedTab(page)).toHaveText(picked);
  const after = await shownTabs(page);
  expect(after).toHaveLength(shown.length);
  expect(after.at(-1)).toBe(picked);
  expect(after.slice(0, -1)).toEqual(shown.slice(0, -1));
  // The tab it replaced is in the menu now.
  await more(page).click();
  await expect(
    page.getByRole("menuitem", { name: shown.at(-1) ?? "" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});

test("the active tab is never the one hidden", async ({ page }) => {
  await openPanel(page, `${FIVE_TABS}&end-panel-tab=notes&end-width=280`);
  await expect(selectedTab(page)).toHaveText("Notes");
  await expect(selectedTab(page)).toBeVisible();
  await expect(more(page)).toBeVisible();
});

test("the keyboard moves through the tabs and the More menu", async ({
  page,
}) => {
  await openPanel(page, `${FIVE_TABS}&end-width=280`);
  const shown = await shownTabs(page);
  await end(page).getByRole("tab", { name: "End panel" }).focus();
  // One tab stop; arrows move and select, Home and End jump.
  await page.keyboard.press("ArrowRight");
  await expect(selectedTab(page)).toHaveText("Details");
  await expect(selectedTab(page)).toBeFocused();
  await page.keyboard.press("End");
  await expect(selectedTab(page)).toHaveText(shown.at(-1) ?? "");
  await page.keyboard.press("Home");
  await expect(selectedTab(page)).toHaveText("End panel");
  // Tab leaves the tablist for the More button, a menu button.
  await page.keyboard.press("Tab");
  await expect(more(page)).toBeFocused();
  await expect(more(page)).toHaveAttribute("aria-haspopup", "menu");
  await page.keyboard.press("Enter");
  // Opened from the keyboard, the menu focuses its first item.
  const items = page.getByRole("menuitem");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items.nth(1)).toBeFocused();
  const name = (await items.nth(1).textContent()) ?? "";
  await page.keyboard.press("Enter");
  // Choosing a tab selects it and puts focus on it.
  await expect(selectedTab(page)).toHaveText(name);
  await expect(selectedTab(page)).toBeFocused();
});
