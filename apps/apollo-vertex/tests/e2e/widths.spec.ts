import type { Page } from "@playwright/test";
import { PADDED_INSET_PX } from "@/lib/composition";
import {
  END_PANEL_DEFAULT_PX,
  END_PANEL_MIN_PX,
  endPanelMaxWidth,
} from "@/templates/detail-page/detail-page.template";
import {
  expect,
  openCard,
  openPreview,
  pick,
  resize,
  search,
  test,
  widths,
} from "./fixtures";

const HANDLE = "[data-slot=detail-page-resize-handle]";
const handleRange = (page: Page) =>
  page.locator(HANDLE).evaluate((el) => ({
    now: Number(el.getAttribute("aria-valuenow")),
    min: Number(el.getAttribute("aria-valuemin")),
    max: Number(el.getAttribute("aria-valuemax")),
  }));
const endWidth = async (page: Page) => (await widths(page)).end;

const DEFAULTS: [number, string, boolean, boolean][] = [
  [1440, "", true, false],
  [1440, "?panels=end", false, false],
  [1920, "", true, true],
  [1920, "?panels=end", false, true],
  [1100, "?panels=end", false, true],
];

for (const [window, q, startOpen, full] of DEFAULTS) {
  test(`window ${window}${q || " both"}: default width, measured range${full ? " @full" : ""}`, async ({
    page,
  }) => {
    await openPreview(page, q, window);
    const w = await widths(page);
    const max = endPanelMaxWidth(w.template, startOpen);
    expect(w.end).toBe(Math.min(END_PANEL_DEFAULT_PX, max));
    expect(await handleRange(page)).toEqual({
      now: w.end,
      min: END_PANEL_MIN_PX,
      max,
    });
    expect(w.main).toBeGreaterThanOrEqual(480);
    expect(w.main).toBeGreaterThanOrEqual(w.end);
  });

  test(`window ${window}${q || " both"}: the first End press reaches the max${full ? " @full" : ""}`, async ({
    page,
  }) => {
    await openPreview(page, q, window);
    const { max } = await handleRange(page);
    await page.locator(HANDLE).focus();
    await page.keyboard.press("End");
    await expect.poll(() => endWidth(page)).toBe(max);
    expect(await search(page)).toContain("end-width=max");
  });
}

test("no room at the minimum: the rule closes the end panel", async ({
  page,
}) => {
  await openPreview(page, "?panels=end", 900);
  expect(await endWidth(page)).toBe(0);
  await expect(page.locator(HANDLE)).toHaveCount(0);
});

test("the handle's range is measured from the moment it's in the document", async ({
  page,
}) => {
  await page.goto("/preview/detail-page?panels=end", {
    waitUntil: "domcontentloaded",
  });
  const seen = await page.evaluate(
    () =>
      new Promise<{ max: number; template: number }>((resolve) => {
        const check = () => {
          const handle = document.querySelector(
            "[data-slot=detail-page-resize-handle]",
          );
          const template =
            document.querySelector<HTMLElement>("[data-template]");
          if (!handle?.isConnected || !template?.offsetWidth) return false;
          resolve({
            max: Number(handle.getAttribute("aria-valuemax")),
            template: template.getBoundingClientRect().width,
          });
          return true;
        };
        if (check()) return;
        const observer = new MutationObserver(
          () => check() && observer.disconnect(),
        );
        observer.observe(document.documentElement, {
          subtree: true,
          childList: true,
          attributes: true,
        });
      }),
  );
  expect(seen.max).toBe(endPanelMaxWidth(seen.template, false));
});

test("drag: widens, stops at 50/50, stores max, and keeps it across window sizes", async ({
  page,
}) => {
  await openPreview(page, "?panels=end", 1440);
  const box = (await page.locator(HANDLE).boundingBox())!;
  expect(Math.round(box.width)).toBe(8);
  expect(
    await page.locator(HANDLE).evaluate((el) => getComputedStyle(el).cursor),
  ).toBe("col-resize");
  const slot = await page
    .locator("[data-slot=detail-page-end-panel]")
    .evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect(slot).toBe(await endWidth(page));

  const y = box.y + 300;
  await page.mouse.move(box.x + 4, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 4 - 100, y, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => endWidth(page)).toBe(END_PANEL_DEFAULT_PX + 100);
  expect(await search(page)).toContain(
    `end-width=${END_PANEL_DEFAULT_PX + 100}`,
  );

  await page.mouse.move(box.x - 96, y);
  await page.mouse.down();
  await page.mouse.move(box.x - 900, y, { steps: 5 });
  await page.mouse.up();
  const w = await widths(page);
  expect(w.end).toBe(endPanelMaxWidth(w.template, false));
  expect(Math.abs(w.main - w.end)).toBeLessThanOrEqual(1);
  expect(await search(page)).toContain("end-width=max");

  for (const window of [1100, 1920, 1440]) {
    await resize(page, window);
    const now = await widths(page);
    expect(now.end).toBe(endPanelMaxWidth(now.template, false));
    expect(now.main).toBeGreaterThanOrEqual(480);
    expect(await search(page)).toContain("end-width=max");
  }
});

