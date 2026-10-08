import type { Page } from "@playwright/test";
import { expect, openPreview, resize, test } from "./fixtures";

/** What useSurface() reports in each slot (via the placeholder), against the measured inner width. */
const read = (page: Page) =>
  page.evaluate(() => {
    const inner: Record<string, string> = {
      header: "[data-slot=detail-page-header] [data-slot=page-header]",
      "start-panel":
        "[data-slot=detail-page-start-panel] [data-slot=side-panel-body]",
      main: "[data-slot=detail-page-main] [data-slot=content-area-body]",
      "end-panel":
        "[data-slot=detail-page-end-panel] [data-slot=side-panel-body]",
    };
    const box = (el: Element) => {
      const s = getComputedStyle(el);
      return Math.round(
        el.getBoundingClientRect().width -
          Number.parseFloat(s.paddingLeft) -
          Number.parseFloat(s.paddingRight),
      );
    };
    return Object.fromEntries(
      Object.entries(inner).map(([slot, selector]) => {
        const el = document.querySelector(selector)!;
        const hint = document.querySelector(
          `[data-slot=detail-page-${slot}] [data-slot=placeholder-space]`,
        )!.textContent;
        const container =
          slot === "header" ? el.closest("[data-surface=page-header]")! : el;
        const [orientation, width] = hint.split(", ");
        return [
          slot,
          {
            orientation,
            width: Number.parseInt(width, 10),
            actual: box(el),
            container: getComputedStyle(container).containerType,
          },
        ];
      }),
    );
  });

async function check(page: Page) {
  const g = await read(page);
  for (const [slot, v] of Object.entries(g)) {
    expect(v.orientation, slot).toBe(
      slot === "header" ? "horizontal" : "vertical",
    );
    expect(v.width, slot).toBe(v.actual);
    expect(v.container, slot).toBe("inline-size");
  }
}

test("useSurface() reports each slot's orientation and live inner width", async ({
  page,
}) => {
  await openPreview(page);
  await check(page);
  await resize(page, 1200);
  await expect
    .poll(() => read(page).then((g) => g.main.width === g.main.actual))
    .toBe(true);
  await check(page);
  await page.locator("[data-part=resize-handle]").focus();
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowLeft");
  await expect
    .poll(() =>
      read(page).then((g) => g["end-panel"].width === g["end-panel"].actual),
    )
    .toBe(true);
  await check(page);
});
