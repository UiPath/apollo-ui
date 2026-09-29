import { test as base, expect, type Page } from "@playwright/test";

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
      await page.addInitScript((t) => localStorage.setItem("theme", t), theme);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await use(errors);
      expect(errors, "page errors").toEqual([]);
    },
    { auto: true },
  ],
});

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

export const search = (page: Page) => page.evaluate(() => location.search);
