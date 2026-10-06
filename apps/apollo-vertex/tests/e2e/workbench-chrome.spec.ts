import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * The workbench chrome keeps primary teal for the selected slot, focus
 * rings, and links. Segmented controls, other slots' labels, and where
 * an occupant is in the list are neutral, and meet WCAG AA in both
 * themes. The stage is a recessed canvas, with the page lifted off it.
 */

const QUERY =
  "?view=template&header-contents=stage-strip&start-panel-contents=participants~activity-timeline&start-panel-present=false&main-contents=queue&end-panel-contents=key-facts&mode=edit";

/** Colors and contrast, read in the page: each element's text over what's behind it. */
const read = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No 2D context");
    type Rgba = [number, number, number, number];
    const rgba = (color: string): Rgba => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0, a = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };
    const over = (top: Rgba, under: Rgba): Rgba => [
      top[0] * top[3] + under[0] * (1 - top[3]),
      top[1] * top[3] + under[1] * (1 - top[3]),
      top[2] * top[3] + under[2] * (1 - top[3]),
      1,
    ];
    const behind = (el: Element): Rgba => {
      const layers: Rgba[] = [];
      for (let at: Element | null = el; at; at = at.parentElement) {
        const color = rgba(getComputedStyle(at).backgroundColor);
        if (color[3] > 0) layers.push(color);
        if (color[3] === 1) break;
      }
      return layers
        .toReversed()
        .reduce((acc, layer) => over(layer, acc), [255, 255, 255, 1] as Rgba);
    };
    const luminance = ([r, g, b]: Rgba) => {
      const f = (v: number) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const contrast = (el: Element | null) => {
      if (!el) return 0;
      const ground = behind(el);
      const text = over(rgba(getComputedStyle(el).color), ground);
      const [hi, lo] = [luminance(text), luminance(ground)].toSorted(
        (a, b) => b - a,
      );
      return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
    };
    const probe = document.createElement("span");
    probe.style.color = "var(--primary)";
    document.querySelector("[data-slot=workbench]")?.append(probe);
    const primary = rgba(getComputedStyle(probe).color).join();
    probe.remove();
    const q = (selector: string) => document.querySelector(selector);
    const style = (selector: string) => {
      const el = q(selector);
      return el ? getComputedStyle(el) : null;
    };
    const is = (color: string | undefined) =>
      color ? rgba(color).join() === primary : false;
    const segment = "[data-slot=workbench-inspector] [role=radio]";
    const label = (slot: string) =>
      `[data-edit-slot=${slot}] [data-slot=workbench-edit-slot-label]`;
    const location = (hidden: boolean) =>
      [...document.querySelectorAll("[data-slot=workbench-location]")].find(
        (el) =>
          (el instanceof HTMLElement && "hidden" in el.dataset) === hidden,
      ) ?? null;
    return {
      selectedSegment: {
        teal:
          is(style(`${segment}[data-state=on]`)?.backgroundColor) ||
          is(style(`${segment}[data-state=on]`)?.color),
        weight: Number(style(`${segment}[data-state=on]`)?.fontWeight),
        otherWeight: Number(style(`${segment}[data-state=off]`)?.fontWeight),
        contrast: contrast(q(`${segment}[data-state=on]`)),
      },
      mode: {
        teal: is(
          style("[data-slot=workbench-mode] [data-state=on]")?.backgroundColor,
        ),
        contrast: contrast(q("[data-slot=workbench-mode] [data-state=on]")),
      },
      labels: {
        otherTeal: is(style(label("main"))?.backgroundColor),
        otherContrast: contrast(q(label("main"))),
        selectedTeal: is(style(label("end-panel"))?.backgroundColor),
        selectedContrast: contrast(q(label("end-panel"))),
      },
      outlines: {
        otherTeal: is(style("[data-edit-slot=main]")?.outlineColor),
        selectedTeal: is(style("[data-edit-slot=end-panel]")?.outlineColor),
        selectedFill: rgba(
          style("[data-edit-slot=end-panel]")?.backgroundColor ?? "transparent",
        )[3],
      },
      location: {
        teal: is(style("[data-slot=workbench-location]")?.color),
        shown: contrast(location(false)),
        hidden: contrast(location(true)),
        mutedApart:
          style("[data-slot=workbench-location]:not([data-hidden])")?.color !==
          style("[data-slot=workbench-location][data-hidden]")?.color,
      },
      canvas: {
        chrome: luminance(
          behind(q("[data-slot=workbench-header]") ?? document.body),
        ),
        stage: luminance(
          behind(q("[data-slot=workbench-stage]") ?? document.body),
        ),
        frameShadow: style("[data-slot=workbench-frame]")?.boxShadow ?? "none",
      },
    };
  });

