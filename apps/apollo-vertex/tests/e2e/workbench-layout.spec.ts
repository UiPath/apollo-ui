import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  inspector,
  open,
  selectSlot,
  slotStates,
  urlQuery,
} from "./workbench-helpers";

/*
 * The template view's layout: the Shell menu, and in the inspector for
 * the slot selected, whether the template has the slot, its open state
 * and placement, no locks with no focused occupant, the template's own
 * width rule, and the URL.
 */

const shellMenu = (page: Page) =>
  page.locator("[data-slot=workbench-shell-menu]");

/** Shows a slot in the inspector, unless it's showing already. */
const openSlot = (page: Page, slot: string) => selectSlot(page, slot);

/**
 * Opens what holds a setting: the Shell menu for the shell, else the
 * inspector for the slot the setting names ("End panel state").
 */
async function show(page: Page, name: string) {
  if (name === "Shell") {
    if (!(await shellMenu(page).isVisible()))
      await page.getByRole("button", { name: "Shell" }).click();
    await shellMenu(page).waitFor();
    return;
  }
  const slot = name.startsWith("Start panel") ? "start-panel" : "end-panel";
  await openSlot(page, slot);
}

/** Escape closes the Shell menu, if it's open; the inspector stays. */
async function closeMenus(page: Page) {
  if (await shellMenu(page).isVisible()) await page.keyboard.press("Escape");
  await expect(shellMenu(page)).toHaveCount(0);
}

const group = (page: Page, name: string) =>
  page
    .locator(
      "[data-slot=workbench-inspector], [data-slot=workbench-shell-menu]",
    )
    .getByRole("group", { name, exact: true });

async function choose(page: Page, name: string, option: string) {
  await show(page, name);
  await group(page, name)
    .getByRole("radio", { name: option, exact: true })
    .click();
}

const ready = (page: Page) =>
  page.locator("[data-template=detail-page] [data-occupant]").first().waitFor();

/** The template's own width, inside the shell. */
const templateWidth = (page: Page) =>
  page
    .locator("[data-template=detail-page]")
    .evaluate((el) => (el instanceof HTMLElement ? el.offsetWidth : 0));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
});

test("each shell wraps the template, and the page width includes it", async ({
  page,
}) => {
  await open(page, "?occupant=queue&view=template&page=1440");
  await ready(page);
  const pageBox = page.locator("[data-slot=workbench-page]");
  // Default: the sidebar shell, 280px of the page.
  await expect(pageBox.locator("[data-slot=sidebar]")).toHaveCount(1);
  expect(await templateWidth(page)).toBe(1440 - 280);
  // The shell fills the page, not the window.
  const { shell, pageHeight } = await pageBox.evaluate((el) => ({
    shell: el.firstElementChild?.getBoundingClientRect().height ?? 0,
    pageHeight: el.getBoundingClientRect().height,
  }));
  expect(Math.round(shell)).toBe(Math.round(pageHeight));
  expect(shell).toBeLessThan(page.viewportSize()?.height ?? 0);
  // The template view's dock has no map: the page is on the stage.
  await expect(
    page.locator("[data-slot=workbench-dock] [data-slot=workbench-map]"),
  ).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("shell=");

  // Minimal: a top bar and no sidebar, so the template is the page's width.
  await choose(page, "Shell", "Minimal");
  await expect(pageBox.locator("[data-slot=sidebar]")).toHaveCount(0);
  await expect.poll(() => templateWidth(page)).toBe(1440);
  expect(urlQuery(page)).toContain("shell=minimal");
  // The narrowest page is main's minimum plus the shell's width.
  await closeMenus(page);
  await page.getByRole("slider", { name: "Page width" }).focus();
  await page.keyboard.press("Home");
  await expect(page.locator("[data-slot=workbench-page-width]")).toHaveText(
    "480px",
  );
});

test("panels can be removed and closed, and Edit's stage follows", async ({
  page,
}) => {
  // The occupant in main, so neither panel is locked.
  await open(page, "?occupant=key-facts&view=template&slot=main");
  await ready(page);
  await choose(page, "Start panel in the page", "Left out");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-end-panel": "open",
    });
  // Left out, the inspector says to include it first, above that choice.
  await expect(group(page, "Start panel state")).toHaveCount(0);
  await expect(
    inspector(page).locator("[data-slot=workbench-slot-left-out]"),
  ).toHaveText("Include the start panel first to put occupants in it.");
  await expect(group(page, "Start panel in the page")).toBeVisible();
  expect(urlQuery(page)).toContain("start-panel-present=false");
  // Left out, it's a ghost where it would sit.
  await expect(page.locator("[data-ghost-slot=start-panel]")).toBeVisible();

  await choose(page, "End panel state", "Closed");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-end-panel": "closed",
    });
  expect(urlQuery(page)).toContain("end-panel-state=closed");
  // Closed, it's a strip on its edge.
  await expect(
    page.locator("[data-slot=workbench-closed-slot][data-edit-slot=end-panel]"),
  ).toBeVisible();

  await choose(page, "End panel in the page", "Left out");
  await expect.poll(() => slotStates(page)).toEqual({});
  expect(urlQuery(page)).toContain("end-panel-present=false");
});

