import { endPanelMaxWidth } from "@/templates/detail-page/detail-page.template";
import { expect, openPreview, test, widths } from "./fixtures";

/*
 * A hidden tab never runs requestAnimationFrame, and a slow load may render
 * before the template is measured. The layout can't depend on either.
 */

test("with requestAnimationFrame never firing, the handle still renders with its measured range", async ({
  page,
}) => {
  await page.addInitScript(() => {
    window.requestAnimationFrame = () => 0;
    window.cancelAnimationFrame = () => {
      // Nothing is ever scheduled.
    };
  });
  await page.goto("/preview/detail-page?panels=end");
  await page.locator("[data-slot=detail-page-resize-handle]").waitFor();
  const template = await page
    .locator("[data-template]")
    .evaluate((el) => el.getBoundingClientRect().width);
  await expect(
    page.locator("[data-slot=detail-page-resize-handle]"),
  ).toHaveAttribute("aria-valuemax", String(endPanelMaxWidth(template, false)));
});

const CASES: [number, string, boolean][] = [
  [1440, "?panels=end&end-width=max", false],
  [1440, "?end-width=max", false],
  [1920, "?panels=end&end-width=max", true],
  [1920, "?end-width=max", true],
  [1100, "?panels=end&end-width=max", true],
];

for (const [width, q, full] of CASES) {
  test(`unmeasured, "max" lays out by the grid alone (${width}${q})${full ? " @full" : ""}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      // Restored below with .call(this).
      // oxlint-disable-next-line typescript/unbound-method
      const original = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function () {
        return this.matches?.("[data-template]")
          ? new DOMRect(0, 0, 0, 0)
          : original.call(this);
      };
      window.ResizeObserver = class {
        observe() {
          // Measurement is blocked.
        }
        unobserve() {
          // Measurement is blocked.
        }
        disconnect() {
          // Measurement is blocked.
        }
      };
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/preview/detail-page${q}`);
    await page.locator("[data-template]").waitFor();
    await page.waitForLoadState("networkidle");
    const g = await page.evaluate(() => {
      const w = (s: string) => {
        const el = document.querySelector<HTMLElement>(s);
        return el && getComputedStyle(el).display !== "none"
          ? el.offsetWidth
          : 0;
      };
      return {
        template: w("[data-template]"),
        main: w("[data-slot=detail-page-main]"),
        endSlot: w("[data-slot=detail-page-end-panel]"),
        end: w("[data-surface=side-panel][data-side=end]"),
        start: w("[data-surface=side-panel][data-side=start]"),
        handle: Boolean(
          document.querySelector("[data-slot=detail-page-resize-handle]"),
        ),
      };
    });
    const shared = g.template - g.start;
    if (shared / 2 < 480) {
      expect([g.main, g.endSlot]).toEqual([480, shared - 480]);
    } else {
      expect(Math.abs(g.main - g.endSlot)).toBeLessThanOrEqual(1);
    }
    expect(g.end).toBe(g.endSlot);
    expect(g.handle).toBe(false);
  });
}

test('measured "max" matches what the grid laid out, so nothing jumps', async ({
  page,
}) => {
  await openPreview(page, "?panels=end&end-width=max");
  const end = (await widths(page)).end;
  const now = Number(
    await page
      .locator("[data-slot=detail-page-resize-handle]")
      .getAttribute("aria-valuenow"),
  );
  expect(Math.abs(now - end)).toBeLessThanOrEqual(1);
});
