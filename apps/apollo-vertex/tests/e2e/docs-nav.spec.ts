import type { Page } from "@playwright/test";
import { fitsSurface } from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";
import { expect, test } from "./fixtures";
import { open } from "./workbench-helpers";

/*
 * Guidelines > Design architecture, the old URLs that moved into it, and
 * every way into the occupant workbench from the docs.
 */

const CREATING = "/guidelines/design-architecture/creating-occupants";

/** A sidebar folder's items: their text, where they go, and whether they carry an icon. */
const folderItems = (page: Page, folder: string) =>
  // The nav, not the table of contents: the aside that lists Guidelines.
  page
    .locator("aside")
    .filter({ hasText: "Guidelines" })
    .first()
    .evaluate((aside, name) => {
      const toggle = [...aside.querySelectorAll("button, a")].find(
        (el) => el.textContent?.trim() === name,
      );
      return [...(toggle?.closest("li")?.querySelectorAll("ul a") ?? [])].map(
        (a) => ({
          text: a.textContent?.trim(),
          href: a.getAttribute("href"),
          icon: a.querySelector("svg") !== null,
        }),
      );
    }, folder);

test("Design architecture is a folder: Overview, Creating occupants, and the workbench", async ({
  page,
}) => {
  await page.goto(CREATING);
  await page.locator("article").waitFor();
  expect(await folderItems(page, "Design architecture")).toEqual([
    { text: "Overview", href: "/guidelines/design-architecture", icon: false },
    { text: "Creating occupants", href: CREATING, icon: false },
    // It opens outside the docs layout, so it carries the site's arrow.
    { text: "Occupant workbench", href: "/preview/occupants", icon: true },
  ]);
  // Creating occupants is no longer a Guidelines page of its own.
  expect(
    await page
      .locator("aside a[href='/guidelines/creating-occupants']")
      .count(),
  ).toBe(0);
});

test("the old URLs still work", async ({ page }) => {
  // The overview kept its path.
  expect(
    (await page.request.get("/guidelines/design-architecture")).status(),
  ).toBe(200);
  // Creating occupants moved, and its old path redirects there, permanently.
  const moved = await page.request.get("/guidelines/creating-occupants", {
    maxRedirects: 0,
  });
  expect(moved.status()).toBe(308);
  expect(moved.headers().location).toBe(CREATING);
  await page.goto("/guidelines/creating-occupants");
  expect(new URL(page.url()).pathname).toBe(CREATING);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Creating occupants",
  );
});

test("Creating occupants opens the workbench near the top and at Try it", async ({
  page,
}) => {
  await page.goto(CREATING);
  const button = page.locator("article [data-slot=workbench-entry]");
  await expect(button).toHaveText("Open the workbench");
  await expect(button).toHaveAttribute("href", "/preview/occupants");
  // Near the top: before the first section.
  const first = page.getByRole("heading", { level: 2 }).first();
  expect((await button.boundingBox())?.y ?? 0).toBeLessThan(
    (await first.boundingBox())?.y ?? 0,
  );
  // And in the step where the author tries their occupant.
  const tryIt = page.getByRole("heading", { name: "2. Try it" });
  const stepLink = page
    .locator("article")
    .getByRole("link", { name: "occupant workbench", exact: true });
  expect((await stepLink.boundingBox())?.y ?? 0).toBeGreaterThan(
    (await tryIt.boundingBox())?.y ?? 0,
  );
  await expect(stepLink).toHaveAttribute("href", "/preview/occupants");
});

// Each surface page's "Occupants that fit here" opens that occupant in that surface.
for (const surface of SURFACE_SPECS) {
  const fitting = OCCUPANT_SPECS.filter(
    ({ spec }) => fitsSurface(surface, spec).fits,
  );
  test(`the ${surface.name} page opens each occupant that fits in the workbench, in that surface`, async ({
    page,
  }) => {
    await page.goto(`/surfaces/${surface.name}`);
    for (const { spec } of fitting) {
      const link = page.getByRole("link", {
        name: `Open in workbench for ${spec.label}`,
      });
      await expect(link).toHaveAttribute(
        "href",
        `/preview/occupants?occupant=${spec.name}&surface=${surface.name}`,
      );
    }
    const first = fitting[0]?.spec;
    if (!first) return;
    await page
      .getByRole("link", { name: `Open in workbench for ${first.label}` })
      .click();
    await page.locator("[data-slot=workbench]").waitFor();
    await expect(
      page.getByRole("heading", { level: 2, name: first.label }),
    ).toBeVisible();
    await expect(
      page.getByRole("radio", {
        name: new RegExp(`^${surfaceLabel(surface.name)},`),
      }),
    ).toHaveAttribute("aria-checked", "true");
  });
}

test("after moving between docs pages in the app, the workbench leads back to the last one", async ({
  page,
}) => {
  await page.goto("/guidelines/design-architecture");
  await page.evaluate(() => {
    (window as unknown as { loadedOnce: boolean }).loadedOnce = true;
  });
  await page.locator('article a[href="/surfaces/side-panel"]').first().click();
  await page.waitForURL("**/surfaces/side-panel");
  // A client-side move: the first page's window is still here.
  expect(
    await page.evaluate(
      () => (window as unknown as { loadedOnce?: boolean }).loadedOnce,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Open in workbench for Queue" }).click();
  await page.locator("[data-slot=workbench]").waitFor();
  await expect(
    page.getByRole("link", { name: "Back to docs" }),
  ).toHaveAttribute("href", "/surfaces/side-panel");
});

test("the workbench leads back to the docs page that opened it, with the list open or collapsed", async ({
  page,
}) => {
  await page.goto("/surfaces/side-panel");
  await page.getByRole("link", { name: "Open in workbench for Queue" }).click();
  await page.locator("[data-slot=workbench]").waitFor();
  const back = page.getByRole("link", { name: "Back to docs" });
  await expect(back).toHaveAttribute("href", "/surfaces/side-panel");
  await page.getByRole("button", { name: "Hide occupant list" }).click();
  // Still there, in the header, while the list is collapsed.
  await expect(page.getByRole("link", { name: "Back to docs" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to docs" }),
  ).toHaveAttribute("href", "/surfaces/side-panel");
  // Opened some other way, it goes to the Design architecture overview.
  await page.evaluate(() => sessionStorage.clear());
  await open(page);
  await expect(
    page.getByRole("link", { name: "Back to docs" }),
  ).toHaveAttribute("href", "/guidelines/design-architecture");
});
