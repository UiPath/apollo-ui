import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";
import { open, slotStates, stage, urlQuery } from "./workbench-helpers";

/*
 * The template view's zoom: Fit scales the page to the stage, 100% shows it
 * at its real size and the stage scrolls. Either way the page keeps its
 * real width, so the frame tag and the template's rules see that width.
 */

const PAGE_WIDTHS = [1232, 1440, 1920] as const;
const WINDOWS = [
  { width: 1512, height: 900 },
  { width: 1280, height: 720 },
] as const;

const frame = (page: Page) => page.locator("[data-slot=workbench-frame]");

for (const window of WINDOWS)
  for (const pageWidth of PAGE_WIDTHS)
    test(`fits a ${pageWidth}px page in a ${window.width}x${window.height} window, and 100% scrolls`, async ({
      page,
    }) => {
      await page.setViewportSize(window);
      await open(page, `?occupant=queue&view=template&page=${pageWidth}`);
      await page
        .locator("[data-template=detail-page] [data-occupant=queue]")
        .waitFor();

      // Fit: the whole frame is on the stage, clear of the dock.
      const fitted = await page.evaluate(() => {
        const stageEl = document.querySelector("[data-slot=workbench-stage]");
        const frameEl = document.querySelector("[data-slot=workbench-frame]");
        const dockEl = document.querySelector("[data-slot=workbench-dock]");
        const pageEl = document.querySelector<HTMLElement>(
          "[data-slot=workbench-page]",
        );
        if (!stageEl || !frameEl || !dockEl || !pageEl) return null;
        const s = stageEl.getBoundingClientRect();
        const f = frameEl.getBoundingClientRect();
        const d = dockEl.getBoundingClientRect();
        return {
          inside: f.left >= s.left && f.right <= s.right && f.top >= s.top,
          clearOfDock: f.bottom <= d.top,
          scrolls: stageEl.scrollWidth > stageEl.clientWidth,
          pageWidth: pageEl.offsetWidth,
        };
      });
      expect(fitted).toEqual({
        inside: true,
        clearOfDock: true,
        scrolls: false,
        pageWidth,
      });
      await expect(page.locator("[data-slot=workbench-frame-tag]")).toHaveText(
        `Detail page · Start panel · ${pageWidth}px`,
      );
      // The zoom level is the frame's scale.
      const zoom = Number(await frame(page).getAttribute("data-zoom"));
      expect(zoom).toBeLessThanOrEqual(100);
      await expect(page.locator("[data-slot=workbench-zoom-level]")).toHaveText(
        `${zoom}%`,
      );
      const fitStates = await slotStates(page);

      // 100%: the frame is its real width, and the stage scrolls when it's wider.
      await page.getByRole("radio", { name: "100%" }).click();
      expect(urlQuery(page)).toContain("zoom=100");
      await expect(page.locator("[data-slot=workbench-zoom-level]")).toHaveText(
        "100%",
      );
      await expect
        .poll(async () => (await frame(page).boundingBox())?.width)
        .toBe(pageWidth);
      const scrolls = await stage(page).evaluate(
        (el) => el.scrollWidth > el.clientWidth,
      );
      expect(scrolls).toBe(true);
      await expect(page.locator("[data-slot=workbench-frame-tag]")).toHaveText(
        `Detail page · Start panel · ${pageWidth}px`,
      );
      // The template's rules see the same width at either zoom.
      expect(await slotStates(page)).toEqual(fitStates);
    });
