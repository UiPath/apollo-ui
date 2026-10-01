import { START_PANEL_PX } from "@/templates/detail-page/detail-page.template";
import { expect, occupantWidth, openPreview, test, widths } from "./fixtures";

const HANDLE = "[data-slot=detail-page-resize-handle]";

/*
 * The main-width rule's thresholds have unit tests
 * (tests/unit/detail-page-rules.test.ts), and rule.spec.ts checks its wiring.
 */

test("the start panel is fixed at its default and never has a handle; the end panel's goes when it closes", async ({
  page,
}) => {
  await openPreview(page, "?start-panel-padding=flush", 1440);
  expect((await widths(page)).start).toBe(START_PANEL_PX);
  expect(await occupantWidth(page, "start")).toBe(START_PANEL_PX);
  await expect(page.locator(HANDLE)).toHaveCount(1);
  await expect(
    page.locator(`[data-slot=detail-page-start-panel] ${HANDLE}`),
  ).toHaveCount(0);

  await openPreview(page, "?end-state=closed", 1440);
  await expect(page.locator(HANDLE)).toHaveCount(0);
});
