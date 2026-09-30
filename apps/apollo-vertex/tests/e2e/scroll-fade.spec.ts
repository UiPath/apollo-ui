import type { Page } from "@playwright/test";
import {
  colorDistance as distance,
  expect,
  FADE,
  pixel,
  scrollTo as scrollElement,
  settle,
  test,
} from "./fixtures";

/*
 * useScrollFade on each axis, on the preview fixture at /preview/scroll-fade:
 * three 192px boxes of solid content, scrolling on y, x, and both.
 */

const box = (axis: string) => `[data-axis=${axis}]`;

const fades = (page: Page, axis: string) =>
  page.locator(box(axis)).evaluate((el) => {
    const read = (edge: string) =>
      el.style.getPropertyValue(`--scroll-fade-${edge}`);
    const style = getComputedStyle(el);
    return {
      top: read("top"),
      bottom: read("bottom"),
      left: read("left"),
      right: read("right"),
      mask: style.maskImage,
      composite: style.maskComposite,
    };
  });

const scrollTo = (
  page: Page,
  axis: string,
  position: Parameters<typeof scrollElement>[2],
) => scrollElement(page, box(axis), position);

test.beforeEach(async ({ page }) => {
  await page.goto("/preview/scroll-fade");
  await page.locator(box("both")).waitFor();
  await settle(page);
});

test("x: each side fades while there's more content that way, growing with the distance", async ({
  page,
}) => {
  let g = await fades(page, "x");
  expect([g.left, g.right]).toEqual(["0px", FADE]);
  // The x axis leaves the vertical fades alone.
  expect([g.top, g.bottom]).toEqual(["", ""]);
  expect(g.mask).toContain("linear-gradient(to right");
  await scrollTo(page, "x", { left: 10 });
  expect((await fades(page, "x")).left).toBe("10px");
  await scrollTo(page, "x", { left: 300 });
  g = await fades(page, "x");
  expect([g.left, g.right]).toEqual([FADE, FADE]);
  await scrollTo(page, "x", { left: "end" });
  g = await fades(page, "x");
  expect([g.left, g.right]).toEqual([FADE, "0px"]);
});

test("x in right-to-left: the fades follow where the content remains", async ({
  page,
}) => {
  await page.locator(box("x")).evaluate((el: HTMLElement) => {
    el.dir = "rtl";
    el.scrollLeft = 0;
    el.dispatchEvent(new Event("scroll"));
  });
  await settle(page);
  // RTL content starts at the right, so the left side has more.
  let g = await fades(page, "x");
  expect([g.left, g.right]).toEqual([FADE, "0px"]);
  await scrollTo(page, "x", { left: -10 });
  g = await fades(page, "x");
  expect(g.right).toBe("10px");
});

test("both: all four edges track, and the masks intersect", async ({
  page,
}) => {
  let g = await fades(page, "both");
  expect([g.top, g.bottom, g.left, g.right]).toEqual([
    "0px",
    FADE,
    "0px",
    FADE,
  ]);
  // Reported per mask layer.
  expect(g.composite.split(", ").every((c) => c === "intersect")).toBe(true);
  // Two gradients: vertical (the default direction, so unnamed), then "to right".
  expect(g.mask.match(/linear-gradient\(/g)).toHaveLength(2);
  expect(g.mask).toContain("linear-gradient(to right");
  await scrollTo(page, "both", { left: 300, top: 300 });
  g = await fades(page, "both");
  expect([g.top, g.bottom, g.left, g.right]).toEqual([FADE, FADE, FADE, FADE]);

  // Intersected, the left edge fades even where the vertical mask is fully
  // opaque. With the default "add", the vertical mask would keep it solid.
  const r = (await page.locator(box("both")).boundingBox())!;
  const background = await pixel(
    page,
    Math.round(r.x - 4),
    Math.round(r.y + r.height / 2),
  );
  const middle = await pixel(
    page,
    Math.round(r.x + r.width / 2),
    Math.round(r.y + r.height / 2),
  );
  const leftEdge = await pixel(
    page,
    Math.round(r.x + 1),
    Math.round(r.y + r.height / 2),
  );
  expect(distance(middle, background)).toBeGreaterThan(40);
  expect(distance(leftEdge, background)).toBeLessThan(
    distance(leftEdge, middle),
  );
});
