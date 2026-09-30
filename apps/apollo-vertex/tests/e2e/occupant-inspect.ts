import type { Page } from "@playwright/test";
import { SURFACE_HOSTS } from "@/app/_components/surface-hosts";
import { overflowProblems } from "@/lib/overflow-problems";

/*
 * Shared by the occupant checks and measure:occupant: open an occupant in the
 * fixture, set its surface's width, and list every clip or overflow, with
 * the same rules as the occupant workbench.
 */

export async function openFixture(page: Page, query: string) {
  await page.goto(`/preview/occupant?${query}`);
  await page
    .locator("[data-slot=occupant-fixture] [data-occupant]")
    .first()
    .waitFor();
  await page.waitForLoadState("networkidle");
}

/**
 * Sets the fixture's outer width, waits `settle` ms (the checks) or two
 * animation frames (0, measuring), and returns the occupant's inner width
 * and every clip or overflow inside the surface.
 */
export async function inspect(
  page: Page,
  surface: string,
  width: number,
  settle = 200,
) {
  await page.evaluate(
    ([boxWidth, wait]) => {
      const fixture = document.querySelector<HTMLElement>(
        "[data-slot=occupant-fixture]",
      )!;
      fixture.style.width = `${boxWidth}px`;
      return new Promise<void>((resolve) => {
        if (wait > 0) setTimeout(resolve, wait);
        else
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              resolve();
            });
          });
      });
    },
    [width, settle] as const,
  );
  const box = page
    .locator(`[data-slot=occupant-fixture] ${SURFACE_HOSTS[surface]?.inner}`)
    .first();
  return {
    occupantWidth: await box.evaluate((el) => {
      const style = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return Math.round(
        r.width -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight),
      );
    }),
    problems: await box.evaluate(overflowProblems),
  };
}
