import type { Page } from "@playwright/test";
import {
  END_PANEL_DEFAULT_PX,
  END_PANEL_MIN_PX,
} from "@/templates/detail-page/detail-page.template";
import {
  expect,
  openCard,
  openPreview,
  panelStates,
  pick,
  test,
  widths,
} from "./fixtures";

const snapshot = (page: Page) =>
  page.evaluate(() => {
    const panel = (side: string) =>
      document.querySelector<HTMLElement>(
        `[data-surface=side-panel][data-side=${side}]`,
      );
    const tintHost = document
      .querySelector("#detail-page-preview-config")!
      .closest("div.fixed")!.previousElementSibling as HTMLElement | null;
    const active = document.activeElement as HTMLElement | null;
    return {
      search: location.search,
      history: history.length,
      minimal: !document.querySelector("[data-sidebar=sidebar]"),
      startState: panel("start")?.dataset.state,
      startPlacement: panel("start")?.dataset.placement,
      mainPadding: document.querySelector<HTMLElement>(
        "[data-surface=content-area]",
      )!.dataset.padding,
      mainLong: Boolean(
        document.querySelector(
          "[data-surface=content-area] [data-content=long]",
        ),
      ),
      endScroll: panel("end")?.dataset.scroll,
      tint: tintHost?.style.getPropertyValue("--side-panel-tint") ?? "",
      cardOpen: !document.querySelector<HTMLElement>(
        "#detail-page-preview-config",
      )!.hidden,
      focus: active
        ? `${active.closest("[role=group]")?.getAttribute("aria-label")}:${active.textContent}`
        : "",
    };
  });

test("reset restores every default, clears the URL, and Back undoes it", async ({
  page,
}) => {
  await openPreview(page);
  await openCard(page);
  await pick(page, "Shell", "Minimal");
  await pick(page, "Start panel placement", "Beside header");
  await page.getByRole("slider").focus();
  await page.keyboard.press("Home");
  for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowRight");
  await pick(page, "Start panel state", "Closed");
  await pick(page, "Main padding", "Flush");
  await pick(page, "Main content", "On");
  await pick(page, "End panel scroll owner", "Occupant");
  await page.locator("[data-slot=detail-page-resize-handle]").focus();
  await page.keyboard.press("Home");
  await expect
    .poll(async () => (await widths(page)).end)
    .toBe(END_PANEL_MIN_PX);
  const changed = await snapshot(page);
  expect(changed).toMatchObject({
    minimal: true,
    startState: "closed",
    startPlacement: "beside-header",
    mainPadding: "flush",
    mainLong: true,
    endScroll: "occupant",
  });
  expect(changed.tint).toContain("30%");

  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect.poll(async () => (await snapshot(page)).search).toBe("");
  const reset = await snapshot(page);
  expect(reset).toMatchObject({
    history: changed.history + 1,
    minimal: false,
    startState: "open",
    startPlacement: "below-header",
    mainPadding: "padded",
    mainLong: false,
    endScroll: "surface",
    tint: "",
    cardOpen: true,
    focus: "Shell:Sidebar",
  });
  expect((await widths(page)).end).toBe(END_PANEL_DEFAULT_PX);

  await page.goBack();
  await expect
    .poll(async () => (await snapshot(page)).search)
    .toBe(changed.search);
  const back = await snapshot(page);
  expect(back).toMatchObject({
    minimal: true,
    startState: "closed",
    startPlacement: "beside-header",
    mainPadding: "flush",
    mainLong: true,
    endScroll: "occupant",
  });
  // Tint strength isn't in the URL by design, so Back can't restore it.
  expect(back.tint).toBe("");
  expect((await widths(page)).end).toBe(END_PANEL_MIN_PX);

  await page.goForward();
  await expect.poll(async () => (await snapshot(page)).search).toBe("");
  expect((await snapshot(page)).minimal).toBe(false);
});

test("reset also resets the user's open intent and the rule's closes", async ({
  page,
}) => {
  await openPreview(page, "", 1200);
  await openCard(page);
  expect(await panelStates(page)).toEqual({ start: "closed", end: "open" });
  await pick(page, "Start panel state", "Open");
  expect(await panelStates(page)).toEqual({ start: "open", end: "closed" });
  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect
    .poll(() => panelStates(page))
    .toEqual({ start: "closed", end: "open" });
});

test("reset at the defaults changes nothing visible but still works", async ({
  page,
}) => {
  await openPreview(page);
  await openCard(page);
  const { history: before, focus: _, ...rest } = await snapshot(page);
  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect
    .poll(async () => (await snapshot(page)).history)
    .toBe(before + 1);
  const { history: __, focus, ...after } = await snapshot(page);
  expect(after).toEqual(rest);
  expect(focus).toBe("Shell:Sidebar");
});
