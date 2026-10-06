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

/** Moves the occupant to a slot with that slot's "Move here", and closes it. */
async function moveTo(page: Page, slot: string, occupant: string) {
  await openSlot(page, slot);
  await popover(page)
    .getByRole("button", { name: `Move ${occupant} here` })
    .click();
  await closePopover(page);
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
  await expect(page.locator("[data-slot=workbench-frame-tag]")).toHaveText(
    "Detail page · Start panel · 1440px",
  );
  await expect(
    page.locator(
      "[data-template=detail-page] [data-slot=detail-page-start-panel] [data-occupant=queue]",
    ),
  ).toBeVisible();
  // The dock is now slots and the page width; the occupant's slot is marked.
  await expect(
    page.getByRole("button", { name: "Start panel, 1 occupant, holds Queue" }),
  ).toHaveAttribute("data-here", "true");
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
  // It can't be moved there, and its popover says why.
  // The chips say each slot's state, not whether it fits.
  await expect(
    page.getByRole("button", { name: "Header, 0 occupants" }),
  ).toBeVisible();
  await openSlot(page, "header");
  const show = popover(page).getByRole("button", { name: "Move Queue here" });
  // It comes after the slot's contents, before its layout.
  const contents = popover(page).getByRole("region", { name: "Contents" });
  const below = async () =>
    ((await show.boundingBox())?.y ?? 0) >
    ((await contents.boundingBox())?.y ?? 0);
  expect(await below()).toBe(true);
  await expect(show).toBeDisabled();
  await expect(show).toHaveAccessibleDescription(
    "It doesn't fit this slot's surface.",
  );
  // A link can still put it there: the stage says why it doesn't go.
  await open(page, "?occupant=queue&view=template&slot=header");
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
  await moveTo(page, "end-panel", "Queue");
  await chooseLayout(page, "end-panel", "End panel placement", "Beside header");
  await closePopover(page);
  await page.getByRole("slider", { name: "Page width" }).focus();
  await page.keyboard.press("ArrowLeft");
  // The link is written after the change renders.
  await expect.poll(() => urlQuery(page)).toContain("page=1432");
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
  await moveTo(page, "main", "Queue");
  await expect(page.locator("[data-slot=workbench-frame-tag]")).toContainText(
    "Main",
  );
});

test("the dock fits one row on a 1416px window, with the list open", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1416, height: 900 });
  for (const query of [
    "?occupant=queue&view=template",
    "?occupant=queue&view=template&start-panel-present=false",
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
    "End panel, 2 occupants, holds Queue",
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
