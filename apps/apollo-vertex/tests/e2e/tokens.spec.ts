import { LAYOUT_TOKENS } from "@/lib/composition";
import { expect, openPreview, test } from "./fixtures";

const read = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const style = (selector: string) =>
      getComputedStyle(document.querySelector(selector)!);
    const divider = (slot: string) =>
      getComputedStyle(
        document.querySelector(`[data-slot=detail-page-${slot}]`)!,
        "::after",
      ).boxShadow;
    return {
      pads: [
        style(
          "[data-surface=side-panel][data-side=start] > [data-slot=side-panel-body]",
        ).paddingLeft,
        style("[data-slot=content-area-body]").paddingTop,
        style("[data-slot=page-header]").paddingLeft,
      ],
      dividers: [
        divider("header"),
        divider("start-panel"),
        divider("end-panel"),
      ],
    };
  });

test("surfaces and dividers read the layout tokens", async ({ page }) => {
  await openPreview(page);
  let g = await read(page);
  expect(g.pads).toEqual(
    Array.from({ length: 3 }, () => `${LAYOUT_TOKENS.surfaceInset}px`),
  );

  // Overriding a token reaches every surface and divider.
  await page.evaluate(() => {
    document.documentElement.style.setProperty("--surface-inset", "32px");
    document.documentElement.style.setProperty("--slot-divider-width", "3px");
  });
  // PageHeader transitions its padding.
  await expect
    .poll(async () => (await read(page)).pads)
    .toEqual(["32px", "32px", "32px"]);
  g = await read(page);
  expect(g.dividers[0]).toContain(" 0px -3px 0px 0px inset");
  expect(g.dividers[1]).toContain(" -3px 0px 0px 0px inset");
  expect(g.dividers[2]).toContain(" 3px 0px 0px 0px inset");
});
