import { expect, test } from "./fixtures";
import {
  axeViolations,
  open,
  panelStates,
  search,
  stage,
} from "./workbench-helpers";

/*
 * The workbench's template view: the occupant in a template slot, the
 * slot switcher, placement, the template's width rules, the URL, and an
 * axe scan.
 */

test("switching views keeps the occupant, sample, and state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await open(page, "?occupant=queue&sample=stress&state=agent-updating");
  await page.getByRole("radio", { name: "Template", exact: true }).click();
  await expect(page.locator("[data-workbench-frame-tag]")).toHaveText(
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
  expect(search(page)).toContain("view=template");
  expect(search(page)).toContain("sample=stress");
  expect(search(page)).toContain("state=agent-updating");

  await page.getByRole("radio", { name: "Surface", exact: true }).click();
  await expect(
    stage(page).locator("[data-surface-name=side-panel] [data-occupant=queue]"),
  ).toBeVisible();
  expect(search(page)).not.toContain("view=");
  expect(search(page)).toContain("sample=stress");
});

test("a template slot the occupant doesn't fit shows why", async ({ page }) => {
  await open(page, "?occupant=queue&view=template");
  const header = page.getByRole("radio", { name: "Header, doesn't fit" });
  await header.click();
  const card = stage(page).locator("[data-workbench-no-fit]");
  await expect(card).toContainText("Queue doesn't go in the header");
  await expect(card).toContainText("Works only in vertical surfaces");
  await expect(
    page.locator("[data-workbench-map] [data-highlighted=true]"),
  ).toHaveAttribute("data-region", "header");
});

test("the template's page width rules apply live", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  // Room for main and both panels: both open.
  await open(page, "?occupant=queue&view=template&page=1440");
  await expect
    .poll(() => panelStates(page))
    .toEqual({
      "detail-page-start-panel": "open",
      "detail-page-end-panel": "open",
    });
  // Room for main and one panel: the rule closes the oldest, the start panel.
  await open(page, "?occupant=queue&view=template&page=1000");
  await expect
    .poll(() => panelStates(page))
    .toEqual({
      "detail-page-start-panel": "closed",
      "detail-page-end-panel": "open",
    });
  // The template's narrowest width: no room for either.
  const slider = page.getByRole("slider", { name: "Page width" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.locator("[data-workbench-page-width]")).toHaveText("480px");
  await expect
    .poll(() => panelStates(page))
    .toEqual({
      "detail-page-start-panel": "closed",
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
  await page.getByRole("radio", { name: "Beside header" }).click();
  await expect
    .poll(async () => (await header.boundingBox())?.x ?? 0)
    .toBeGreaterThan((await panel.boundingBox())?.x ?? 0);
  expect(search(page)).toContain("placement=beside-header");
  // Placement is for side slots only.
  await page.getByRole("radio", { name: "Main, fits" }).click();
  await expect(page.getByRole("radio", { name: "Beside header" })).toHaveCount(
    0,
  );
});

test("the template view round-trips through the URL", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await open(page, "?occupant=queue");
  await page.getByRole("radio", { name: "Template", exact: true }).click();
  await page.getByRole("radio", { name: "End panel, fits" }).click();
  await page.getByRole("radio", { name: "Beside header" }).click();
  await page.getByRole("slider", { name: "Page width" }).focus();
  await page.keyboard.press("ArrowLeft");
  const url = search(page);
  for (const part of [
    "view=template",
    "slot=end-panel",
    "placement=beside-header",
    "page=1432",
  ])
    expect(url).toContain(part);
  // One template: no picker, and its name isn't written.
  await expect(page.getByRole("combobox", { name: "Template" })).toHaveCount(0);
  expect(url).not.toContain("template=");

  await page.reload();
  await page.locator("[data-workbench]").waitFor();
  expect(search(page)).toBe(url);
  await expect(page.locator("[data-workbench-frame-tag]")).toHaveText(
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
  expect(await axeViolations(page)).toEqual([]);
});

test("the dock stays above the template, reachable, with the stage blurred behind it", async ({
  page,
}) => {
  // Short enough that the template runs under the dock.
  await page.setViewportSize({ width: 1500, height: 760 });
  await open(page, "?occupant=queue&view=template");
  await page
    .locator("[data-template=detail-page] [data-occupant=queue]")
    .waitFor();
  const dock = page.locator("[data-workbench-dock]");
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
  await expect(page.locator("[data-workbench-frame-tag]")).toContainText(
    "Main",
  );
  await expect(dock).toHaveCSS("backdrop-filter", /blur/);
});
