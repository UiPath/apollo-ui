import { expect, openCard, openPreview, search, test } from "./fixtures";

const sections = (page: import("@playwright/test").Page) =>
  page.locator("#detail-page-preview-config section h2").allTextContents();

test("the card: 320px above Configure, sections in page order, hidden when they don't apply, scrolls when tall", async ({
  page,
}) => {
  await openPreview(page);
  await openCard(page);
  const g = await page.evaluate(() => {
    const card = document
      .querySelector("#detail-page-preview-config > div")!
      .getBoundingClientRect();
    const button = document
      .querySelector("[aria-controls=detail-page-preview-config]")!
      .getBoundingClientRect();
    return {
      width: card.width,
      right: card.right === button.right,
      above: card.bottom <= button.top,
    };
  });
  expect(g).toEqual({ width: 320, right: true, above: true });
  expect(await sections(page)).toEqual([
    "Layout",
    "Header",
    "Start panel",
    "Main",
    "End panel",
  ]);
  await page
    .getByRole("group", { name: "Panels", exact: true })
    .getByRole("radio", { name: "End" })
    .click();
  await expect
    .poll(() => sections(page))
    .toEqual(["Layout", "Header", "Main", "End panel"]);
  await page
    .getByRole("group", { name: "Panels", exact: true })
    .getByRole("radio", { name: "None" })
    .click();
  await expect.poll(() => sections(page)).toEqual(["Layout", "Header", "Main"]);
  await page
    .getByRole("group", { name: "Panels", exact: true })
    .getByRole("radio", { name: "Both" })
    .click();
  await page.setViewportSize({ width: 1440, height: 500 });
  const scrolls = await page.evaluate(() => {
    const card = document.querySelector("#detail-page-preview-config > div")!;
    return (
      card.scrollHeight > card.clientHeight &&
      card.getBoundingClientRect().top >= 0
    );
  });
  expect(scrolls).toBe(true);
});

test("params from the reverted panel trigger experiment are ignored and dropped", async ({
  page,
}) => {
  await openPreview(
    page,
    "?start-controls=rail&sidebar=collapsed&occupants=one&start-occupant=assistant",
  );
  expect(await search(page)).toBe("");
  await expect(
    page.locator(
      "[data-slot=side-panel-toolbar], [data-slot=page-header-leading], [data-surface=page-rail]",
    ),
  ).toHaveCount(0);
});