test("no panel is locked: the template view has no focused occupant", async ({
  page,
}) => {
  await open(page, "?occupant=queue&view=template");
  await ready(page);
  // Queue's panel can be left out and closed like any other.
  for (const slot of ["start-panel", "end-panel"]) {
    await openSlot(page, slot);
    const name = slot === "start-panel" ? "Start panel" : "End panel";
    for (const [group_, option] of [
      [`${name} in the page`, "Left out"],
      [`${name} state`, "Closed"],
      [`${name} placement`, "Beside header"],
    ] as const)
      await expect(
        group(page, group_).getByRole("radio", { name: option, exact: true }),
      ).toBeEnabled();
    await expect(
      inspector(page)
        .locator("[data-slot=workbench-layout-slot]")
        .getByRole("img", { name: "Locked" }),
    ).toHaveCount(0);
  }
});

test("the width rule closes panels when there isn't room, and says so", async ({
  page,
}) => {
  // 720px inside the shell. No panel is focused, so none is kept: the
  // template's own rule closes both.
  await open(page, "?occupant=queue&view=template&page=1000");
  await page.locator("[data-template=detail-page]").waitFor();
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "closed",
      "detail-page-end-panel": "closed",
    });
  await openSlot(page, "start-panel");
  const start = inspector(page).locator(
    "[data-slot=workbench-layout-slot][data-layout-slot=start-panel]",
  );
  await expect(start).toHaveAttribute("data-closed-by", "rule");
  await expect(group(page, "Start panel state")).toHaveAccessibleDescription(
    /Closed by the width rule/,
  );
  // It's still wanted open, so the menu keeps Open chosen.
  await expect(
    group(page, "Start panel state").getByRole("radio", { name: "Open" }),
  ).toHaveAttribute("aria-checked", "true");
  // With room again, it reopens on its own.
  await closeMenus(page);
  await page.getByRole("slider", { name: "Page width" }).focus();
  for (let i = 0; i < 60; i++) await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "open",
    });
  await openSlot(page, "start-panel");
  await expect(start).not.toHaveAttribute("data-closed-by", "rule");
});

test("the layout round-trips through the URL", async ({ page }) => {
  await open(page, "?occupant=queue&view=template");
  await ready(page);
  await choose(page, "Shell", "Minimal");
  await choose(page, "End panel placement", "Beside header");
  await choose(page, "End panel state", "Closed");
  const url = urlQuery(page);
  for (const part of [
    "shell=minimal",
    "end-panel-placement=beside-header",
    "end-panel-state=closed",
  ])
    expect(url).toContain(part);
  // Defaults aren't written.
  for (const part of [
    "-present=",
    "start-panel-placement=",
    "start-panel-state=",
  ])
    expect(url).not.toContain(part);

  await page.reload();
  await ready(page);
  expect(urlQuery(page)).toBe(url);
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "closed",
    });
  for (const [name, option] of [
    ["Shell", "Minimal"],
    ["End panel placement", "Beside header"],
    ["End panel state", "Closed"],
  ] as const) {
    await show(page, name);
    await expect(
      group(page, name).getByRole("radio", { name: option, exact: true }),
    ).toHaveAttribute("aria-checked", "true");
    await closeMenus(page);
  }

  // A slot whose panel the URL removed gets it back: the occupant's slot stays.
  await open(
    page,
    "?occupant=queue&view=template&panels=end&start-state=closed",
  );
  await ready(page);
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "open",
    });
});

test("old layout links still open the same layout, in per-slot params", async ({
  page,
}) => {
  // The occupant in main, so neither panel is locked.
  await open(
    page,
    "?occupant=key-facts&view=template&slot=main&panels=end&end=beside-header&end-state=closed",
  );
  await ready(page);
  await expect
    .poll(() => slotStates(page))
    .toEqual({ "detail-page-end-panel": "closed" });
  const url = urlQuery(page);
  for (const part of [
    "start-panel-present=false",
    "end-panel-placement=beside-header",
    "end-panel-state=closed",
  ])
    expect(url).toContain(part);
  for (const part of ["panels=", "&end=", "end-state="])
    expect(url).not.toContain(part);
});
