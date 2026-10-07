import { readFile } from "node:fs/promises";
import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot } from "./workbench-helpers";

/*
 * Export, from the template view's header: a dialog of sections, for now
 * one, Share for review. Its link, its Markdown summary, and its picture,
 * each with a toast; focus in and back out.
 */

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

const PAGE =
  "?view=template&header-contents=stage-strip&start-panel-contents=participants&start-panel-present=false&main-contents=queue&end-panel-contents=key-facts~overview:activity-timeline.participants&end-panel-state=closed";

const dialog = (page: Page) =>
  page.locator("[data-slot=workbench-export-dialog]");
const exportButton = (page: Page) =>
  page.getByRole("button", { name: "Export", exact: true });
const toast = (page: Page) => page.locator("[data-sonner-toast]");
const clipboard = (page: Page) =>
  page.evaluate(() => navigator.clipboard.readText());

async function ready(page: Page, query = PAGE) {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await open(page, query);
  await page
    .locator("[data-slot=workbench-page] [data-occupant=queue]")
    .waitFor();
  await settle(page);
}

for (const mode of ["Preview", "Edit"] as const) {
  test(`Export opens from ${mode}: focus moves in, Escape closes it and goes back`, async ({
    page,
  }) => {
    await ready(page, mode === "Edit" ? `${PAGE}&mode=edit` : PAGE);
    await exportButton(page).click();
    await expect(dialog(page)).toBeVisible();
    await expect(
      dialog(page).getByRole("heading", { name: "Export Detail page" }),
    ).toBeVisible();
    await expect(
      dialog(page).locator("[data-slot=workbench-export-counts]"),
    ).toHaveText("4 slots in use · 5 occupants on the page");
    // Focus is in it.
    expect(
      await dialog(page).evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    // One section: no navigation, no placeholders.
    await expect(dialog(page).getByRole("navigation")).toHaveCount(0);
    await expect(
      dialog(page).locator("[data-slot=workbench-export-section]"),
    ).toHaveAttribute("data-section", "share");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(exportButton(page)).toBeFocused();
  });
}

test("Copy link copies this page's link, and says so", async ({ page }) => {
  await ready(page);
  await exportButton(page).click();
  await expect(
    dialog(page).locator("[data-slot=workbench-export-renames-note]"),
  ).toHaveCount(0);
  await dialog(page)
    .getByRole("button", { name: "Copy the link to this page" })
    .click();
  await expect(toast(page)).toContainText("Link copied");
  expect(await clipboard(page)).toBe(page.url());
  await expect(
    dialog(page).locator("[data-slot=workbench-export-link]"),
  ).toHaveValue(page.url());
});

test("the summary says what's on the page; renames are marked, and left out of the link", async ({
  page,
}) => {
  await ready(page, `${PAGE}&mode=edit`);
  // A preview-only name, from the inspector.
  await selectSlot(page, "end-panel");
  await inspector(page)
    .getByRole("button", { name: "Rename Key facts", exact: true })
    .click();
  await inspector(page)
    .getByRole("textbox", { name: "Rename Key facts" })
    .fill("Shipment");
  await page.keyboard.press("Enter");
  await exportButton(page).click();
  await expect(
    dialog(page).locator("[data-slot=workbench-export-renames-note]"),
  ).toHaveText("Preview-only names aren't included in the link.");
  const preview = dialog(page).getByRole("region", { name: "Summary preview" });
  const expected = [
    "# Detail page",
    "",
    "Page width 1440px, shell: Default (sidebar).",
    "",
    "## Header",
    "",
    "Open.",
    "",
    "- Stage strip",
    "",
    "## Start panel",
    "",
    "Hidden, its contents kept.",
    "",
    "- Tab: Participants",
    "",
    "## Main",
    "",
    "Open.",
    "",
    "- Queue",
    "",
    "## End panel",
    "",
    "Closed, below header.",
    "",
    "- Tab: Shipment (preview name)",
    "- Tab: Overview, a stack of Activity timeline, Participants",
    "",
  ].join("\n");
  expect(await preview.textContent()).toBe(expected);
  await dialog(page)
    .getByRole("button", { name: "Copy the summary as Markdown" })
    .click();
  await expect(toast(page)).toContainText("Summary copied");
  expect(await clipboard(page)).toBe(expected);
});

test("Download PNG saves a picture of the page", async ({ page }) => {
  await ready(page);
  await exportButton(page).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    dialog(page)
      .getByRole("button", { name: "Download a picture of the page as a PNG" })
      .click(),
  ]);
  expect(download.suggestedFilename()).toBe("detail-page.png");
  const path = await download.path();
  const bytes = await readFile(path);
  // A PNG, and not an empty one.
  expect([...bytes.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(bytes.length).toBeGreaterThan(5000);
  await expect(toast(page)).toContainText("Picture downloaded");
});
