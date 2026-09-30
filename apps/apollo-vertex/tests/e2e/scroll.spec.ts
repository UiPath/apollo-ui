import type { Page } from "@playwright/test";
import { LAYOUT_TOKENS } from "@/lib/composition";
import {
  expect,
  FADE,
  openPreview,
  scrollTo as scrollElement,
  test,
  type Theme,
} from "./fixtures";

const SURFACES = {
  start:
    "[data-surface=side-panel][data-side=start] > [data-slot=side-panel-body]",
  end: "[data-surface=side-panel][data-side=end] > [data-slot=side-panel-body]",
  main: "[data-slot=content-area-body]",
};
const LONG =
  "start-panel-content=long&main-content=long&end-panel-content=long";

const info = (page: Page, selector: string) =>
  page.evaluate((s) => {
    const el = document.querySelector<HTMLElement>(s)!;
    const style = getComputedStyle(el);
    return {
      scrolls: el.scrollHeight > el.clientHeight,
      overflow: style.overflowY,
      mask: style.maskImage,
      padding: style.paddingTop,
      top: el.style.getPropertyValue("--scroll-fade-top"),
      bottom: el.style.getPropertyValue("--scroll-fade-bottom"),
      transition: style.transitionDuration,
    };
  }, selector);
const scrollTo = (page: Page, selector: string, top: number | "end") =>
  scrollElement(page, selector, { top });
const others = (page: Page) =>
  page.evaluate(() => ({
    start: document.querySelector(
      "[data-surface=side-panel][data-side=start] > [data-slot=side-panel-body]",
    )?.scrollTop,
    end: document.querySelector(
      "[data-surface=side-panel][data-side=end] > [data-slot=side-panel-body]",
    )?.scrollTop,
    header: JSON.stringify(
      document
        .querySelector("[data-surface=page-header]")!
        .getBoundingClientRect(),
    ),
    template: JSON.stringify(
      document.querySelector("[data-template]")!.getBoundingClientRect(),
    ),
    windowY: window.scrollY,
  }));

async function checkFades(page: Page, padding: string) {
  for (const [name, selector] of Object.entries(SURFACES)) {
    let g = await info(page, selector);
    expect(
      g.scrolls && g.overflow === "auto" && g.mask.includes("linear-gradient"),
      `${name} is a masked scroll container`,
    ).toBe(true);
    expect(g.padding).toBe(padding);
    expect([g.top, g.bottom], `${name} at the top`).toEqual(["0px", FADE]);
    await scrollTo(page, selector, 10);
    expect(
      (await info(page, selector)).top,
      `${name} fade grows with scroll`,
    ).toBe("10px");
    const before = await others(page);
    await scrollTo(page, selector, 300);
    g = await info(page, selector);
    expect([g.top, g.bottom], `${name} in the middle`).toEqual([FADE, FADE]);
    const after = await others(page);
    // Each surface scrolls on its own.
    expect(after.header).toBe(before.header);
    expect(after.template).toBe(before.template);
    expect(after.windowY).toBe(0);
    if (name !== "start") expect(after.start).toBe(before.start);
    if (name !== "end") expect(after.end).toBe(before.end);
    const underFade = await page.evaluate((s) => {
      const el = document.querySelector(s)!;
      const top = el.getBoundingClientRect().top;
      return [
        ...el.querySelectorAll(
          "[data-slot=placeholder-row],[data-slot=placeholder-label]",
        ),
      ].some((row) => {
        const r = row.getBoundingClientRect();
        return r.top < top + 2 && r.bottom > top;
      });
    }, selector);
    expect(
      underFade,
      `${name} content scrolls under the fade to the edge`,
    ).toBe(true);
    await scrollTo(page, selector, "end");
    g = await info(page, selector);
    expect([g.top, g.bottom], `${name} at the end`).toEqual([FADE, "0px"]);
  }
}

