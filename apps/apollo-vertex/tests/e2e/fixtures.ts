import { test as base, expect, type Page } from "@playwright/test";
import { LAYOUT_TOKENS } from "@/lib/composition";

export { expect };

export type Theme = "light" | "dark";

interface Options {
  /** Applied before the page loads, so the first paint is in this theme. */
  theme: Theme;
}

/**
 * The shared test: a theme option, and a check after every test that the
 * page threw no errors.
 */
export const test = base.extend<Options & { pageErrors: string[] }>({
  theme: ["light", { option: true }],
  colorScheme: async ({ theme }, use) => {
    await use(theme);
  },
  pageErrors: [
    async ({ page, theme }, use) => {
      await seedTheme(page, theme);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "page errors").toEqual([]);
    },
    { auto: true },
  ],
});

/** Sets the site theme before the page's first script runs. */
export const seedTheme = (page: Page, theme: Theme) =>
  page.addInitScript((t) => localStorage.setItem("theme", t), theme);

export const PREVIEW = "/preview/detail-page";

/** Two animation frames: long enough for ResizeObserver and React to settle. */
export const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );

/** Opens the preview with the given query and waits for its first layout. */
export async function openPreview(page: Page, query = "", width?: number) {
  if (width) await page.setViewportSize({ width, height: 900 });
  await page.goto(PREVIEW + query);
  await page.locator("[data-template]").waitFor();
  await page.waitForLoadState("networkidle");
  await settle(page);
}

export async function resize(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await settle(page);
  await settle(page);
}

export async function openCard(page: Page) {
  await page.getByRole("button", { name: "Configure" }).click();
  await expect(page.locator("#detail-page-preview-config")).toBeVisible();
}

/** Picks an option in one of the card's toggle groups. */
export async function pick(page: Page, group: string, option: string) {
  const radio = page
    .getByRole("group", { name: group, exact: true })
    .getByRole("radio", { name: option, exact: true });
  if ((await radio.getAttribute("data-state")) !== "on") await radio.click();
  await expect(radio).toHaveAttribute("data-state", "on");
  await settle(page);
}

/** Open or closed, per side panel, from the surfaces' data-state. */
export const panelStates = (page: Page) =>
  page.evaluate(() => {
    const state = (side: string) =>
      document.querySelector<HTMLElement>(
        `[data-surface=side-panel][data-side=${side}]`,
      )?.dataset.state ?? null;
    return { start: state("start"), end: state("end") };
  });

/** Rounded rendered widths of the template, both panels, and main. */
export const widths = (page: Page) =>
  page.evaluate(() => {
    const width = (selector: string) => {
      const el = document.querySelector(selector);
      if (!el) return 0;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return 0;
      return Math.round(el.getBoundingClientRect().width);
    };
    return {
      template: width("[data-template]"),
      start: width("[data-surface=side-panel][data-side=start]"),
      end: width("[data-surface=side-panel][data-side=end]"),
      main: width("[data-slot=detail-page-main]"),
    };
  });

/** The rounded width a side panel gives its occupant. */
export const occupantWidth = (page: Page, side: "start" | "end") =>
  page
    .locator(`[data-surface=side-panel][data-side=${side}] [data-occupant]`)
    .evaluate((el) => Math.round(el.getBoundingClientRect().width));

export const search = (page: Page) => page.evaluate(() => location.search);

/** One screen pixel's colour, read from a 1x1 screenshot. */
export const pixel = async (page: Page, x: number, y: number) => {
  const png = await page.screenshot({ clip: { x, y, width: 1, height: 1 } });
  // A 1x1 PNG decodes to a single pixel: draw it and read it back.
  return page.evaluate(async (data) => {
    const img = new Image();
    img.src = `data:image/png;base64,${data}`;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(0, 0, 1, 1).data.slice(0, 3));
  }, png.toString("base64"));
};

/** A computed colour's alpha, 0 to 1. */
export const alphaOf = (color: string) => {
  if (color === "rgba(0, 0, 0, 0)" || color === "transparent") return 0;
  const m =
    color.match(/\/\s*([\d.]+)\)/) ?? color.match(/rgba\([^)]*,\s*([\d.]+)\)/);
  return m ? Number(m[1]) : 1;
};

/** How far apart two RGB colours are. */
export const colorDistance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((v, i) => v - (b[i] ?? 0)));

/** A scroll fade at full size. */
export const FADE = `${LAYOUT_TOKENS.scrollFadeSize}px`;

/** Scrolls an element to a position ("end" for the far end), then settles. */
export async function scrollTo(
  page: Page,
  selector: string,
  position: { left?: number | "end"; top?: number | "end" },
) {
  await page.locator(selector).evaluate((el, { left = null, top = null }) => {
    if (left !== null) el.scrollLeft = left === "end" ? el.scrollWidth : left;
    if (top !== null) el.scrollTop = top === "end" ? el.scrollHeight : top;
  }, position);
  await settle(page);
}
