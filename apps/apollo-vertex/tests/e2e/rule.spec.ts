import type { Page } from "@playwright/test";
import {
  expect,
  openCard,
  openPreview,
  panelStates,
  pick,
  resize,
  test,
} from "./fixtures";

/**
 * The main-width rule in the page, end to end. Its logic has unit tests
 * (tests/unit/detail-page-rules.test.ts); these check the wiring: the card,
 * resizing, and "closed by rule" reporting. Sidebar shell: the template is
 * the window less 280px.
 */
const ruleClosed = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("span")]
      .filter((el) => el.textContent === "closed by rule")
      .map((el) =>
        el
          .closest("section")
          ?.getAttribute("aria-label")
          ?.replace(" panel", ""),
      )
      .join(","),
  );

async function expectPanels(
  page: Page,
  start: string,
  end: string,
  rule: string,
) {
  await expect.poll(() => panelStates(page)).toEqual({ start, end });
  expect(await ruleClosed(page)).toBe(rule);
}

test("rule-closed panels reopen, user-closed stay closed, and the latest open wins", async ({
  page,
}) => {
  await openPreview(page, "", 1440);
  await openCard(page);
  await pick(page, "Start panel state", "Closed");
  await pick(page, "End panel state", "Closed");
  await pick(page, "Start panel state", "Open");
  await pick(page, "End panel state", "Open");
  await expectPanels(page, "open", "open", "");

  // Room for one: the older panel closes, and reopens when there's room.
  await resize(page, 1200);
  await expectPanels(page, "closed", "open", "Start");
  await resize(page, 1440);
  await expectPanels(page, "open", "open", "");

  // A panel the user closed stays closed through resizes.
  await pick(page, "Start panel state", "Closed");
  await resize(page, 1200);
  await resize(page, 1440);
  await expectPanels(page, "closed", "open", "");

  // The panel the user just opened wins, even with no room at all.
  await resize(page, 1200);
  await pick(page, "Start panel state", "Open");
  await expectPanels(page, "open", "closed", "End");
  await resize(page, 700);
  await expectPanels(page, "open", "closed", "End");
  await resize(page, 1440);
  await expectPanels(page, "open", "open", "");

  // Reopening the rule-closed end panel makes it the latest: start closes.
  await resize(page, 1200);
  await pick(page, "End panel state", "Open");
  await expectPanels(page, "closed", "open", "Start");
});

test("fresh loads apply the rule with nothing protected", async ({ page }) => {
  await openPreview(page, "", 1200);
  await openCard(page);
  await expectPanels(page, "closed", "open", "Start");
  await resize(page, 1440);
  await expectPanels(page, "open", "open", "");
  await openPreview(page, "", 700);
  await openCard(page);
  await expectPanels(page, "closed", "closed", "Start,End");
  await resize(page, 1440);
  await expectPanels(page, "open", "open", "");
});

test("minimal shell: the template is the full window", async ({ page }) => {
  await openPreview(page, "?shell=minimal", 950);
  await openCard(page);
  await expectPanels(page, "closed", "open", "Start");
  await resize(page, 1100);
  await expectPanels(page, "open", "open", "");
});