test("keyboard: arrows, Shift, Home, End, double-click, and RTL", async ({
  page,
}) => {
  await openPreview(page, "?panels=end", 1440);
  const handle = page.locator(HANDLE);
  await expect(handle).toHaveAttribute("role", "separator");
  await expect(handle).toHaveAttribute("aria-orientation", "vertical");
  await expect(handle).toHaveAttribute("aria-label", "Resize end panel");
  await expect(handle).toHaveAttribute("tabindex", "0");
  await handle.focus();
  const steps: [string, number][] = [
    ["ArrowLeft", 376],
    ["Shift+ArrowLeft", 440],
    ["ArrowRight", 424],
    ["Shift+ArrowRight", 360],
    ["Home", END_PANEL_MIN_PX],
  ];
  for (const [key, expected] of steps) {
    await page.keyboard.press(key);
    await expect.poll(() => endWidth(page), key).toBe(expected);
  }
  await page.keyboard.press("End");
  const { max } = await handleRange(page);
  await expect.poll(() => endWidth(page)).toBe(max);
  expect(await search(page)).toContain("end-width=max");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => search(page)).toContain(`end-width=${max - 16}`);
  expect((await handleRange(page)).now).toBe(max - 16);

  await handle.dblclick();
  await expect.poll(() => endWidth(page)).toBe(END_PANEL_DEFAULT_PX);
  expect(await search(page)).not.toContain("end-width");

  // Directions follow start and end, so they flip in RTL.
  await page.keyboard.press("Home");
  await page.evaluate(() => {
    document.documentElement.dir = "rtl";
  });
  await handle.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => endWidth(page)).toBe(END_PANEL_MIN_PX + 16);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => endWidth(page)).toBe(END_PANEL_MIN_PX);
});

test("opening the start panel clamps the end panel; closing restores the chosen width", async ({
  page,
}) => {
  await openPreview(page, "?end-width=600", 1440);
  let w = await widths(page);
  expect(w.end).toBe(endPanelMaxWidth(w.template, true));
  expect(w.main).toBe(480);
  await openCard(page);
  await pick(page, "Start panel state", "Closed");
  w = await widths(page);
  expect(w.end).toBe(endPanelMaxWidth(w.template, false));
  expect(await search(page)).toContain("end-width=600");
  await expect(page.getByTestId("end-panel-width")).toHaveText(
    `${w.end}px (chosen 600px)`,
  );
  await page.getByRole("button", { name: "Reset width" }).click();
  await expect.poll(() => endWidth(page)).toBe(END_PANEL_DEFAULT_PX);
  expect(await search(page)).not.toContain("end-width");
  await expect(
    page.getByRole("button", { name: "Reset width" }),
  ).toBeDisabled();
});

test('the card labels a max width "(max)"', async ({ page }) => {
  await openPreview(page, "?panels=end&end-width=max", 1440);
  await openCard(page);
  const w = await widths(page);
  await expect(page.getByTestId("end-panel-width")).toHaveText(
    `${w.end}px (max)`,
  );
});

test("at 1100 with both open, the rule closes start and the end panel fits", async ({
  page,
}) => {
  await openPreview(page, "?end-width=600", 1100);
  const w = await widths(page);
  expect(w.start).toBe(0);
  expect(w.end).toBe(endPanelMaxWidth(w.template, false));
  expect(w.main).toBeGreaterThanOrEqual(480);
});

test("minimal shell: a chosen width past 50/50 splits the window", async ({
  page,
}) => {
  await openPreview(page, "?shell=minimal&panels=end&end-width=900", 1440);
  const w = await widths(page);
  expect([w.end, w.main]).toEqual([720, 720]);
});

for (const bad of ["abc", "100", "300.5"]) {
  test(`invalid end-width=${bad} falls back to the default`, async ({
    page,
  }) => {
    await openPreview(page, `?panels=end&end-width=${bad}`, 1440);
    expect(await endWidth(page)).toBe(END_PANEL_DEFAULT_PX);
    expect(await search(page)).not.toContain("end-width");
  });
}

test("no handle while the end panel is closed, and never on the start panel", async ({
  page,
}) => {
  await openPreview(page, "?end-state=closed", 1440);
  await expect(page.locator(HANDLE)).toHaveCount(0);
  await expect(
    page.locator(`[data-slot=detail-page-start-panel] ${HANDLE}`),
  ).toHaveCount(0);
});

test("at its minimum, the padded end panel gives its occupant the width fits() uses", async ({
  page,
}) => {
  await openPreview(page, `?panels=end&end-width=${END_PANEL_MIN_PX}`, 1440);
  expect(await endWidth(page)).toBe(END_PANEL_MIN_PX);
  const inner = await page
    .locator("[data-surface=side-panel][data-side=end] [data-occupant]")
    .evaluate((el) => Math.round(el.getBoundingClientRect().width));
  expect(inner).toBe(END_PANEL_MIN_PX - 2 * PADDED_INSET_PX);
});
