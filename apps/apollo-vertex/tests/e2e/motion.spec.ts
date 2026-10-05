import type { Page } from "@playwright/test";
import { PANEL_TRANSITION_DURATION_MS } from "@/lib/composition";
import {
  END_PANEL_DEFAULT_PX,
  START_PANEL_PX,
} from "@/templates/detail-page/detail-page.template";
import {
  expect,
  openCard,
  openPreview,
  pick,
  test,
  type Theme,
} from "./fixtures";

test.use({ reducedMotion: "no-preference" });

// The Shell sidebar's spring (stiffness 400, damping 30, mass 0.5): progress at t ms.
const spring = (() => {
  const k = 400;
  const c = 30;
  const m = 0.5;
  const dt = 0.00005;
  let x = 0;
  let v = 0;
  const points = [0];
  for (let t = 0; t < 0.6; t += dt) {
    v += ((-k * (x - 1) - c * v) / m) * dt;
    x += v * dt;
    points.push(x);
  }
  return (ms: number) =>
    points[Math.min(points.length - 1, Math.round(ms / 1000 / dt))];
})();
const TIMES = Array.from({ length: 15 }, (_, i) => i * 25);
const TOLERANCE = 0.06;

/** Clicks a card radio, then reads the width transition at exact times. */
const probe = (page: Page, side: "start" | "end", value: "Open" | "Closed") =>
  page.evaluate(
    async ([s, v, times]) => {
      const group = document.querySelector(
        `[role=group][aria-label="${s === "start" ? "Start panel" : "End panel"} state"]`,
      )!;
      const radio = [
        ...group.querySelectorAll<HTMLElement>("[role=radio]"),
      ].find((r) => r.textContent === v)!;
      const slot = document.querySelector<HTMLElement>(
        `[data-slot=detail-page-${s}-panel]`,
      )!;
      const clip = slot.querySelector<HTMLElement>("[data-part=panel-clip]")!;
      const main = document.querySelector("[data-slot=detail-page-main]")!;
      const template = document.querySelector("[data-template]")!;
      radio.click();
      // React commits the click in a microtask; each sample then sets currentTime exactly.
      await new Promise((r) => {
        setTimeout(r, 0);
      });
      const inertAtOnce = slot.inert;
      // Flush styles so the transition exists.
      clip.getBoundingClientRect();
      const animations = clip
        .getAnimations()
        .filter((a) => (a as CSSTransition).transitionProperty === "width");
      if (animations.length !== 1)
        return { count: animations.length, inertAtOnce };
      const a = animations[0];
      a.pause();
      const timing = a.effect!.getComputedTiming();
      const samples = times.map((t) => {
        a.currentTime = t;
        const others = [...template.querySelectorAll("[data-slot$=-panel]")]
          .filter((x) => x !== slot)
          .reduce((sum, x) => sum + x.getBoundingClientRect().width, 0);
        return {
          t,
          w: clip.getBoundingClientRect().width,
          main: main.getBoundingClientRect().width,
          expectedMain:
            template.getBoundingClientRect().width -
            others -
            slot.getBoundingClientRect().width,
        };
      });
      a.finish();
      const tokens = getComputedStyle(template);
      return {
        count: 1,
        inertAtOnce,
        duration: Number(timing.duration),
        easing: String(timing.easing),
        tokenEasing: tokens
          .getPropertyValue("--panel-transition-easing")
          .trim(),
        samples,
      };
    },
    [side, value, TIMES] as const,
  );

// Compare curves by stop values: the browser expands linear() with positions.
const stops = (easing: string) =>
  easing
    .replaceAll(/^linear\(|\)$/g, "")
    .split(",")
    .map((stop) => Number(stop.trim().split(/\s+/)[0]));