for (const theme of ["light", "dark"] as const) {
  test(`teal is the selected slot's only, and the chrome meets AA, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await open(page, `${QUERY}&theme=${theme}`);
    await page.locator("[data-edit-slot=end-panel]").click();
    await page.mouse.move(0, 700);
    await settle(page);
    const seen = await read(page);
    // A chosen segment: neutral, with heavier text, so it reads without color.
    expect(seen.selectedSegment.teal).toBe(false);
    expect(seen.selectedSegment.weight).toBeGreaterThan(
      seen.selectedSegment.otherWeight,
    );
    expect(seen.mode.teal).toBe(false);
    // Only the selected slot's label and outline are teal; it has no tint.
    expect(seen.labels).toMatchObject({ otherTeal: false, selectedTeal: true });
    expect(seen.outlines).toMatchObject({
      otherTeal: false,
      selectedTeal: true,
      selectedFill: 0,
    });
    // Where an occupant is: secondary text, muted when its slot is hidden.
    expect(seen.location.teal).toBe(false);
    expect(seen.location.mutedApart).toBe(true);
    for (const ratio of [
      seen.selectedSegment.contrast,
      seen.mode.contrast,
      seen.labels.otherContrast,
      seen.labels.selectedContrast,
      seen.location.shown,
      seen.location.hidden,
    ])
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    // The canvas is a step darker than the chrome; the page is lifted off it.
    expect(seen.canvas.stage).toBeLessThan(seen.canvas.chrome);
    expect(seen.canvas.frameShadow).not.toBe("none");
  });
}

test("the surface view uses the same canvas", async ({ page }) => {
  await open(page, "?occupant=queue");
  await page
    .locator("[data-slot=workbench-stage] [data-occupant]")
    .first()
    .waitFor();
  const [stage, chrome] = await Promise.all(
    ["[data-slot=workbench-stage]", "[data-slot=workbench]"].map((selector) =>
      page
        .locator(selector)
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ),
  );
  expect(stage).not.toBe(chrome);
  expect(stage).not.toBe("rgba(0, 0, 0, 0)");
});

for (const theme of ["light", "dark"] as const) {
  test(`the frame is borderless, rounded, and clipped; the dots read but stay quiet, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1600, height: 1000 });
    await open(
      page,
      `?view=template&end-panel-contents=queue&mode=edit&theme=${theme}`,
    );
    await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
    await settle(page);
    const seen = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No 2D context");
      const rgb = (color: string, under = "#fff") => {
        ctx.fillStyle = under;
        ctx.fillRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
      };
      const luminance = (c: number[]) => {
        const [r = 0, g = 0, b = 0] = c.map((v) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const ratio = (a: number[], b: number[]) => {
        const [hi = 0, lo = 0] = [luminance(a), luminance(b)].toSorted(
          (x, y) => y - x,
        );
        return (hi + 0.05) / (lo + 0.05);
      };
      const root = document.querySelector("[data-slot=workbench]");
      const token = (name: string, property: "color" | "borderRadius") => {
        const probe = document.createElement("span");
        probe.style[property] = `var(${name})`;
        root?.append(probe);
        const value = getComputedStyle(probe)[property];
        probe.remove();
        return value;
      };
      const frame = document.querySelector("[data-slot=workbench-frame]");
      const clip = document.querySelector("[data-slot=workbench-frame-clip]");
      const slot = document.querySelector("[data-edit-slot=main]");
      if (!frame || !clip || !slot) throw new Error("No frame");
      const frameStyle = getComputedStyle(frame);
      const clipStyle = getComputedStyle(clip);
      const ground = rgb(clipStyle.backgroundColor);
      const canvasColor = rgb(token("--workbench-canvas", "color"));
      return {
        border: [frameStyle.borderTopWidth, frameStyle.outlineStyle],
        radius: [frameStyle.borderRadius, clipStyle.borderRadius],
        cardRadius: token("--radius-xl", "borderRadius"),
        clips: clipStyle.overflow,
        lifted: frameStyle.boxShadow !== "none",
        frameOnCanvas: ratio(ground, canvasColor),
        dots: ratio(rgb(token("--workbench-dots", "color")), canvasColor),
        outline: ratio(
          rgb(getComputedStyle(slot).outlineColor, clipStyle.backgroundColor),
          ground,
        ),
      };
    });
    // No border; the card's radius, on the frame and its clip.
    expect(seen.border).toEqual(["0px", "none"]);
    expect(seen.radius).toEqual([seen.cardRadius, seen.cardRadius]);
    expect(seen.clips).toBe("hidden");
    // Apart from the canvas by its shade and a lift.
    expect(seen.lifted).toBe(true);
    expect(seen.frameOnCanvas).toBeGreaterThan(1.05);
    // The dots read as a grid, and stay quieter than a slot's outline.
    expect(seen.dots).toBeGreaterThan(1.25);
    expect(seen.dots).toBeLessThan(seen.outline);
  });
}
