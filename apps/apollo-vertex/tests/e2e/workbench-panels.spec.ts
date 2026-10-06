import { expect, test } from "./fixtures";
import { open, urlQuery } from "./workbench-helpers";

/*
 * The workbench's own side columns, the occupant list and the right-hand
 * column: they open and close on the Shell's panel tokens, the stage
 * resizing with them, at once under reduced motion; their content clips
 * rather than reflows; and focus follows their toggles.
 */

test("the panel toggles collapse and reopen each panel, and carry focus", async ({
  page,
}) => {
  await open(page, "?occupant=queue");
  // The list starts open and the details panel closed; each writes only its
  // non-default state.
  for (const [start, next, panel, param] of [
    [
      "Hide occupant list",
      "Show occupant list",
      "#workbench-list",
      "list=closed",
    ],
    ["Show details", "Hide details", "#workbench-details", "details=open"],
  ] as const) {
    const startsOpen = start.startsWith("Hide");
    const toggle = page.getByRole("button", { name: start });
    await expect(toggle).toHaveAttribute("aria-expanded", String(startsOpen));
    await expect(toggle).toHaveAttribute("aria-controls", panel.slice(1));
    await expect(page.locator(panel)).toBeVisible({ visible: startsOpen });
    expect(urlQuery(page)).not.toContain(param);
    await toggle.focus();
    await page.keyboard.press("Enter");
    const toggled = page.getByRole("button", { name: next });
    await expect(toggled).toHaveAttribute("aria-expanded", String(!startsOpen));
    await expect(page.locator(panel)).toBeVisible({ visible: !startsOpen });
    expect(urlQuery(page)).toContain(param);
    // Opened from its toggle, focus moves into the panel; closed from the
    // toggle, it stays there.
    if (startsOpen) await expect(toggled).toBeFocused();
    else await expect(page.locator(panel)).toBeFocused();
    if (startsOpen) {
      await page.keyboard.press("Enter");
      await expect(page.locator(panel)).toBeFocused();
    }
    // Closed with focus inside, focus goes back to the toggle.
    const closer = page.locator(
      `[data-slot=workbench-header] [aria-controls="${panel.slice(1)}"]`,
    );
    await closer.evaluate((el) => {
      if (el instanceof HTMLElement) el.click();
    });
    await expect(page.locator(panel)).toBeVisible({ visible: false });
    await expect(closer).toBeFocused();
    if (startsOpen) {
      // Back to where it started: open.
      await page.keyboard.press("Enter");
    }
    await expect(page.locator(panel)).toBeVisible({ visible: startsOpen });
    expect(urlQuery(page)).not.toContain(param);
  }
});

test("the workbench's columns animate on the panel tokens, and the stage follows", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "?occupant=queue");
  const column = page.locator("[data-slot=workbench-panel][data-panel=column]");
  const motion = await column.evaluate((el) => {
    const style = getComputedStyle(el);
    return {
      property: style.transitionProperty,
      duration: style.transitionDuration,
      easing: style.transitionTimingFunction.startsWith("linear("),
    };
  });
  expect(motion).toEqual({
    property: "width",
    duration: "0.35s",
    easing: true,
  });
  // Mid-open: the column is partway, the details keep their own width (they
  // clip, not squeeze), and the stage has narrowed by what the column took.
  const before =
    (await page.locator("[data-slot=workbench-stage]").boundingBox())?.width ??
    0;
  await page.getByRole("button", { name: "Show details" }).click();
  await page.waitForTimeout(120);
  const mid = await page.evaluate(() => {
    const box = document.querySelector(
      "[data-slot=workbench-panel][data-panel=column]",
    );
    const details = document.querySelector("#workbench-details");
    const stageBox = document.querySelector("[data-slot=workbench-stage]");
    return {
      column: box?.getBoundingClientRect().width ?? 0,
      details: details?.getBoundingClientRect().width ?? 0,
      stage: stageBox?.getBoundingClientRect().width ?? 0,
    };
  });
  expect(mid.column).toBeGreaterThan(0);
  expect(mid.column).toBeLessThan(320);
  expect(mid.details).toBe(320);
  expect(Math.round(before - mid.stage)).toBe(Math.round(mid.column));
  await expect.poll(async () => (await column.boundingBox())?.width).toBe(320);
});

test("with reduced motion, the columns open and close at once", async ({
  page,
}) => {
  await open(page, "?occupant=queue");
  const column = page.locator("[data-slot=workbench-panel][data-panel=column]");
  expect(
    await column.evaluate((el) => getComputedStyle(el).transitionProperty),
  ).toBe("none");
  await page.getByRole("button", { name: "Show details" }).click();
  expect((await column.boundingBox())?.width).toBe(320);
});
