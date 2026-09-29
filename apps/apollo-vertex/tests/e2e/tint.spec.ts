import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { SIDE_PANEL_TINT_STRENGTH } from "@/lib/composition";
import {
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
const alphaOf = (color: string) => {
  if (color === "rgba(0, 0, 0, 0)" || color === "transparent") return 0;
  const m =
    color.match(/\/\s*([\d.]+)\)/) ?? color.match(/rgba\([^)]*,\s*([\d.]+)\)/);
  return m ? Number(m[1]) : 1;
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
  for (const shell of ["sidebar", "minimal"] as const) {
    const full = shell === "minimal" ? " @full" : "";
    const sq = shell === "minimal" ? "&shell=minimal" : "";
    test.describe(`${t}, ${shell}${full}`, () => {
      test.use({ theme: t });

      test("beside-header panels get the tint, in the sidebar's hue", async ({
        page,
      }) => {
        await openPreview(page, `?start=beside-header&end=beside-header${sq}`);
        expect(
          await page.evaluate(
            (th) => document.documentElement.classList.contains(th),
            t,
          ),
        ).toBe(true);
        const g = await panels(page);
        const reference = hueOf(theme[t].sidebar);
        for (const side of ["start", "end"]) {
          expect(g[side].placement).toBe("beside-header");
          expect(Math.abs(alphaOf(g[side].bg) - STRENGTH)).toBeLessThan(0.02);
          expect(g[side].image).toBe("none");
          // A lost hue (oklch "none") gave the panel a pink cast once.
          expect(
            hueGap(hueOf(g[side].bg), reference),
            g[side].bg,
          ).toBeLessThanOrEqual(3);
        }
        const slotsTransparent = await page.evaluate(() =>
          [...document.querySelectorAll("[data-slot^=detail-page-]")].every(
            (el) => getComputedStyle(el).backgroundColor === "rgba(0, 0, 0, 0)",
          ),
        );
        expect(slotsTransparent).toBe(true);
      });

      test("teams can't set the background", async ({ page }) => {
        await openPreview(page, `?start=beside-header${sq}`);
        const forced = await page.evaluate(() => {
          const el = document.querySelector<HTMLElement>(
            "[data-surface=side-panel][data-side=start]",
          )!;
          el.classList.add("bg-primary");
          el.style.background = "red";
          const style = getComputedStyle(el);
          return { bg: style.backgroundColor, image: style.backgroundImage };
        });
        expect(Math.abs(alphaOf(forced.bg) - STRENGTH)).toBeLessThan(0.02);
        expect(forced.image).toBe("none");
      });

      test("placement drives the tint symmetrically; below-header stays transparent", async ({
        page,
      }) => {
        const cases: [string, string, string][] = [
          ["?start=beside-header", "beside-header", "below-header"],
          ["?end=beside-header", "below-header", "beside-header"],
          ["?", "below-header", "below-header"],
        ];
        for (const [q, start, end] of cases) {
          await openPreview(page, q + sq);
          const g = await panels(page);
          const expected = (placement: string) =>
            placement === "beside-header" ? STRENGTH : 0;
          expect([g.start.placement, g.end.placement]).toEqual([start, end]);
          expect(Math.abs(alphaOf(g.start.bg) - expected(start))).toBeLessThan(
            0.02,
          );
          expect(Math.abs(alphaOf(g.end.bg) - expected(end))).toBeLessThan(
            0.02,
          );
        }
      });

      test("the Tint strength slider shows only with a beside-header panel, keeps the hue, and stays out of the URL", async ({
        page,
      }) => {
        await openPreview(page, `?start=beside-header${sq}`);
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
        await openPreview(page, `?${sq.slice(1)}`);
        await openCard(page);
        await expect(page.getByText("Tint strength")).toHaveCount(0);
      });
    });
  }
}
