import { PADDED_INSET_PX } from "@/lib/composition";
import {
  END_PANEL_MIN_PX,
  MAIN_MIN_OUTER_PX,
  START_PANEL_PX,
} from "@/templates/detail-page/detail-page.template";
import { expect, openPreview, panelStates, test, widths } from "./fixtures";

// The sidebar shell's expanded sidebar: the template is the window less this.
const SIDEBAR = 280;
const BOTH = MAIN_MIN_OUTER_PX + START_PANEL_PX + END_PANEL_MIN_PX;
const ALONE = MAIN_MIN_OUTER_PX + START_PANEL_PX;

const cases: [string, number, string, { start: string; end: string | null }][] =
  [
    [
      `both need ${BOTH}px: exactly fits`,
      SIDEBAR + BOTH,
      "",
      { start: "open", end: "open" },
    ],
    [
      "both: one pixel short",
      SIDEBAR + BOTH - 1,
      "",
      { start: "closed", end: "open" },
    ],
    [
      `start alone needs ${ALONE}px: exactly fits`,
      SIDEBAR + ALONE,
      "?panels=start",
      { start: "open", end: null },
    ],
    [
      "start alone: one pixel short",
      SIDEBAR + ALONE - 1,
      "?panels=start",
      { start: "closed", end: null },
    ],
  ];

for (const [name, window, q, expected] of cases) {
  test(`${name} (window ${window})`, async ({ page }) => {
    await openPreview(page, q, window);
    expect(await panelStates(page)).toEqual(expected);
    if (expected.start === "open") {
      expect((await widths(page)).start).toBe(START_PANEL_PX);
      const inner = await page
        .locator("[data-surface=side-panel][data-side=start] [data-occupant]")
        .evaluate((el) => Math.round(el.getBoundingClientRect().width));
      expect(inner).toBe(START_PANEL_PX - 2 * PADDED_INSET_PX);
    }
  });
}

for (const window of [1440, 1920]) {
  test(`start panel is fixed at its default and has no handle (window ${window})${window === 1920 ? " @full" : ""}`, async ({
    page,
  }) => {
    await openPreview(page, "?panels=start&start-panel-padding=flush", window);
    const inner = await page
      .locator("[data-surface=side-panel][data-side=start] [data-occupant]")
      .evaluate((el) => Math.round(el.getBoundingClientRect().width));
    expect((await widths(page)).start).toBe(START_PANEL_PX);
    expect(inner).toBe(START_PANEL_PX);
    await expect(
      page.locator("[data-slot=detail-page-resize-handle]"),
    ).toHaveCount(0);
  });
}
