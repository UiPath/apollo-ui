import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * The header's layout: the view switch on the header's own center, the
 * title's start and the theme and panel toggles staying put between
 * views, the title giving way first when room runs out, Sample and State
 * as selects, and the view's own controls swapping in place with a fade. The switch is the one
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

/** The switch's center, off the header's own, in px. */
const offCenter = (page: Page) =>
  header(page).evaluate((el) => {
    const bar = el.getBoundingClientRect();
    const found = el.querySelector("[data-slot=workbench-view-switch]");
    const box = found?.getBoundingClientRect();
    return box
      ? Math.abs(box.x + box.width / 2 - (bar.x + bar.width / 2))
      : Number.POSITIVE_INFINITY;
  });

// 1416px with the list open, and 1040px with it closed: the narrowest
// header that fits everything (the surface view's selects set it).
for (const [width, query] of [
  [1416, "?occupant=queue"],
  [1040, "?occupant=queue&list=closed"],
] as const) {
  test(`the switch sits on the header's center, and nothing moves between views, at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, query);
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    expect(await offCenter(page)).toBeLessThanOrEqual(0.5);
    const surface = await fixed(page);
    await view(page, "Template");
    expect(await offCenter(page)).toBeLessThanOrEqual(0.5);
    expect(await fixed(page)).toEqual(surface);
    // And back, with nothing moved.
    await view(page, "Surface");
    expect(await fixed(page)).toEqual(surface);
  });
}

test("Sample and State are selects at every width", async ({ page }) => {
  await open(page, "?occupant=queue");
  for (const width of [1920, 1416, 1040, 800]) {
    await page.setViewportSize({ width, height: 900 });
    await settle(page);
    for (const name of ["Sample", "State"])
      await expect(
        header(page).getByRole("combobox", { name }),
        `${name} at ${width}px`,
      ).toHaveCount(1);
    await expect(
      header(page).getByRole("radio", { name: "Primary" }),
    ).toHaveCount(0);
  }
});

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

test("short of room, the title truncates, then its badge goes, and nothing reaches the switch", async ({
  page,
}) => {
  await open(page, "?occupant=queue&view=template&list=closed");
  await page.evaluate(() => document.fonts.ready);
  const title = header(page).locator("h2");
  const badge = header(page).locator("[data-slot=workbench-header-badge]");
  const look = () =>
    header(page).evaluate((el) => {
      const heading = el.querySelector("h2");
      const start = el
        .querySelector("[data-slot=workbench-header-start]")
        ?.getBoundingClientRect();
      const end = el
        .querySelector("[data-slot=workbench-header-end]")
        ?.getBoundingClientRect();
      const middle = el
        .querySelector("[data-slot=workbench-view-switch]")
        ?.getBoundingClientRect();
      return {
        truncated: heading ? heading.scrollWidth > heading.clientWidth : false,
        clear:
          !!start &&
          !!end &&
          !!middle &&
          start.right <= middle.left + 0.5 &&
          end.left >= middle.right - 0.5,
      };
    });
  // Roomy: the full title and its badge.
  await page.setViewportSize({ width: 900, height: 900 });
  await settle(page);
  expect(await look()).toEqual({ truncated: false, clear: true });
  await expect(badge).toBeVisible();
  // Tighter: the title truncates first, and the badge stays.
  await page.setViewportSize({ width: 760, height: 900 });
  await settle(page);
  expect(await look()).toEqual({ truncated: true, clear: true });
  await expect(badge).toBeVisible();
  // Tighter still: the badge goes.
  await page.setViewportSize({ width: 640, height: 900 });
  await settle(page);
  await expect(badge).toBeHidden();
  expect((await look()).clear).toBe(true);
  // The full title is in a tooltip.
  await title.hover();
  await expect(page.getByRole("tooltip")).toHaveText("Detail page");
});

test("Preview and Edit carry icons like the switch's, and keep their words", async ({
  page,
}) => {
  await open(page, "?occupant=queue&view=template");
  await settle(page);
  const mode = page.locator("[data-slot=workbench-mode]");
  await expect(mode.getByRole("radio")).toHaveText(["Preview", "Edit"]);
  await expect(mode.locator("svg[aria-hidden=true]")).toHaveCount(2);
  // Sized and spaced like the view switch's.
  const measure = (selector: string) =>
    page.locator(selector).evaluate((el) => {
      const item = el.querySelector("[role=radio]");
      const icon = item?.querySelector("svg");
      const label = icon?.nextElementSibling;
      if (!item || !icon || !label) return null;
      const [box, glyph, text] = [item, icon, label].map((n) =>
        n.getBoundingClientRect(),
      );
      return {
        size: [glyph?.width, glyph?.height],
        gap: (text?.left ?? 0) - (glyph?.right ?? 0),
        inset: (glyph?.left ?? 0) - (box?.left ?? 0),
      };
    });
  expect(await measure("[data-slot=workbench-mode]")).toEqual(
    await measure("[data-slot=workbench-view-switch]"),
  );
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
