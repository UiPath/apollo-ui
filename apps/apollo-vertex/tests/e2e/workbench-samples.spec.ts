import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot, urlQuery } from "./workbench-helpers";

/*
 * The template view's samples: in Edit, each occupant's options menu in
 * the inspector chooses which of its samples the page shows. A card not
 * on primary says which; the link carries it.
 */

const PANEL = "?view=template&end-panel-contents=activity-timeline~key-facts";
const ONE = "?view=template&header-contents=key-facts";

const query = (page: Page) => decodeURIComponent(urlQuery(page));
const onPage = (page: Page, occupant: string) =>
  page.locator(`[data-slot=workbench-page] [data-occupant=${occupant}]`);
const note = (page: Page, occupant: string) =>
  inspector(page).locator(
    `[data-slot=workbench-contents-card][data-row="${occupant}"] [data-slot=workbench-contents-sample]`,
  );

async function ready(page: Page, search: string, slot: string) {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await open(page, search);
  await page
    .locator("[data-slot=workbench-page] [data-occupant]")
    .first()
    .waitFor({ state: "attached" });
  await settle(page);
  await selectSlot(page, slot);
}

async function choose(page: Page, name: string, sample: string) {
  await inspector(page)
    .getByRole("button", { name: `${name} options`, exact: true })
    .click();
  await page.getByRole("menuitemradio", { name: sample }).click();
  await settle(page);
}

test("a panel's occupant shows the sample chosen in its menu, and the link keeps it", async ({
  page,
}) => {
  await ready(page, PANEL, "end-panel");
  // Primary at first: no note, nothing in the link.
  await expect(note(page, "activity-timeline")).toHaveCount(0);
  await expect(onPage(page, "activity-timeline")).toContainText(
    "Invoice received",
  );
  await inspector(page)
    .getByRole("button", { name: "Activity timeline options", exact: true })
    .click();
  await expect(
    page.getByRole("menuitemradio", { name: "Primary" }),
  ).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await choose(page, "Activity timeline", "Secondary");
  await expect(onPage(page, "activity-timeline")).toContainText(
    "Claim received",
  );
  await expect(note(page, "activity-timeline")).toHaveText("Secondary sample");
  expect(query(page)).toContain("samples=activity-timeline:secondary");
  // The link opens on it.
  await page.reload();
  await onPage(page, "activity-timeline").waitFor({ state: "attached" });
  await expect(onPage(page, "activity-timeline")).toContainText(
    "Claim received",
  );
  // Back to primary: the link drops it.
  await selectSlot(page, "end-panel");
  await choose(page, "Activity timeline", "Primary");
  await expect(note(page, "activity-timeline")).toHaveCount(0);
  expect(query(page)).not.toContain("samples=");
});

test("a slot that holds one chooses its sample in a menu of its own", async ({
  page,
}) => {
  await ready(page, ONE, "header");
  await expect(onPage(page, "key-facts")).toContainText("Carrier");
  await choose(page, "Key facts", "Secondary");
  await expect(onPage(page, "key-facts")).toContainText("Priority");
  await expect(note(page, "key-facts")).toHaveText("Secondary sample");
  expect(query(page)).toContain("samples=key-facts:secondary");
  // Nothing moves in a slot that holds one: the menu has only samples.
  await inspector(page)
    .getByRole("button", { name: "Key facts options", exact: true })
    .click();
  await expect(page.getByRole("menuitem", { name: "Move up" })).toHaveCount(0);
  await page.keyboard.press("Escape");
});

test("taking an occupant off the page drops its sample", async ({ page }) => {
  await ready(page, `${PANEL}&samples=key-facts:stress`, "end-panel");
  await expect(note(page, "key-facts")).toHaveText("Stress sample");
  await inspector(page)
    .getByRole("button", { name: "Remove Key facts", exact: true })
    .click();
  await expect.poll(() => query(page)).not.toContain("samples=");
});