for (const theme of ["light", "dark"] as Theme[])
  for (const shell of ["sidebar", "minimal"] as const)
    for (const place of ["below-header", "beside-header"] as const) {
      const core =
        theme === "light" && shell === "sidebar" && place === "below-header";
      test.describe(`${theme}, ${shell}, ${place}${core ? "" : " @full"}`, () => {
        test.use({ theme });
        test("opens and closes along the Shell's spring, from the tokens, and closing panels are inert at once", async ({
          page,
        }) => {
          await openPreview(
            page,
            `?start=${place}&end=${place}${shell === "minimal" ? "&shell=minimal" : ""}`,
          );
          await openCard(page);
          for (const [side, width] of [
            ["start", START_PANEL_PX],
            ["end", END_PANEL_DEFAULT_PX],
          ] as const) {
            for (const [value, from, to] of [
              ["Closed", width, 0],
              ["Open", 0, width],
            ] as const) {
              const r = await probe(page, side, value);
              const what = `${side} ${value === "Closed" ? "close" : "open"}`;
              expect(r.count, `${what}: one width transition`).toBe(1);
              if (!r.samples || !r.easing || !r.tokenEasing) continue;
              expect(r.duration, what).toBe(PANEL_TRANSITION_DURATION_MS);
              expect(
                stops(r.easing),
                `${what}: curve from --panel-transition-easing`,
              ).toEqual(stops(r.tokenEasing));
              const error = Math.max(
                ...r.samples.map((s) =>
                  Math.abs((s.w - from) / (to - from) - spring(s.t)),
                ),
              );
              const mainOff = Math.max(
                ...r.samples.map((s) => Math.abs(s.main - s.expectedMain)),
              );
              expect(error, `${what}: matches the spring`).toBeLessThanOrEqual(
                TOLERANCE,
              );
              expect(mainOff, `${what}: main follows`).toBeLessThanOrEqual(1);
              if (value === "Closed")
                expect(r.inertAtOnce, `${what}: inert at once`).toBe(true);
            }
          }
        });
      });
    }

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("creates no transition", async ({ page }) => {
    await openPreview(page);
    await openCard(page);
    for (const side of ["start", "end"] as const)
      for (const value of ["Closed", "Open"] as const) {
        expect((await probe(page, side, value)).count, `${side} ${value}`).toBe(
          0,
        );
      }
  });
});

const widthTransitions = (page: Page) =>
  page.evaluate(
    () =>
      [...document.querySelectorAll("[data-part=panel-clip]")]
        .flatMap((clip) => clip.getAnimations())
        .filter((a) => (a as CSSTransition).transitionProperty === "width")
        .length,
  );

test("window resizes, rule closes, the handle, and placement changes snap", async ({
  page,
}) => {
  await openPreview(page, "?end-width=max");
  await openCard(page);
  await page.setViewportSize({ width: 1200, height: 900 });
  expect(await widthTransitions(page)).toBe(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("[data-part=resize-handle]").focus();
  await page.keyboard.press("Home");
  expect(await widthTransitions(page)).toBe(0);
  await pick(page, "End panel placement", "Beside header");
  expect(await widthTransitions(page)).toBe(0);
});

test("the first load snaps", async ({ page }) => {
  await page.goto("/preview/detail-page", { waitUntil: "domcontentloaded" });
  const seen = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        let frames = 0;
        const tick = () => {
          total += [...document.querySelectorAll("[data-part=panel-clip]")]
            .flatMap((clip) => clip.getAnimations())
            .filter(
              (a) => (a as CSSTransition).transitionProperty === "width",
            ).length;
          if (++frames < 90) requestAnimationFrame(tick);
          else resolve(total);
        };
        tick();
      }),
  );
  expect(seen).toBe(0);
});

test("focus inside a closing panel moves to main, and its content can't take focus mid-close", async ({
  page,
}) => {
  await openPreview(page);
  await openCard(page);
  const r = await page.evaluate(async (startWidth) => {
    const body = document.querySelector(
      "[data-surface=side-panel][data-side=start] [data-slot=side-panel-body]",
    )!;
    const button = document.createElement("button");
    button.textContent = "inside";
    body.prepend(button);
    button.focus();
    const before = document.activeElement === button;
    [
      ...document
        .querySelector('[role=group][aria-label="Start panel state"]')!
        .querySelectorAll<HTMLElement>("[role=radio]"),
    ]
      .find((radio) => radio.textContent === "Closed")!
      .click();
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
    const clip = document.querySelector<HTMLElement>(
      "[data-slot=detail-page-start-panel] [data-part=panel-clip]",
    )!;
    // Flush styles so the transition exists.
    clip.getBoundingClientRect();
    const a = clip
      .getAnimations()
      .find((x) => (x as CSSTransition).transitionProperty === "width")!;
    a.pause();
    a.currentTime = 100;
    const mid = clip.getBoundingClientRect().width;
    button.focus();
    const out = {
      before,
      focused: (document.activeElement as HTMLElement | null)?.dataset.slot,
      refocused: document.activeElement === button,
      midClose: mid > 0 && mid < startWidth,
    };
    a.finish();
    return out;
  }, START_PANEL_PX);
  expect(r).toEqual({
    before: true,
    focused: "detail-page-main",
    refocused: false,
    midClose: true,
  });
  expect(
    await page
      .locator("[data-surface=side-panel][data-side=start]")
      .evaluate((el) => el.closest("[inert]") !== null),
  ).toBe(true);
});