for (const theme of ["light", "dark"] as Theme[])
  for (const place of ["below-header", "beside-header"] as const)
    for (const pad of ["padded", "flush"] as const) {
      const core =
        theme === "light" && (place === "below-header" || pad === "padded");
      test.describe(`${theme}, ${place}, ${pad}${core ? "" : " @full"}`, () => {
        test.use({ theme });
        test("fades show only where there's more to scroll", async ({
          page,
        }) => {
          const flush =
            pad === "flush"
              ? "&start-panel-padding=flush&main-padding=flush&end-panel-padding=flush"
              : "";
          await openPreview(
            page,
            `?start=${place}&end=${place}${flush}&${LONG}`,
          );
          await checkFades(
            page,
            pad === "padded" ? `${LAYOUT_TOKENS.surfaceInset}px` : "0px",
          );
          if (place === "beside-header") {
            // The mask fades content, never the panel's tint.
            const asideMask = await page
              .locator("[data-surface=side-panel][data-side=start]")
              .evaluate((el) => getComputedStyle(el).maskImage);
            expect(asideMask).toBe("none");
          }
        });
      });
    }

test("short content: no fades", async ({ page }) => {
  await openPreview(page);
  for (const selector of Object.values(SURFACES)) {
    const g = await info(page, selector);
    expect([g.scrolls, g.top, g.bottom]).toEqual([false, "0px", "0px"]);
  }
});

test("an occupant that owns scrolling: the surface neither scrolls nor fades", async ({
  page,
}) => {
  await openPreview(
    page,
    `?${LONG}&start-panel-scroll=occupant&main-scroll=occupant&end-panel-scroll=occupant`,
  );
  for (const selector of Object.values(SURFACES)) {
    const g = await info(page, selector);
    expect([g.overflow, g.mask, g.top]).toEqual(["hidden", "none", ""]);
    const owner = await page.evaluate(
      (s) =>
        document.querySelector(s)!.closest<HTMLElement>("[data-surface]")!
          .dataset.scroll,
      selector,
    );
    expect(owner).toBe("occupant");
    const occupant = await page.evaluate((s) => {
      const el = document
        .querySelector(s)!
        .querySelector<HTMLElement>("[data-occupant]")!;
      const label = () =>
        el
          .querySelector("[data-slot=placeholder-label]")!
          .getBoundingClientRect().top;
      const before = label();
      el.scrollTop = 200;
      return {
        scrolls: el.scrollHeight > el.clientHeight,
        moved: el.scrollTop,
        sticky: Math.abs(label() - before) < 1,
      };
    }, selector);
    expect(occupant).toEqual({ scrolls: true, moved: 200, sticky: true });
  }
});

test("the page header never scrolls, and fades don't animate", async ({
  page,
}) => {
  await openPreview(page, `?${LONG}`);
  const header = await page
    .locator("[data-surface=page-header]")
    .evaluate((el) => [
      getComputedStyle(el).overflowY,
      getComputedStyle(el.firstElementChild!).overflowY,
    ]);
  expect(header.some((v) => v === "auto" || v === "scroll")).toBe(false);
  for (const selector of Object.values(SURFACES)) {
    expect((await info(page, selector)).transition).toMatch(/^0s/);
  }
});

for (const theme of ["light", "dark"] as Theme[]) {
  test.describe(`${theme} forced colors @full`, () => {
    test.use({ theme, forcedColors: "active" });
    test("the mask still applies", async ({ page }) => {
      await openPreview(page, `?${LONG}`);
      await scrollTo(page, SURFACES.main, 300);
      const g = await info(page, SURFACES.main);
      expect(g.mask).toContain("linear-gradient");
      expect(g.top).toBe(FADE);
    });
  });
}

test("a surface that scrolls takes keyboard focus, with its ring on the unmasked parent; one that fits doesn't", async ({
  page,
}) => {
  await openPreview(page, `?${LONG}`);
  for (const selector of Object.values(SURFACES)) {
    const body = page.locator(selector);
    await expect(body).toHaveAttribute("tabindex", "0");
    await body.focus();
    const ring = await body.evaluate((el) => ({
      focusVisible: el.matches(":focus-visible"),
      parentShadow: getComputedStyle(el.parentElement!).boxShadow,
      parentMask: getComputedStyle(el.parentElement!).maskImage,
    }));
    expect(ring.focusVisible).toBe(true);
    expect(ring.parentShadow).not.toBe("none");
    expect(ring.parentMask).toBe("none");
  }
  await openPreview(page);
  for (const selector of Object.values(SURFACES)) {
    await expect(page.locator(selector)).not.toHaveAttribute("tabindex", /.*/);
  }
});
