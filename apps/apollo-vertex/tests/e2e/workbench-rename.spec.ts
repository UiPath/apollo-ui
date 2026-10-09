import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { inspector, open, selectSlot, urlQuery } from "./workbench-helpers";

/*
 * Preview-only renames in the inspector: an occupant's name and a stack's
 * label rename in place, and the page shows the new name wherever that
 * title renders. Renames are never in the link, Reset layout clears them
 * (Undo brings them back), and a reload shows the declared titles.
 */

const STACKED =
  "?view=template&end-panel-contents=queue~overview:activity-timeline.participants&mode=edit&zoom=100";

const end = (page: Page) =>
  page.locator("[data-slot=workbench-page] [data-slot=detail-page-end-panel]");
const tabNames = (page: Page) =>
  end(page)
    .locator("[data-part=tab-bar] [role=tab]:not([hidden])")
    .allTextContents();
const headings = (page: Page) =>
  end(page).locator("[data-part=stack-heading]").allTextContents();
const nameButton = (page: Page, name: string) =>
  inspector(page).getByRole("button", { name: `Rename ${name}`, exact: true });
const nameField = (page: Page, name: string) =>
  inspector(page).getByRole("textbox", { name: `Rename ${name}`, exact: true });
const toast = (page: Page) => page.locator("[data-sonner-toast]");

async function ready(page: Page, query = STACKED) {
  await open(page, query);
  await end(page).locator("[data-occupant]").first().waitFor({
    state: "attached",
  });
  await settle(page);
  await selectSlot(page, "end-panel");
}

async function renameTo(page: Page, name: string, text: string) {
  await nameButton(page, name).click();
  await nameField(page, name).fill(text);
  await page.keyboard.press("Enter");
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
});

test("a name renames in place, and the page shows it; the link doesn't change", async ({
  page,
}) => {
  await ready(page);
  const link = urlQuery(page);
  // A button named for what it renames, then a field with the same name,
  // and a hint that it's only for this preview.
  await nameButton(page, "Activity timeline").click();
  const field = nameField(page, "Activity timeline");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue("Activity timeline");
  await expect(field).toHaveAccessibleDescription("Only for this preview");
  await field.fill("Events");
  await page.keyboard.press("Enter");
  // The stack's heading, and focus back on the renamed name.
  await expect.poll(() => headings(page)).toEqual(["Events", "Participants"]);
  await expect(nameButton(page, "Events")).toBeFocused();
  // A tab of one: its label is its occupant's title.
  await renameTo(page, "Queue", "Inbox");
  await expect.poll(() => tabNames(page)).toEqual(["Inbox", "Overview"]);
  // A stack's label renames too.
  await renameTo(page, "Overview", "Context");
  await expect.poll(() => tabNames(page)).toEqual(["Inbox", "Context"]);
  expect(urlQuery(page)).toBe(link);
  // A reload shows the declared titles again.
  await page.reload();
  await end(page).locator("[data-occupant]").first().waitFor({
    state: "attached",
  });
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  await expect
    .poll(() => headings(page))
    .toEqual(["Activity timeline", "Participants"]);
});

test("Escape cancels, an empty name restores the default, and so does the reset icon", async ({
  page,
}) => {
  await ready(page);
  // Escape: no change, and the slot stays selected.
  await nameButton(page, "Queue").click();
  await nameField(page, "Queue").fill("Inbox");
  await page.keyboard.press("Escape");
  await expect(nameButton(page, "Queue")).toBeFocused();
  await expect(inspector(page)).toHaveAttribute(
    "data-inspector-slot",
    "end-panel",
  );
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  await expect(
    inspector(page).locator("[data-slot=workbench-rename-reset]"),
  ).toHaveCount(0);
  // Renamed: a reset icon puts the default back.
  await renameTo(page, "Queue", "Inbox");
  await expect.poll(() => tabNames(page)).toEqual(["Inbox", "Overview"]);
  const reset = inspector(page).getByRole("button", {
    name: "Use the default name for Inbox",
  });
  await reset.click();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
  await expect(reset).toHaveCount(0);
  // An empty name does the same.
  await renameTo(page, "Queue", "Inbox");
  await expect.poll(() => tabNames(page)).toEqual(["Inbox", "Overview"]);
  await nameButton(page, "Inbox").click();
  await nameField(page, "Inbox").fill("   ");
  await page.keyboard.press("Enter");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Overview"]);
});

test("a preset label replaces a stack's rename", async ({ page }) => {
  await ready(page);
  await renameTo(page, "Overview", "Context");
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "Context"]);
  await inspector(page)
    .locator("[data-slot=workbench-contents-label-presets]")
    .click();
  await inspector(page)
    .getByRole("group", { name: "Labels for tab 2" })
    .getByRole("radio", { name: "People" })
    .click();
  await expect.poll(() => tabNames(page)).toEqual(["Queue", "People"]);
});

test("a renamed tab shows its new name in More", async ({ page }) => {
  // Narrow enough that some tabs go into More.
  await page.setViewportSize({ width: 1100, height: 900 });
  await ready(
    page,
    "?view=template&end-panel-contents=queue~key-facts~participants~activity-timeline&mode=edit&zoom=100",
  );
  await renameTo(page, "Activity timeline", "Events");
  // The page is inert in Edit: More opens in Preview.
  await page
    .getByRole("group", { name: "Mode" })
    .getByRole("radio", { name: "Preview" })
    .click();
  await settle(page);
  const more = end(page).getByRole("button", { name: "More tabs" });
  await more.click();
  await expect(page.getByRole("menuitem", { name: "Events" })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("Reset layout clears renames, and Undo brings them back", async ({
  page,
}) => {
  await ready(page);
  await renameTo(page, "Queue", "Inbox");
  await renameTo(page, "Activity timeline", "Events");
  await expect.poll(() => tabNames(page)).toEqual(["Inbox", "Overview"]);
  await page.getByRole("button", { name: "Reset layout" }).click();
  await expect(toast(page)).toContainText(
    "Layout reset to the template's defaults",
  );
  await toast(page).getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => tabNames(page)).toEqual(["Inbox", "Overview"]);
  await expect.poll(() => headings(page)).toEqual(["Events", "Participants"]);
  // A Reset that stays clears them: Queue, put back in this session, has
  // its declared name.
  await page.getByRole("button", { name: "Reset layout" }).click();
  await expect.poll(() => urlQuery(page)).not.toContain("contents");
  await selectSlot(page, "end-panel");
  await inspector(page).getByRole("button", { name: "New tab" }).click();
  await inspector(page)
    .locator("[data-slot=workbench-picker]")
    .getByRole("button", { name: "Queue", exact: true })
    .click();
  await expect(nameButton(page, "Queue")).toBeVisible();
  await expect(nameButton(page, "Inbox")).toHaveCount(0);
});
