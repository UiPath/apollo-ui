import type { Page } from "@playwright/test";
import { OCCUPANT_SPECS } from "@/lib/occupants.generated";
import { expect, test } from "./fixtures";

/*
 * Every occupant Patterns page: its title with the "Occupant" badge beside
 * it (outside the heading), and its Open in workbench button.
 */

/** Where the title and the badge sit, relative to each other. */
const titleRow = (page: Page) =>
  page.locator("[data-slot=occupant-title]").evaluate((row) => {
    const heading = row.querySelector("h1");
    const badge = row.querySelector("[data-slot=badge]");
    if (!heading || !badge) return null;
    // The heading's text, not its box: a heading fills whatever the row gives it.
    const range = document.createRange();
    range.selectNodeContents(heading);
    const text = range.getBoundingClientRect();
    const b = badge.getBoundingClientRect();
    return {
      inHeading: heading.contains(badge),
      // Vertically centered with the title's line.
      centered:
        Math.abs(text.top + text.height / 2 - (b.top + b.height / 2)) <= 4,
      after: b.left >= text.right,
      below: b.top >= text.bottom - 1,
    };
  });

for (const { spec } of OCCUPANT_SPECS) {
  test(`${spec.name}: the title is just the name, with the badge beside it`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`/patterns/${spec.name}`);
    await page.locator("[data-slot=occupant-title]").waitFor();
    // The page title and the outline are just the occupant's name.
    await expect(page).toHaveTitle(`${spec.label} | Apollo Vertex`);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      spec.label,
    );
    expect(await titleRow(page)).toEqual({
      inHeading: false,
      centered: true,
      after: true,
      below: false,
    });
  });

  test(`${spec.name}: Open in workbench, above the demo, opens this occupant`, async ({
    page,
  }) => {
    await page.goto(`/patterns/${spec.name}`);
    const button = page.locator("article [data-slot=workbench-entry]");
    await expect(button).toHaveText("Open in workbench");
    await expect(button).toHaveAttribute(
      "href",
      `/preview/occupants?occupant=${spec.name}`,
    );
    const demo = page.locator("article [data-slot=occupant-fixture]").first();
    expect((await button.boundingBox())?.y ?? 0).toBeLessThan(
      (await demo.boundingBox())?.y ?? 0,
    );
    await button.click();
    await page.locator("[data-slot=workbench]").waitFor();
    await expect(
      page.getByRole("heading", { level: 2, name: spec.label }),
    ).toBeVisible();
    // The "Where it fits" link, too.
    await page.goto(`/patterns/${spec.name}`);
    await expect(
      page
        .locator("article")
        .getByRole("link", { name: "occupant workbench", exact: true }),
    ).toHaveAttribute("href", `/preview/occupants?occupant=${spec.name}`);
  });
}

test("the badge wraps under the title only when the title doesn't fit beside it", async ({
  page,
}) => {
  // Too narrow for "Activity timeline" and the badge on one line.
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/patterns/activity-timeline");
  await page.locator("[data-slot=occupant-title]").waitFor();
  expect(await titleRow(page)).toMatchObject({ inHeading: false, below: true });
  // A short title fits beside it on a small screen. (At 360px the title's
  // line, which it shares with Copy page, is 1px short even for "Queue".)
  await page.setViewportSize({ width: 480, height: 800 });
  await page.goto("/patterns/queue");
  await page.locator("[data-slot=occupant-title]").waitFor();
  expect(await titleRow(page)).toMatchObject({ centered: true, after: true });
});
