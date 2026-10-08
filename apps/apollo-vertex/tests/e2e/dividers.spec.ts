import type { Page } from "@playwright/test";
import {
  END_PANEL_DEFAULT_PX,
  START_PANEL_PX,
} from "@/templates/detail-page/detail-page.template";
import {
  colorDistance as distance,
  expect,
  openPreview,
  pixel,
  test,
  type Theme,
} from "./fixtures";

const overlay = (page: Page, slot: string) =>
  page.evaluate((s) => {
    const el = document.querySelector(`[data-slot=detail-page-${s}]`);
    if (!el || getComputedStyle(el).visibility === "hidden") return null;
    const after = getComputedStyle(el, "::after");
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      shadow: after.boxShadow
        .split(/,(?![^()]*\))/)
        .at(-1)!
        .trim(),
      pointerEvents: after.pointerEvents,
      position: after.position,
      borders: {
        top: after.borderTopWidth,
        bottom: after.borderBottomWidth,
        left: after.borderLeftWidth,
        right: after.borderRightWidth,
      },
      colors: {
        bottom: after.borderBottomColor,
        left: after.borderLeftColor,
        right: after.borderRightColor,
      },
      slotBorders: [
        style.borderLeftWidth,
        style.borderRightWidth,
        style.borderBottomWidth,
      ].join(","),
      x: r.left,
      right: r.right,
      y: r.top,
      bottom: r.bottom,
      w: r.width,
    };
  }, slot);

test.describe("dividers", () => {
  test("--divider matches the Shell sidebar edge's colour", async ({
    page,
  }) => {
    await openPreview(page);
    await page.evaluate(() => {
      const host = document.createElement("div");
      host.id = "swatches";
      host.style.cssText =
        "position:fixed;left:0;top:0;z-index:99999;display:flex;background:#808080";
      for (const bg of [
        "var(--divider)",
        "color-mix(in srgb, var(--color-border) 50%, transparent)",
      ]) {
        const swatch = document.createElement("div");
        swatch.style.cssText = `width:40px;height:40px;background:${bg}`;
        host.append(swatch);
      }
      document.body.append(host);
    });
    expect(
      distance(await pixel(page, 20, 20), await pixel(page, 60, 20)),
    ).toBeLessThanOrEqual(1.8);
  });

  test("dividers are overlays on the right edges, visible, and take no space", async ({
    page,
  }) => {
    await openPreview(page);
    const [h, s, e] = await Promise.all(
      ["header", "start-panel", "end-panel"].map((slot) => overlay(page, slot)),
    );
    for (const o of [h, s, e]) {
      expect([o!.pointerEvents, o!.position, o!.slotBorders]).toEqual([
        "none",
        "absolute",
        "0px,0px,0px",
      ]);
    }
    expect(h!.shadow).toMatch(/0px -1px 0px 0px inset$/);
    expect(s!.shadow).toMatch(/ -1px 0px 0px 0px inset$/);
    expect(e!.shadow).toMatch(/ 1px 0px 0px 0px inset$/);
    expect([Math.round(s!.w), Math.round(e!.w)]).toEqual([
      START_PANEL_PX,
      END_PANEL_DEFAULT_PX,
    ]);

    const y = Math.round((s!.y + s!.bottom) / 2);
    expect(
      distance(
        await pixel(page, Math.round(s!.right) - 1, y),
        await pixel(page, Math.round(s!.right) - 3, y),
      ),
    ).toBeGreaterThan(1);
    expect(
      distance(
        await pixel(page, Math.round(e!.x), y),
        await pixel(page, Math.round(e!.x) + 2, y),
      ),
    ).toBeGreaterThan(1);

    const handle = (await page
      .locator("[data-part=resize-handle]")
      .boundingBox())!;
    expect(
      Math.abs(handle.x + handle.width / 2 - (e!.x + 0.5)),
    ).toBeLessThanOrEqual(0.01);
  });

  test("RTL mirrors the inline-edge dividers and the handle", async ({
    page,
  }) => {
    await openPreview(page);
    await page.evaluate(() => {
      document.documentElement.dir = "rtl";
    });
    await expect
      .poll(async () => (await overlay(page, "start-panel"))!.shadow)
      .toMatch(/ 1px 0px 0px 0px inset$/);
    const s = (await overlay(page, "start-panel"))!;
    const e = (await overlay(page, "end-panel"))!;
    expect(e.shadow).toMatch(/-1px 0px 0px 0px inset$/);
    expect(s.x).toBeGreaterThan(e.x);
    const handle = (await page
      .locator("[data-part=resize-handle]")
      .boundingBox())!;
    expect(
      Math.abs(handle.x + handle.width / 2 - (e.right - 0.5)),
    ).toBeLessThanOrEqual(0.01);
  });

  test("dividers follow placement and open state", async ({ page }) => {
    await openPreview(page, "?start=beside-header&end-state=closed");
    const s = (await overlay(page, "start-panel"))!;
    const h = (await overlay(page, "header"))!;
    const top = await page
      .locator("[data-template]")
      .evaluate((el) => el.getBoundingClientRect().top);
    expect(Math.round(s.y)).toBe(Math.round(top));
    expect(await overlay(page, "end-panel")).toBeNull();
    expect(Math.round(h.x)).toBe(Math.round(s.right));
  });
});

for (const theme of ["light", "dark"] as Theme[]) {
  test.describe(`${theme} forced colors${theme === "dark" ? " @full" : ""}`, () => {
    test.use({ theme, forcedColors: "active" });

    test("dividers become real 1px CanvasText borders, still with no layout space", async ({
      page,
    }) => {
      await openPreview(page);
      const canvasText = await page.evaluate(() => {
        const probe = document.createElement("div");
        probe.style.color = "CanvasText";
        document.body.append(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      const [h, s, e] = await Promise.all(
        ["header", "start-panel", "end-panel"].map((slot) =>
          overlay(page, slot),
        ),
      );
      expect([h!.shadow, s!.shadow, e!.shadow]).toEqual([
        "none",
        "none",
        "none",
      ]);
      expect([h!.borders.bottom, s!.borders.right, e!.borders.left]).toEqual([
        "1px",
        "1px",
        "1px",
      ]);
      expect([h!.borders.top, s!.borders.left, e!.borders.right]).toEqual([
        "0px",
        "0px",
        "0px",
      ]);
      expect([h!.colors.bottom, s!.colors.right, e!.colors.left]).toEqual([
        canvasText,
        canvasText,
        canvasText,
      ]);
      expect([Math.round(s!.w), Math.round(e!.w), s!.slotBorders]).toEqual([
        START_PANEL_PX,
        END_PANEL_DEFAULT_PX,
        "0px,0px,0px",
      ]);
    });
  });
}
