import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import {
  chooseLayoutOption,
  inspector,
  layoutChoice,
  open,
  selectSlot,
  slotStates,
  urlQuery,
} from "./workbench-helpers";

/*
 * The Panel choice by keyboard; the workbench's toasts, inverted, with no
 * close button, a timer that waits while hovered or while Undo has
 * focus, and Escape to dismiss; and no text selected in the chrome by a
 * drag across the stage.
 */

const QUERY = "?view=template&end-panel-contents=queue&mode=edit";
const toast = (page: Page) => page.locator("[data-sonner-toast]");

async function ready(page: Page) {
  await open(page, QUERY);
  await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
  await settle(page);
  await selectSlot(page, "end-panel");
}

/** Makes a change, so its toast shows. */
async function change(page: Page) {
  await chooseLayoutOption(page, "End panel", "Panel", "Closed");
  await toast(page).waitFor();
}

/**
 * An arrow key, held a moment as a person holds it: a radio group checks
 * the option focus moves to only while the arrow is down, and moves focus
 * a tick after the press.
 */
async function arrow(page: Page, key: string) {
  await page.keyboard.down(key);
  await page.waitForTimeout(50);
  await page.keyboard.up(key);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
});

test("the arrow keys move through Panel's options, and each one applies", async ({
  page,
}) => {
  await ready(page);
  const panel = layoutChoice(page, "End panel", "Panel");
  await panel.getByRole("radio", { name: "Open" }).focus();
  await arrow(page, "ArrowRight");
  await expect(panel.getByRole("radio", { name: "Closed" })).toBeFocused();
  await expect.poll(() => urlQuery(page)).toContain("end-panel-state=closed");
  await expect
    .poll(() => slotStates(page))
    .toMatchObject({ "detail-page-end-panel": "closed" });
  await arrow(page, "ArrowRight");
  await expect.poll(() => urlQuery(page)).toContain("end-panel-present=false");
  // Hidden: Placement waits, off.
  await expect(
    layoutChoice(page, "End panel", "Placement").getByRole("radio").first(),
  ).toBeDisabled();
  // Back to Open, the link drops both.
  await arrow(page, "ArrowRight");
  await expect(panel.getByRole("radio", { name: "Open" })).toBeFocused();
  await expect.poll(() => urlQuery(page)).not.toContain("end-panel-present");
  expect(urlQuery(page)).not.toContain("end-panel-state");
  expect(urlQuery(page)).toContain("end-panel-contents=queue");
});

for (const theme of ["light", "dark"] as const) {
  test(`a toast is inverted, with an Undo in its own colors and no close button, ${theme}`, async ({
    page,
  }) => {
    await open(page, `${QUERY}&theme=${theme}`);
    await page.locator("[data-slot=workbench-edit-slot]").first().waitFor();
    await selectSlot(page, "end-panel");
    await change(page);
    const seen = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("No 2D context");
      const rgb = (color: string) => {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        return [...ctx.getImageData(0, 0, 1, 1).data].join();
      };
      const token = (name: string) => {
        const probe = document.createElement("span");
        probe.style.color = `var(${name})`;
        document.querySelector("[data-slot=workbench]")?.append(probe);
        const color = rgb(getComputedStyle(probe).color);
        probe.remove();
        return color;
      };
      const el = document.querySelector("[data-sonner-toast]");
      const undo = el?.querySelector("[data-button]");
      if (!el || !undo) throw new Error("No toast");
      const style = getComputedStyle(el);
      const button = getComputedStyle(undo);
      return {
        foreground: token("--foreground"),
        background: token("--background"),
        primary: token("--primary"),
        ground: rgb(style.backgroundColor),
        text: rgb(style.color),
        undoText: rgb(button.color),
        undoFill: rgb(button.backgroundColor),
        close: el.querySelector("[data-close-button]") !== null,
        live: el.closest("[aria-live]")?.getAttribute("aria-live") ?? null,
      };
    });
    expect(seen.ground).toBe(seen.foreground);
    expect(seen.text).toBe(seen.background);
    expect(seen.undoText).toBe(seen.background);
    expect(seen.undoFill).not.toBe(seen.primary);
    expect(seen.undoText).not.toBe(seen.primary);
    expect(seen.close).toBe(false);
    expect(seen.live).toBe("polite");
  });
}

test("a toast waits while hovered, and goes after its time", async ({
  page,
}) => {
  await ready(page);
  await change(page);
  await toast(page).hover();
  await page.waitForTimeout(6800);
  await expect(toast(page)).toHaveCount(1);
  await page.mouse.move(10, 500);
  await expect(toast(page)).toHaveCount(0, { timeout: 9000 });
});

test("a toast waits while its Undo has focus, which the keyboard reaches", async ({
  page,
}) => {
  await ready(page);
  await change(page);
  const undo = toast(page).getByRole("button", { name: "Undo" });
  await undo.focus();
  await expect(undo).toBeFocused();
  await page.mouse.move(10, 500);
  await page.waitForTimeout(6800);
  await expect(toast(page)).toHaveCount(1);
  // And it works from there.
  await page.keyboard.press("Enter");
  await expect.poll(() => urlQuery(page)).not.toContain("end-panel-state");
});

test("Escape dismisses the toast first, then deselects", async ({ page }) => {
  await ready(page);
  await change(page);
  await layoutChoice(page, "End panel", "Panel")
    .getByRole("radio", { name: "Closed" })
    .focus();
  await page.keyboard.press("Escape");
  await expect(toast(page)).toHaveCount(0);
  // The slot is still selected: that Escape was the toast's.
  await expect(inspector(page)).toHaveAttribute(
    "data-inspector-slot",
    "end-panel",
  );
  await page.keyboard.press("Escape");
  await expect(inspector(page)).not.toHaveAttribute("data-inspector-slot");
});

test("a drag across the stage selects no text in the chrome", async ({
  page,
}) => {
  await open(page, "?view=template&end-panel-contents=queue");
  await page
    .locator("[data-slot=workbench-page] [data-occupant=queue]")
    .waitFor();
  await settle(page);
  const stage = await page.locator("[data-slot=workbench-stage]").boundingBox();
  const dock = await page.locator("[data-slot=workbench-dock]").boundingBox();
  if (!stage || !dock) throw new Error("No stage");
  // From the canvas's top corner, across the frame, to past the dock.
  await page.mouse.move(stage.x + 8, stage.y + 8);
  await page.mouse.down();
  await page.mouse.move(dock.x + dock.width - 4, dock.y + dock.height - 4, {
    steps: 12,
  });
  await page.mouse.up();
  const picked = await page.evaluate(
    () => window.getSelection()?.toString() ?? "",
  );
  for (const text of ["1440px", "Fit", "100%", "Detail page ·"])
    expect(picked).not.toContain(text);
});
