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
  await page.locator("[data-part=resize-handle]").waitFor();
  const template = await page
    .locator("[data-template]")
    .evaluate((el) => el.getBoundingClientRect().width);
  await expect(page.locator("[data-part=resize-handle]")).toHaveAttribute(
    "aria-valuemax",
    String(endPanelMaxWidth(template, false)),
  );
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
      // The template's first read is its offsetWidth: block that too. The
      // checks below read the template's width as clientWidth instead.
      const offsetWidth = Object.getOwnPropertyDescriptor(
        HTMLElement.prototype,
        "offsetWidth",
      );
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
        configurable: true,
        get(this: HTMLElement) {
          return this.matches("[data-template]")
            ? 0
            : Number(offsetWidth?.get?.call(this) ?? 0);
        },
      });
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
    await openPreview(page, q, width);
    const g = await page.evaluate(() => {
      const w = (s: string) => {
        const el = document.querySelector<HTMLElement>(s);
        if (!el || getComputedStyle(el).display === "none") return 0;
        // The template has no border, so its clientWidth is its width.
        return el.matches("[data-template]") ? el.clientWidth : el.offsetWidth;
      };
      return {
        template: w("[data-template]"),
        main: w("[data-slot=detail-page-main]"),
        endSlot: w("[data-slot=detail-page-end-panel]"),
        end: w("[data-surface=side-panel][data-side=end]"),
        start: w("[data-surface=side-panel][data-side=start]"),
        handle: Boolean(document.querySelector("[data-part=resize-handle]")),
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
      .locator("[data-part=resize-handle]")
      .getAttribute("aria-valuenow"),
  );
  expect(Math.abs(now - end)).toBeLessThanOrEqual(1);
});

test("the handle's range is measured from the moment it's in the document", async ({
  page,
}) => {
  await page.goto("/preview/detail-page?panels=end", {
    waitUntil: "domcontentloaded",
  });
  const seen = await page.evaluate(
    () =>
      new Promise<{ max: number; template: number }>((resolve) => {
        const check = () => {
          const handle = document.querySelector("[data-part=resize-handle]");
          const template =
            document.querySelector<HTMLElement>("[data-template]");
          if (!handle?.isConnected || !template?.offsetWidth) return false;
          resolve({
            max: Number(handle.getAttribute("aria-valuemax")),
            template: template.getBoundingClientRect().width,
          });
          return true;
        };
        if (check()) return;
        const observer = new MutationObserver(
          () => check() && observer.disconnect(),
        );
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
        });
      }),
  );
  expect(seen.max).toBe(endPanelMaxWidth(seen.template, false));
});
