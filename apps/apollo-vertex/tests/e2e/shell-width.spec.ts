import { SHELL_WIDTH } from "@/app/preview/occupants/workbench-url-state";
import { expect, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * The workbench counts each shell's width into the page width (SHELL_WIDTH),
 * a copy of the Shell's own --sidebar-width, which the Shell doesn't export.
 * This fails when the two drift apart.
 */

test("SHELL_WIDTH matches the Shell's rendered --sidebar-width", async ({
  page,
}) => {
  await open(page, "?occupant=queue&view=template");
  const shell = page.locator(
    "[data-slot=workbench-page] [data-slot=sidebar-wrapper]",
  );
  await expect(shell).toHaveCount(1);
  const rendered = await shell.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--sidebar-width").trim(),
  );
  expect(rendered).toBe(`${SHELL_WIDTH.sidebar}px`);
});

test("the minimal shell takes no width beside the page", async ({ page }) => {
  await open(page, "?occupant=queue&view=template&shell=minimal");
  await expect(
    page.locator("[data-slot=workbench-page] [data-slot=sidebar]"),
  ).toHaveCount(0);
  expect(SHELL_WIDTH.minimal).toBe(0);
});
