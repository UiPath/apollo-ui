import { expect, openCard, openPreview, test } from "./fixtures";

const sections = (page: import("@playwright/test").Page) =>
  page.locator("#detail-page-preview-config section h2").allTextContents();

test("the card: above Configure, sections in page order, hidden when they don't apply, scrolls when tall", async ({
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
    return card.bottom <= button.top;
  });
  expect(g, "above Configure").toBe(true);
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
