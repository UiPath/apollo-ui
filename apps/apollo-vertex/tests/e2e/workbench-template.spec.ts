import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import {
  axeViolations,
  open,
  slotStates,
  stage,
  urlQuery,
} from "./workbench-helpers";

/*
 * The workbench's template view: the occupant in a template slot, the
 * slot switcher, placement, the template's width rules, the URL, and an
 * axe scan. The page width is the whole window: the default shell's
 * sidebar takes 280px of it. The Layout menu has its own spec.
 */

/** Opens the Layout menu and picks an option in one of its groups. */
async function chooseLayout(page: Page, group: string, option: string) {
  const menu = page.locator("[data-slot=workbench-layout-menu]");
  if (!(await menu.isVisible()))
    await page.getByRole("button", { name: "Layout" }).click();
  await menu
    .getByRole("group", { name: group, exact: true })
    .getByRole("radio", { name: option, exact: true })
    .click();
}

test("switching views keeps the occupant, sample, and state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await open(page, "?occupant=queue&sample=stress&state=agent-updating");
  await page.getByRole("radio", { name: "Template", exact: true }).click();
  await expect(page.locator("[data-slot=workbench-frame-tag]")).toHaveText(
    "Detail page · Start panel · 1440px",
  );
  await expect(
    page.locator(
      "[data-template=detail-page] [data-slot=detail-page-start-panel] [data-occupant=queue]",
    ),
  ).toBeVisible();
  // The dock is now slots and the page width.
  await expect(
    page.getByRole("radio", { name: "Start panel, fits" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("slider", { name: "Page width" })).toBeVisible();
  expect(urlQuery(page)).toContain("view=template");
  expect(urlQuery(page)).toContain("sample=stress");
  expect(urlQuery(page)).toContain("state=agent-updating");

  await page.getByRole("radio", { name: "Surface", exact: true }).click();
  await expect(
    stage(page).locator("[data-surface-name=side-panel] [data-occupant=queue]"),
  ).toBeVisible();
  expect(urlQuery(page)).not.toContain("view=");
  expect(urlQuery(page)).toContain("sample=stress");
});

test("a template slot the occupant doesn't fit shows why", async ({ page }) => {
  await open(page, "?occupant=queue&view=template");
  const header = page.getByRole("radio", { name: "Header, doesn't fit" });
  await header.click();
  const card = stage(page).locator("[data-slot=workbench-no-fit]");
  await expect(card).toContainText("Queue doesn't go in the header");
  await expect(card).toContainText("Works only in vertical surfaces");
  await expect(
    page.locator("[data-slot=workbench-map] [data-highlighted=true]"),
  ).toHaveAttribute("data-region", "header");
});

test("the template's page width rules apply live", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  // Room for main and both panels (1160px inside the shell): both open.
  await open(page, "?occupant=queue&view=template&page=1440");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "open",
    });
  // Not room for both (720px inside the shell): the occupant's panel counts
  // as opened last, so the rule closes the other one.
  await open(page, "?occupant=queue&view=template&page=1000");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "closed",
    });
  // The narrowest page: main's minimum plus the shell. The occupant's panel
  // still stays; main shrinks instead.
  const slider = page.getByRole("slider", { name: "Page width" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.locator("[data-slot=workbench-page-width]")).toHaveText(
    "760px",
  );
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "closed",
    });
});

test("a side slot's placement puts it beside the header", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await open(page, "?occupant=queue&view=template");
  const header = page.locator("[data-slot=detail-page-header]");
  const panel = page.locator("[data-slot=detail-page-start-panel]");
  // Below: the header spans the page, over the panel.
  expect((await header.boundingBox())?.x).toBe((await panel.boundingBox())?.x);
  await chooseLayout(page, "Start panel placement", "Beside header");
  await expect
    .poll(async () => (await header.boundingBox())?.x ?? 0)
    .toBeGreaterThan((await panel.boundingBox())?.x ?? 0);
  expect(urlQuery(page)).toContain("start-panel-placement=beside-header");
  // Placement isn't in the dock any more: it's per panel, in the menu.
  await page.keyboard.press("Escape");
  await expect(
    page
      .locator("[data-slot=workbench-dock]")
      .getByRole("radio", { name: "Beside header" }),
  ).toHaveCount(0);
});

test("the template view round-trips through the URL", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await open(page, "?occupant=queue");
  await page.getByRole("radio", { name: "Template", exact: true }).click();
  await page.getByRole("radio", { name: "End panel, fits" }).click();
  await chooseLayout(page, "End panel placement", "Beside header");
  await page.keyboard.press("Escape");
  await page.getByRole("slider", { name: "Page width" }).focus();
  await page.keyboard.press("ArrowLeft");
  const url = urlQuery(page);
  for (const part of [
    "view=template",
    "slot=end-panel",
    "end-panel-placement=beside-header",
    "page=1432",
  ])
    expect(url).toContain(part);
  // One template: no picker, and its name isn't written.
  await expect(page.getByRole("combobox", { name: "Template" })).toHaveCount(0);
  expect(url).not.toContain("template=");

  await page.reload();
  await page.locator("[data-slot=workbench]").waitFor();
  expect(urlQuery(page)).toBe(url);
  await expect(page.locator("[data-slot=workbench-frame-tag]")).toHaveText(
    "Detail page · End panel · 1432px",
  );
  await expect(
    page.locator("[data-slot=detail-page-end-panel] [data-occupant=queue]"),
  ).toBeVisible();
});

test("passes an axe scan in the template view", async ({ page }) => {
  await open(page, "?occupant=queue&view=template");
  await page
    .locator("[data-template=detail-page] [data-occupant=queue]")
    .waitFor();
  // The page on the stage is the real ApolloShell around the template: a
  // whole page, with its own main landmark inside the workbench's, and the
  // shell's collapse button, which has no name yet (tracked separately).
  // The workbench around it is scanned; the page is the shell's to pass.
  // Its main still counts page-wide, so the workbench's main reads as a
  // second one: that rule alone is left out.
  const violations = await axeViolations(page, ["[data-slot=workbench-page]"]);
  expect(
    violations.filter((v) => !v.startsWith("landmark-no-duplicate-main:")),
  ).toEqual([]);
});

test("the dock stays above the template, every control reachable", async ({
  page,
}) => {
  // Short enough that the template runs under the dock.
  await page.setViewportSize({ width: 1500, height: 760 });
  await open(page, "?occupant=queue&view=template");
  await page
    .locator("[data-template=detail-page] [data-occupant=queue]")
    .waitFor();
  const dock = page.locator("[data-slot=workbench-dock]");
  // Every control in the dock is what a pointer hits at its center.
  const hidden = await dock.evaluate((el) =>
    [...el.querySelectorAll("button, [role=slider]")]
      .filter((control) => {
        const box = control.getBoundingClientRect();
        const top = document.elementFromPoint(
          box.left + box.width / 2,
          box.top + box.height / 2,
        );
        return !(top && control.contains(top));
      })
      .map(
        (control) =>
          control.textContent?.trim() || control.getAttribute("aria-label"),
      ),
  );
  expect(hidden).toEqual([]);
  await page.getByRole("radio", { name: "Main, fits" }).click();
  await expect(page.locator("[data-slot=workbench-frame-tag]")).toContainText(
    "Main",
  );
});
