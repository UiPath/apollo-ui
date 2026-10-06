import type { Page } from "@playwright/test";
import { expect, settle, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * The header's stable layout: the view switch, the title's start, and the
 * theme and panel toggles stay put between views at every width, and the
 * view's own controls swap in place with a fade.
 */

const header = (page: Page) => page.locator("[data-slot=workbench-header]");
const viewSwitch = (page: Page) =>
  page.locator("[data-slot=workbench-view-switch]");

/** Where the fixed parts sit, to the subpixel. */
const fixed = (page: Page) =>
  header(page).evaluate((el) => {
    const at = (selector: string) => {
      const found = el.querySelector(selector);
      if (!found) return null;
      const box = found.getBoundingClientRect();
      return [box.x, box.y, box.width, box.height];
    };
    return {
      switch: at("[data-slot=workbench-view-switch]"),
      title: at("h2")?.slice(0, 2),
      theme: at("[aria-label='Dark theme']"),
      panel: at(
        "[aria-controls=workbench-details], [aria-controls=workbench-inspector]",
      ),
    };
  });

async function view(page: Page, name: "Surface" | "Template") {
  await viewSwitch(page).getByRole("radio", { name }).click();
  await expect(viewSwitch(page).getByRole("radio", { name })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await settle(page);
}

// 1416px; where Sample and State collapse to selects with the list open
// (1540px); and just wide enough for their toggle groups (1542px).
for (const [width, compact] of [
  [1416, true],
  [1540, true],
  [1542, false],
] as const) {
  test(`the switch, title, and icons don't move between views at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "?occupant=queue");
    await page.evaluate(() => document.fonts.ready);
    await settle(page);
    await expect(header(page)).toHaveAttribute("data-compact", String(compact));
    const surface = await fixed(page);
    await view(page, "Template");
    const template = await fixed(page);
    expect(template).toEqual(surface);
    // And back, with nothing moved.
    await view(page, "Surface");
    expect(await fixed(page)).toEqual(surface);
  });
}

test("the view's controls swap in place: Reset keeps its room, and they fade", async ({
  page,
}) => {
  // The suite reduces motion; this one checks the fade itself.
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1416, height: 900 });
  await open(page, "?occupant=queue&view=template");
  const zone = page.locator("[data-slot=workbench-header-zone]");
  const mode = page.locator("[data-slot=workbench-mode]");
  await settle(page);
  // Measured from the theme toggle: Edit opens the inspector, which
  // narrows the header, and the zone keeps to its right edge.
  const theme = page.getByRole("button", { name: "Dark theme" });
  const offset = async () => {
    const [box, edge] = await Promise.all([
      mode.boundingBox(),
      theme.boundingBox(),
    ]);
    return {
      gap: (edge?.x ?? 0) - (box?.x ?? 0),
      width: box?.width,
    };
  };
  const before = await offset();
  await mode.getByRole("radio", { name: "Edit" }).click();
  await expect(
    page.getByRole("button", { name: "Reset layout" }),
  ).toBeVisible();
  await settle(page);
  // Reset appears in its kept room: Preview | Edit doesn't slide.
  expect(await offset()).toEqual(before);
  // A new view's controls fade in, on the workbench's motion tokens.
  const animation = () =>
    zone.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        name: style.animationName,
        duration: style.animationDuration,
      };
    });
  await view(page, "Surface");
  expect(await animation()).toEqual({ name: "enter", duration: "0.35s" });
});

test("with reduced motion, the controls swap with no fade", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "?occupant=queue&view=template");
  await view(page, "Surface");
  expect(
    await page
      .locator("[data-slot=workbench-header-zone]")
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
