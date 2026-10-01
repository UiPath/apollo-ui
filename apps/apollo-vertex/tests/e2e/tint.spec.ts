import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { SIDE_PANEL_TINT_STRENGTH } from "@/lib/composition";
import {
  alphaOf,
  expect,
  openCard,
  openPreview,
  search,
  test,
  type Theme,
} from "./fixtures";

const STRENGTH = SIDE_PANEL_TINT_STRENGTH / 100;

// Reference hue: --sidebar as authored in registry.json (oklch), per theme.
const registry = JSON.parse(
  readFileSync(join(__dirname, "../../registry.json"), "utf8"),
);
const theme = registry.items.find(
  (item: { name: string }) => item.name === "apollo-vertex-theme",
).cssVars;

const hueOf = (color: string) => {
  let m = color.match(/^oklch\(\s*[\d.]+\s+[\d.]+\s+([\d.]+|none)/);
  if (m) return m[1] === "none" ? Number.NaN : Number(m[1]);
  m = color.match(/^oklab\(\s*[\d.-]+\s+([\d.-]+)\s+([\d.-]+)/);
  if (m)
    return (
      ((Math.atan2(Number(m[2]), Number(m[1])) * 180) / Math.PI + 360) % 360
    );
  return Number.NaN;
};
const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};
const panels = (page: Page) =>
  page.evaluate(() =>
    Object.fromEntries(
      ["start", "end"].map((side) => {
        const el = document.querySelector<HTMLElement>(
          `[data-surface=side-panel][data-side=${side}]`,
        )!;
        const style = getComputedStyle(el);
        return [
          side,
          {
            placement: el.dataset.placement,
            bg: style.backgroundColor,
            image: style.backgroundImage,
          },
        ];
      }),
    ),
  );

for (const t of ["light", "dark"] as Theme[]) {
  test.describe(`${t}${t === "dark" ? " @full" : ""}`, () => {
    test.use({ theme: t });

    test("placement drives the tint symmetrically, in the sidebar's hue; below-header stays transparent", async ({
      page,
    }) => {
      const reference = hueOf(theme[t].sidebar);
      const cases: [string, string, string][] = [
        [
          "?start=beside-header&end=beside-header",
          "beside-header",
          "beside-header",
        ],
        ["?start=beside-header", "beside-header", "below-header"],
        ["?end=beside-header", "below-header", "beside-header"],
        ["", "below-header", "below-header"],
      ];
      for (const [q, start, end] of cases) {
        await openPreview(page, q);
        expect(
          await page.evaluate(
            (th) => document.documentElement.classList.contains(th),
            t,
          ),
          "theme applied",
        ).toBe(true);
        const g = await panels(page);
        expect([g.start.placement, g.end.placement], q).toEqual([start, end]);
        for (const [side, placement] of [
          ["start", start],
          ["end", end],
        ] as const) {
          const { bg, image } = g[side];
          if (placement === "below-header") {
            expect(alphaOf(bg), `${q} ${side}`).toBe(0);
            continue;
          }
          expect(Math.abs(alphaOf(bg) - STRENGTH)).toBeLessThan(0.02);
          expect(image).toBe("none");
          // A lost hue (oklch "none") gave the panel a pink cast once.
          expect(hueGap(hueOf(bg), reference), bg).toBeLessThanOrEqual(3);
        }
      }
      const slotsTransparent = await page.evaluate(() =>
        [...document.querySelectorAll("[data-slot^=detail-page-]")].every(
          (el) => getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)",
        ),
      );
      expect(slotsTransparent).toBe(true);
    });

    test("teams can't set the background", async ({ page }) => {
      await openPreview(page, "?start=beside-header");
      const forced = await page.evaluate(() => {
        const el = document.querySelector<HTMLElement>(
          "[data-surface=side-panel][data-side=start]",
        )!;
        el.style.background = "red";
        const style = getComputedStyle(el);
        return { bg: style.backgroundColor, image: style.backgroundImage };
      });
      expect(Math.abs(alphaOf(forced.bg) - STRENGTH)).toBeLessThan(0.02);
      expect(forced.image).toBe("none");
    });

    test("the Tint strength slider shows only with a beside-header panel, keeps the hue, and stays out of the URL", async ({
      page,
    }) => {
      await openPreview(page, "?start=beside-header");
      await openCard(page);
      await expect(page.getByText("Tint strength")).toBeVisible();
      const reference = hueOf(theme[t].sidebar);
      for (const strength of [30, 100]) {
        await page.getByRole("slider").focus();
        await page.keyboard.press("Home");
        for (let i = 0; i < strength; i++)
          await page.keyboard.press("ArrowRight");
        await expect(page.getByTestId("tint-strength-value")).toHaveText(
          `${strength}%`,
        );
        const bg = (await panels(page)).start.bg;
        expect(hueGap(hueOf(bg), reference), bg).toBeLessThanOrEqual(3);
      }
      expect(await search(page)).not.toContain("tint");
      await openPreview(page);
      await openCard(page);
      await expect(page.getByText("Tint strength")).toHaveCount(0);
    });
  });
}
