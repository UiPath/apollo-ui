import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * The header's stable layout: the view switch, the title's start, and the
 * theme and panel toggles stay put between views at every width, and the
 * view's own controls swap in place with a fade. The switch is the one
 * inverted control, and meets WCAG AA in both themes.
 */

const header = (page: Page) => page.locator("[data-slot=workbench-header]");
const viewSwitch = (page: Page) =>
  page.locator("[data-slot=workbench-view-switch]");

/** Where the fixed parts sit, to the subpixel. */
const fixed = (page: Page) =>
  header(page).evaluate((el) => {
    const at = (selector: string) => {
      const found = el.querySelector(selector);
      if (!found) return null;
      const box = found.getBoundingClientRect();
      return [box.x, box.y, box.width, box.height];
    };
    return {
      switch: at("[data-slot=workbench-view-switch]"),
      title: at("h2")?.slice(0, 2),
      theme: at("[aria-label='Dark theme']"),
      panel: at(
        "[aria-controls=workbench-details], [aria-controls=workbench-inspector]",
      ),
    };
  });

async function view(page: Page, name: "Surface" | "Template") {
  await viewSwitch(page).getByRole("radio", { name }).click();
  await expect(viewSwitch(page).getByRole("radio", { name })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await settle(page);
}

// 1416px; where Sample and State collapse to selects with the list open
// (1540px); and just wide enough for their toggle groups (1542px).
for (const [width, compact] of [
  [1416, true],
  [1540, true],
  [1542, false],
] as const) {
  test(`the switch, title, and icons don't move between views at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "?occupant=queue");
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    await expect(header(page)).toHaveAttribute("data-compact", String(compact));
    const surface = await fixed(page);
    await view(page, "Template");
    const template = await fixed(page);
    expect(template).toEqual(surface);
    // And back, with nothing moved.
    await view(page, "Surface");
    expect(await fixed(page)).toEqual(surface);
  });
}

test("the view's controls swap in place: Reset keeps its room, and they fade", async ({
  page,
}) => {
  // The suite reduces motion; this one checks the fade itself.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1416, height: 900 });
  await open(page, "?occupant=queue&view=template");
  const zone = page.locator("[data-slot=workbench-header-zone]");
  const mode = page.locator("[data-slot=workbench-mode]");
  await settle(page);
  // Measured from the theme toggle: Edit opens the inspector, which
  // narrows the header, and the zone keeps to its right edge.
  const theme = page.getByRole("button", { name: "Dark theme" });
  const offset = async () => {
    const [box, edge] = await Promise.all([
      mode.boundingBox(),
      theme.boundingBox(),
    ]);
    return {
      gap: (edge?.x ?? 0) - (box?.x ?? 0),
      width: box?.width,
    };
  };
  const before = await offset();
  await mode.getByRole("radio", { name: "Edit" }).click();
  await expect(
    page.getByRole("button", { name: "Reset layout" }),
  ).toBeVisible();
  await settle(page);
  // Reset appears in its kept room: Preview | Edit doesn't slide.
  expect(await offset()).toEqual(before);
  // A new view's controls fade in, on the workbench's motion tokens.
  const animation = () =>
    zone.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        name: style.animationName,
        duration: style.animationDuration,
      };
    });
  await view(page, "Surface");
  expect(await animation()).toEqual({ name: "enter", duration: "0.35s" });
});

test("on a narrow header, the switch drops its icons and the header still fits", async ({
  page,
}) => {
  // The list and the inspector both open: the header is about 516px.
  await page.setViewportSize({ width: 1100, height: 900 });
  await open(page, "?occupant=queue&view=template&mode=edit");
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  await expect(viewSwitch(page).locator("svg").first()).toBeHidden();
  await expect(viewSwitch(page).getByRole("radio")).toHaveText([
    "Surface",
    "Template",
  ]);
  const fits = await header(page).evaluate(
    (el) => el.scrollWidth <= el.clientWidth,
  );
  expect(fits).toBe(true);
  await expect(
    page.getByRole("button", { name: "Hide inspector" }),
  ).toBeInViewport();
});

test("with reduced motion, the controls swap with no fade", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "?occupant=queue&view=template");
  await view(page, "Surface");
  expect(
    await page
      .locator("[data-slot=workbench-header-zone]")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});

/** The switch's chosen segment, inverted: its colors, weight, and contrast. */
const segments = (page: Page) =>
  page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No 2D context");
    // Over the chrome's ground, so a transparent fill reads as it shows.
    const ground = getComputedStyle(
      document.querySelector("[data-slot=workbench]") ?? document.body,
    ).backgroundColor;
    const rgb = (color: string) => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b];
    };
    const token = (name: string) => {
      const probe = document.createElement("span");
      probe.style.color = `var(${name})`;
      document.querySelector("[data-slot=workbench]")?.append(probe);
      const color = rgb(getComputedStyle(probe).color).join();
      probe.remove();
      return color;
    };
    const luminance = (color: string) => {
      const [r = 0, g = 0, b = 0] = rgb(color).map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const read = (selector: string) => {
      const el = document.querySelector(selector);
      const style = el ? getComputedStyle(el) : null;
      const fill = style?.backgroundColor ?? "transparent";
      const text = style?.color ?? "transparent";
      const [hi, lo] = [luminance(text), luminance(fill)].toSorted(
        (a, b) => b - a,
      );
      return {
        fill: rgb(fill).join(),
        text: rgb(text).join(),
        weight: Number(style?.fontWeight),
        contrast: ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05),
      };
    };
    return {
      foreground: token("--foreground"),
      background: token("--background"),
      primary: token("--primary"),
      on: read("[data-slot=workbench-view-switch] [data-state=on]"),
      off: read("[data-slot=workbench-view-switch] [data-state=off]"),
      mode: read("[data-slot=workbench-mode] [data-state=on]"),
    };
  });

for (const theme of ["light", "dark"] as const) {
  test(`the view switch is the one inverted control, ${theme}`, async ({
    page,
  }) => {
    await open(page, `?occupant=queue&view=template&theme=${theme}`);
    await settle(page);
    // The theme applies after mount, and the toggle's colors ease into it.
    await page
      .locator("[data-slot=workbench-view-switch] [data-state=on]")
      .evaluate((el) =>
        Promise.all(el.getAnimations().map((animation) => animation.finished)),
      );
    const seen = await segments(page);
    // Inverted: the text color as the fill, the surface color as the label.
    expect(seen.on.fill).toBe(seen.foreground);
    expect(seen.on.text).toBe(seen.background);
    expect(seen.on.fill).not.toBe(seen.primary);
    // Clear without color: a fill opposite the others', and heavier text.
    expect(seen.on.weight).toBeGreaterThan(seen.off.weight);
    expect(seen.on.contrast).toBeGreaterThanOrEqual(4.5);
    expect(seen.off.contrast).toBeGreaterThanOrEqual(4.5);
    // Preview | Edit keeps the neutral selected style.
    expect(seen.mode.fill).not.toBe(seen.foreground);
    expect(seen.mode.contrast).toBeGreaterThanOrEqual(4.5);
    // Each segment keeps its words; its icon is decorative.
    await expect(viewSwitch(page).getByRole("radio")).toHaveText([
      "Surface",
      "Template",
    ]);
    for (const name of ["Surface", "Template"])
      await expect(
        viewSwitch(page).getByRole("radio", { name, exact: true }),
      ).toHaveCount(1);
    await expect(viewSwitch(page).locator("svg[aria-hidden=true]")).toHaveCount(
      2,
    );
  });
}
