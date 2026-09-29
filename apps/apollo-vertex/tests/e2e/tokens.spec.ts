import { LAYOUT_TOKENS } from "@/lib/composition";
import {
  END_PANEL_WIDTH,
  MAIN_MIN_OUTER_PX,
  START_PANEL_WIDTH,
} from "@/templates/detail-page/detail-page.template";
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
    const template = document.querySelector<HTMLElement>("[data-template]")!;
    return {
      pads: [
        style(
          "[data-surface=side-panel][data-side=start] > [data-slot=side-panel-body]",
        ).paddingLeft,
        style("[data-surface=content-area]").paddingTop,
        style("[data-slot=page-header]").paddingLeft,
      ],
      dividers: [
        divider("header"),
        divider("start-panel"),
        divider("end-panel"),
      ],
      vars: Object.fromEntries(
        [
          "--detail-page-start-panel-width",
          "--detail-page-start-panel-width-min",
          "--detail-page-start-panel-width-max",
          "--detail-page-end-panel-width",
          "--detail-page-end-panel-width-min",
          "--detail-page-main-width-min",
        ].map((name) => [name, template.style.getPropertyValue(name)]),
      ),
    };
  });

test("surfaces and dividers read the layout tokens, and the template sets its widths from its spec", async ({
  page,
}) => {
  await openPreview(page);
  let g = await read(page);
  expect(g.pads).toEqual(
    Array.from({ length: 3 }, () => `${LAYOUT_TOKENS.surfaceInset}px`),
  );
  expect(g.vars).toEqual({
    "--detail-page-start-panel-width": `${START_PANEL_WIDTH.default}px`,
    "--detail-page-start-panel-width-min": `${START_PANEL_WIDTH.min}px`,
    "--detail-page-start-panel-width-max": `${START_PANEL_WIDTH.max}px`,
    "--detail-page-end-panel-width": `${END_PANEL_WIDTH.default}px`,
    "--detail-page-end-panel-width-min": `${END_PANEL_WIDTH.min}px`,
    "--detail-page-main-width-min": `${MAIN_MIN_OUTER_PX}px`,
  });

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

test("a side panel outside a slot takes --side-panel-width-min", async ({
  page,
}) => {
  await openPreview(page);
  const width = await page.evaluate(() => {
    const aside = document.createElement("aside");
    aside.className = document.querySelector(
      "[data-surface=side-panel]",
    )!.className;
    document.body.append(aside);
    document.documentElement.style.setProperty(
      "--side-panel-width-min",
      "300px",
    );
    const w = aside.getBoundingClientRect().width;
    aside.remove();
    document.documentElement.style.removeProperty("--side-panel-width-min");
    return w;
  });
  expect(width).toBe(300);
  expect(LAYOUT_TOKENS.sidePanelWidthMin).not.toBe(300);
});
