import type { Page } from "@playwright/test";
import { expect, openCard, openPreview, pick, search, test } from "./fixtures";

const layout = (page: Page) =>
  page.evaluate(() => {
    const panel = (side: string) =>
      document.querySelector<HTMLElement>(
        `[data-surface=side-panel][data-side=${side}]`,
      );
    const template = document
      .querySelector("[data-template]")!
      .getBoundingClientRect();
    const start = document
      .querySelector("[data-slot=detail-page-start-panel]")
      ?.getBoundingClientRect();
    return {
      minimal:
        !document.querySelector("[data-sidebar=sidebar]") &&
        template.left === 0,
      start: panel("start")?.dataset.state ?? null,
      end: panel("end")?.dataset.state ?? null,
      startBeside: start
        ? Math.round(start.top) === Math.round(template.top)
        : false,
      mainPadding: document.querySelector<HTMLElement>(
        "[data-surface=content-area]",
      )!.dataset.padding,
      cardOpen: !document.querySelector<HTMLElement>(
        "#detail-page-preview-config",
      )!.hidden,
    };
  });

test("settings are written as readable non-default params and restored on reload", async ({
  page,
}) => {
  await openPreview(page);
  expect(await search(page)).toBe("");
  const configure = page.getByRole("button", { name: "Configure" });
  await expect(configure).toHaveAttribute("aria-expanded", "false");
  await openCard(page);
  await expect(configure).toHaveAttribute("aria-expanded", "true");
  await pick(page, "Shell", "Minimal");
  await pick(page, "Start panel placement", "Beside header");
  await pick(page, "End panel state", "Closed");
  await pick(page, "Main padding", "Flush");
  const q =
    "?shell=minimal&start=beside-header&end-state=closed&main-padding=flush";
  expect(await search(page)).toBe(q);
  await configure.click();
  expect((await layout(page)).cardOpen).toBe(false);
  expect(await search(page)).toBe(q);
  // Whether the card is open is never stored.
  await page.reload();
  await page.locator("[data-template]").waitFor();
  await expect
    .poll(() => layout(page))
    .toEqual({
      minimal: true,
      start: "open",
      end: "closed",
      startBeside: true,
      mainPadding: "flush",
      cardOpen: false,
    });
  expect(await search(page)).toBe(q);
});

test("a shared link renders as written", async ({ page }) => {
  await openPreview(page, "?shell=minimal&panels=both&start=beside-header");
  const g = await layout(page);
  expect([g.minimal, g.startBeside, g.start, g.end]).toEqual([
    true,
    true,
    "open",
    "open",
  ]);
});

test("the rule's closes are never written to the URL", async ({ page }) => {
  await openPreview(page, "", 1200);
  expect((await layout(page)).start).toBe("closed");
  expect(await search(page)).toBe("");
});

test("invalid values fall back to the defaults and are dropped", async ({
  page,
}) => {
  await openPreview(
    page,
    "?shell=bogus&panels=start&main-padding=huge&end=sideways",
  );
  const g = await layout(page);
  expect([g.minimal, g.start, g.end, g.mainPadding]).toEqual([
    false,
    "open",
    null,
    "padded",
  ]);
  expect(await search(page)).toBe("?panels=start");
});
