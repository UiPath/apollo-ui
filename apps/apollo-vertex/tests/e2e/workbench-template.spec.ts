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
 * The workbench's template view: the occupant in a template slot, moving
 * it to another slot, placement, the template's width rules, the URL, and
 * an axe scan. The page width is the whole window: the default shell's
 * sidebar takes 280px of it. Each slot's layout has its own spec.
 */

const popover = (page: Page) =>
  page.locator("[data-slot=workbench-slot-popover]");
const chip = (page: Page, slot: string) =>
  page.locator(`[data-slot=workbench-slot-chip][data-chip-slot=${slot}]`);

/** Opens a slot's popover from its dock chip. */
async function openSlot(page: Page, slot: string) {
  await chip(page, slot).click();
  await popover(page)
    .and(page.locator(`[data-popover-slot=${slot}]`))
    .waitFor();
}

/** Escape, and wait for it to close: it hands focus back to its opener. */
async function closePopover(page: Page) {
  await page.keyboard.press("Escape");
  await expect(popover(page)).toHaveCount(0);
}

/** Picks an option in one of a slot's layout groups, in its popover. */
async function chooseLayout(
  page: Page,
  slot: string,
  group: string,
  option: string,
) {
  await openSlot(page, slot);
  await popover(page)
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
  // No slot is the occupant's: the tag names the page.
  await expect(page.locator("[data-slot=workbench-frame-tag]")).toHaveText(
    "Detail page · 1440px",
  );
  await expect(
    page.locator(
      "[data-template=detail-page] [data-slot=detail-page-start-panel] [data-occupant=queue]",
    ),
  ).toBeVisible();
  // The empty page took the occupant, in the first slot it fits; after
  // that it's an ordinary occupant, in its primary sample, ready.
  await expect(page.getByRole("slider", { name: "Page width" })).toBeVisible();
  expect(urlQuery(page)).toContain("view=template");
  expect(urlQuery(page)).toContain("start-panel-contents=queue");
  // Sample and State are the surface view's only.
  await expect(page.getByRole("group", { name: "Sample" })).toHaveCount(0);
  await expect(page.getByRole("combobox", { name: "Sample" })).toHaveCount(0);
  expect(urlQuery(page)).not.toContain("sample=");
  expect(urlQuery(page)).not.toContain("state=");

  await page.getByRole("radio", { name: "Surface", exact: true }).click();
  await expect(
    stage(page).locator("[data-surface-name=side-panel] [data-occupant=queue]"),
  ).toBeVisible();
  expect(urlQuery(page)).not.toContain("view=");
  expect(urlQuery(page)).toContain("sample=stress");
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
  // Not room for both (720px inside the shell). No panel is focused, so
  // none is kept: the template's own rule closes both.
  await open(page, "?occupant=queue&view=template&page=1000");
  await expect
    .poll(() => slotStates(page))
    .toEqual({
      "detail-page-start-panel": "closed",
      "detail-page-end-panel": "closed",
    });
  // The narrowest page: main's minimum plus the shell. Both stay closed.
  const slider = page.getByRole("slider", { name: "Page width" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.locator("[data-slot=workbench-page-width]")).toHaveText(
    "760px",
  );
  await expect
    .poll(() => slotStates(page))
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
  await chooseLayout(
    page,
    "start-panel",
    "Start panel placement",
    "Beside header",
  );
  await expect
    .poll(async () => (await header.boundingBox())?.x ?? 0)
    .toBeGreaterThan((await panel.boundingBox())?.x ?? 0);
  expect(urlQuery(page)).toContain("start-panel-placement=beside-header");
  // Placement isn't in the dock: it's per panel, in its popover.
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
  await chooseLayout(page, "end-panel", "End panel placement", "Beside header");
  await closePopover(page);
  await page.getByRole("slider", { name: "Page width" }).focus();
  await page.keyboard.press("ArrowLeft");
  // The link is written after the change renders.
  await expect.poll(() => urlQuery(page)).toContain("page=1432");
  const url = urlQuery(page);
  for (const part of [
    "view=template",
    "start-panel-contents=queue",
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
    "Detail page · 1432px",
  );
  await expect(
    page.locator("[data-slot=detail-page-start-panel] [data-occupant=queue]"),
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
  // And works: a chip opens its slot.
  await openSlot(page, "main");
});

test("the dock fits one row on a 1416px window, with the list open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1416, height: 900 });
  for (const query of [
    "?occupant=queue&view=template",
    "?view=template&end-panel-contents=queue&start-panel-present=false",
  ]) {
    await open(page, query);
    await page.evaluate(() => document.fonts.ready);
    const rows = await page.locator("[data-slot=workbench-dock]").evaluate(
      (dock) =>
        new Set(
          [...dock.children].map((part) => {
            const box = part.getBoundingClientRect();
            return Math.round(box.top + box.height / 2);
          }),
        ).size,
    );
    expect(rows, query).toBe(1);
  }
  // The shell is an icon there, named for its menu.
  await expect(page.getByRole("button", { name: "Shell" })).toBeVisible();
});

test("each dock chip says its slot's state", async ({ page }) => {
  await open(
    page,
    "?occupant=queue&view=template&slot=end-panel&end-panel-contents=queue~key-facts&start-panel-present=false",
  );
  // How many each holds, and which holds the occupant.
  await expect(chip(page, "end-panel")).toHaveAccessibleName(
    "End panel, 2 occupants",
  );
  await expect(chip(page, "end-panel")).toContainText("2");
  await expect(chip(page, "main")).toHaveAccessibleName("Main, 0 occupants");
  // A left-out slot: dashed and muted, with no count.
  await expect(chip(page, "start-panel")).toHaveAccessibleName(
    "Start panel, left out",
  );
  await expect(chip(page, "start-panel")).toHaveAttribute(
    "data-left-out",
    "true",
  );
  expect(
    await chip(page, "start-panel").evaluate(
      (el) => getComputedStyle(el).borderStyle,
    ),
  ).toContain("dashed");
  await expect(
    chip(page, "start-panel").locator("[data-slot=workbench-slot-chip-state]"),
  ).toHaveCount(0);
});
