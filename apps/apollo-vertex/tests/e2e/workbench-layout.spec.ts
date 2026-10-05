import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { open, slotStates, urlQuery } from "./workbench-helpers";

/*
 * The template view's Layout menu: the shell, which panels the template
 * has, each panel's open state and placement, the occupant's locked slot,
 * the template's own width rule, the page map, and the URL.
 */

const menu = (page: Page) => page.locator("[data-slot=workbench-layout-menu]");

async function openMenu(page: Page) {
  if (!(await menu(page).isVisible()))
    await page.getByRole("button", { name: "Layout" }).click();
  await menu(page).waitFor();
}

const group = (page: Page, name: string) =>
  menu(page).getByRole("group", { name, exact: true });

async function choose(page: Page, name: string, option: string) {
  await openMenu(page);
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

const mapRegions = (page: Page) =>
  page
    .locator("[data-slot=workbench-map] [data-region]")
    .evaluateAll((parts) =>
      parts.map((part) =>
        part instanceof HTMLElement
          ? `${part.dataset.region}${part.dataset.state === "closed" ? ":closed" : ""}`
          : "",
      ),
    );

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
  expect(await mapRegions(page)).toContain("shell");
  expect(urlQuery(page)).not.toContain("shell=");

  // Minimal: a top bar and no sidebar, so the template is the page's width.
  await choose(page, "Shell", "Minimal");
  await expect(pageBox.locator("[data-slot=sidebar]")).toHaveCount(0);
  await expect.poll(() => templateWidth(page)).toBe(1440);
  expect(urlQuery(page)).toContain("shell=minimal");
  await expect(page.locator("[data-slot=workbench-map]")).toHaveAttribute(
    "data-shell",
    "minimal",
  );
  // The narrowest page is main's minimum plus the shell's width.
  await page.keyboard.press("Escape");
  await page.getByRole("slider", { name: "Page width" }).focus();
  await page.keyboard.press("Home");
  await expect(page.locator("[data-slot=workbench-page-width]")).toHaveText(
    "480px",
  );
});

test("panels can be removed and closed, and the map follows", async ({
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
  await expect(group(page, "Start panel state")).toHaveCount(0);
  expect(urlQuery(page)).toContain("start-panel-present=false");
  expect(await mapRegions(page)).not.toContain("start-panel");

  await choose(page, "End panel state", "Closed");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-end-panel": "closed",
    });
  expect(urlQuery(page)).toContain("end-panel-state=closed");
  await expect.poll(() => mapRegions(page)).toContain("end-panel:closed");

  await choose(page, "End panel in the page", "Left out");
  await expect.poll(() => slotStates(page)).toEqual({});
  expect(urlQuery(page)).toContain("end-panel-present=false");
});

test("the occupant's panel is locked, with the reason", async ({ page }) => {
  await open(page, "?occupant=queue&view=template");
  await ready(page);
  await openMenu(page);
  const presence = group(page, "Start panel in the page");
  // It can't be left out.
  await expect(
    presence.getByRole("radio", { name: "Included", exact: true }),
  ).toBeEnabled();
  await expect(
    presence.getByRole("radio", { name: "Left out", exact: true }),
  ).toBeDisabled();
  await expect(presence).toHaveAccessibleDescription(
    "The start panel holds the occupant, so it stays.",
  );
  const state = group(page, "Start panel state");
  await expect(state.getByRole("radio", { name: "Closed" })).toBeDisabled();
  await expect(state).toHaveAccessibleDescription(
    "It holds the occupant, so it stays open.",
  );
  // Its placement can still change.
  await expect(
    group(page, "Start panel placement").getByRole("radio", {
      name: "Beside header",
    }),
  ).toBeEnabled();
  // The other panel isn't locked.
  await expect(
    group(page, "End panel state").getByRole("radio", { name: "Closed" }),
  ).toBeEnabled();
  await expect(
    group(page, "End panel in the page").getByRole("radio", {
      name: "Left out",
    }),
  ).toBeEnabled();
});

test("the width rule closes the other panel when there isn't room, and says so", async ({
  page,
}) => {
  // 720px inside the shell: room for main and one panel.
  await open(page, "?occupant=queue&view=template&page=1000");
  await ready(page);
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "closed",
    });
  await openMenu(page);
  const end = menu(page).locator(
    "[data-slot=workbench-layout-slot][data-layout-slot=end-panel]",
  );
  await expect(end).toHaveAttribute("data-closed-by", "rule");
  await expect(group(page, "End panel state")).toHaveAccessibleDescription(
    /Closed by the width rule/,
  );
  // It's still wanted open, so the menu keeps Open chosen.
  await expect(
    group(page, "End panel state").getByRole("radio", { name: "Open" }),
  ).toHaveAttribute("aria-checked", "true");
  // With room again, it reopens on its own.
  await page.keyboard.press("Escape");
  await page.getByRole("slider", { name: "Page width" }).focus();
  for (let i = 0; i < 60; i++) await page.keyboard.press("ArrowRight");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "open",
    });
  await openMenu(page);
  await expect(end).not.toHaveAttribute("data-closed-by", "rule");
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
  await openMenu(page);
  for (const [name, option] of [
    ["Shell", "Minimal"],
    ["End panel placement", "Beside header"],
    ["End panel state", "Closed"],
  ] as const)
    await expect(
      group(page, name).getByRole("radio", { name: option, exact: true }),
    ).toHaveAttribute("aria-checked", "true");

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
