import { fitsSurface } from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";
import { expect, seedTheme, test } from "./fixtures";
import {
  axeViolations,
  choose,
  floorMeasured,
  open,
  stage,
  status,
  themeColors,
  urlQuery,
} from "./workbench-helpers";

/*
 * The occupant workbench (/preview/occupants), in the surface view: panels,
 * surface switching, the doesn't-fit card, the width status, the theme, the
 * header, the dock, the frame tag, the URL, and an axe scan. The template
 * view and the per-occupant status checks have their own specs.
 */

for (const { spec } of OCCUPANT_SPECS) {
  test(`${spec.name} shows in each surface it fits, and a card elsewhere`, async ({
    page,
  }) => {
    await open(page, `?occupant=${spec.name}`);
    for (const surface of SURFACE_SPECS) {
      await page
        .getByRole("radio", {
          name: new RegExp(`^${surfaceLabel(surface.name)},`),
        })
        .click();
      const claim = fitsSurface(surface, spec);
      if (claim.fits) {
        await expect(
          stage(page).locator(
            `[data-surface-name=${surface.name}] [data-occupant=${spec.name}]`,
          ),
        ).toBeVisible();
      } else {
        const card = stage(page).locator("[data-slot=workbench-no-fit]");
        await expect(card).toContainText(
          `${spec.label} doesn't go in the ${surfaceLabel(surface.name).toLowerCase()}`,
        );
        for (const reason of claim.reasons)
          await expect(card).toContainText(reason);
        await expect(
          page.getByText("Width is available where it fits"),
        ).toBeVisible();
        await expect(page.getByRole("slider")).toHaveCount(0);
      }
    }
  });
}

test("the panel toggles collapse and reopen each panel, and keep focus", async ({
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
    await expect(toggled).toBeFocused();
    await expect(page.locator(panel)).toBeVisible({ visible: !startsOpen });
    expect(urlQuery(page)).toContain(param);
    await page.keyboard.press("Enter");
    await expect(page.locator(panel)).toBeVisible({ visible: startsOpen });
    expect(urlQuery(page)).not.toContain(param);
  }
});

test("switching surfaces moves the occupant and the page map", async ({
  page,
}) => {
  await open(page, "?occupant=queue");
  const highlighted = () =>
    page
      .locator("[data-slot=workbench-map] [data-highlighted=true]")
      .evaluateAll((regions) =>
        regions.map((r) => (r instanceof HTMLElement ? r.dataset.region : "")),
      );
  // The queue starts in the side panel: both side columns.
  expect(await highlighted()).toEqual(["start-panel", "end-panel"]);
  await page.getByRole("radio", { name: /^Content area,/ }).click();
  await expect(
    stage(page).locator(
      "[data-surface-name=content-area] [data-occupant=queue]",
    ),
  ).toBeVisible();
  expect(await highlighted()).toEqual(["main"]);
  expect(urlQuery(page)).toContain("surface=content-area");
});

test("the width status: clips below the floor, outside the range, in range", async ({
  page,
}) => {
  // The queue follows the side panel's minimum, so its floor is below 280px.
  await open(page, "?occupant=queue");
  await floorMeasured(page);
  await expect(page.locator("[data-slot=workbench-width]")).toHaveText("280px");
  await expect(status(page)).toHaveText("In range");

  const slider = page.getByRole("slider", { name: "Width" });
  await slider.focus();
  await page.keyboard.press("Home");
  await expect(page.locator("[data-slot=workbench-width]")).toHaveText("40px");
  await expect(status(page)).toHaveText("Clips");
  await expect(slider).toHaveAttribute("aria-valuetext", /Clips/);

  // Narrower than the side panel ever is, wider than the floor.
  await open(page, "?occupant=queue&width=248");
  await floorMeasured(page);
  await expect(status(page)).toHaveText("Outside range");
  await page.getByRole("slider", { name: "Width" }).focus();
  for (let step = 0; step < 8; step++) await page.keyboard.press("ArrowRight");
  await expect(page.locator("[data-slot=workbench-width]")).toHaveText("280px");
  await expect(status(page)).toHaveText("In range");
});

test("the whole view round-trips through the URL", async ({ page }) => {
  await open(page);
  await page.getByRole("button", { name: /^Key facts/ }).click();
  // Not its default surface (the page header), so it's written.
  await page.getByRole("radio", { name: /^Side panel,/ }).click();
  await choose(page, "Sample", "Stress");
  await choose(page, "State", "Agent updating");
  await page.getByRole("button", { name: "Dark theme" }).click();
  await page.getByRole("slider", { name: "Width" }).focus();
  await page.keyboard.press("ArrowRight");
  await page.getByRole("button", { name: "Show details" }).click();
  const url = urlQuery(page);
  for (const part of [
    "occupant=key-facts",
    "surface=side-panel",
    "sample=stress",
    "state=agent-updating",
    "theme=dark",
    "width=",
    "details=open",
  ])
    expect(url).toContain(part);
  expect(url).not.toContain("list=");

  await page.reload();
  await page.locator("[data-slot=workbench]").waitFor();
  expect(urlQuery(page)).toBe(url);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
  await expect(
    page.getByRole("button", { name: "Dark theme" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("combobox", { name: "Sample" })
      .or(page.getByRole("radio", { name: "Stress", exact: true })),
  ).toContainText("Stress");
  await expect(page.locator("#workbench-details")).toBeVisible();
  await expect(
    stage(page).locator(
      "[data-surface-name=side-panel] [data-occupant=key-facts]",
    ),
  ).toBeVisible();

  // Defaults aren't written.
  await open(page);
  expect(urlQuery(page)).toBe("");
});

test("a Patterns page opens the workbench with its occupant", async ({
  page,
}) => {
  await page.goto("/patterns/queue");
  // The page's own link, not the nav's "Occupant workbench" entry.
  const link = page
    .locator("article")
    .getByRole("link", { name: "occupant workbench", exact: true });
  const href = await link.getAttribute("href");
  expect(href).toBe("/preview/occupants?occupant=queue");
  await open(page, href?.replace("/preview/occupants", "") ?? "");
  await expect(
    page.getByRole("heading", { level: 2, name: "Queue" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /^Queue/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

// The workbench's theme applies everywhere on the page, whatever the site's is.
for (const site of ["light", "dark"] as const) {
  test.describe(`with the site theme ${site}`, () => {
    test.use({ theme: site });

    test("Light and Dark each render the whole workbench, back and forth", async ({
      page,
      browser,
    }) => {
      await open(page, "?occupant=queue");
      const light = await themeColors(page);
      const toggle = page.getByRole("button", { name: "Dark theme" });
      await expect(toggle).toHaveAttribute("aria-pressed", "false");
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-pressed", "true");
      const dark = await themeColors(page);
      for (const [i, color] of dark.entries()) expect(color).not.toBe(light[i]);
      await toggle.click();
      expect(await themeColors(page)).toEqual(light);
      await toggle.click();
      expect(await themeColors(page)).toEqual(dark);

      // The same colors as under the other site theme.
      const other = await browser.newContext();
      const otherPage = await other.newPage();
      await seedTheme(otherPage, site === "light" ? "dark" : "light");
      for (const [query, expected] of [
        ["?occupant=queue", light],
        ["?occupant=queue&theme=dark", dark],
      ] as const) {
        await open(otherPage, query);
        expect(await themeColors(otherPage)).toEqual(expected);
      }
      await other.close();
    });

    test("leaving the workbench puts the site theme back", async ({ page }) => {
      await open(
        page,
        `?occupant=queue&theme=${site === "light" ? "dark" : "light"}`,
      );
      await expect(page.locator("html")).toHaveClass(
        site === "light" ? /\bdark\b/ : /\blight\b/,
      );
      await page.goto("/patterns/queue");
      await expect(page.locator("html")).toHaveClass(
        new RegExp(`\\b${site}\\b`),
      );
    });
  });
}

for (const [width, view] of [
  [1280, "surface"],
  [1512, "surface"],
  [1280, "template"],
  [1512, "template"],
] as const) {
  test(`the header is one row at ${width}px in the ${view} view, with both panels open`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 800 });
    await open(
      page,
      // The template view's right-hand column is the inspector: Edit opens it.
      `?occupant=activity-timeline&details=open${view === "template" ? "&view=template&mode=edit" : ""}`,
    );
    const header = page.locator("[data-slot=workbench-header]");
    const rows = await header.evaluate((el) =>
      [...el.children]
        .filter((child) => !child.hasAttribute("inert"))
        .map((child) => {
          const box = child.getBoundingClientRect();
          return { top: box.top, bottom: box.bottom, left: box.left };
        }),
    );
    const top = Math.min(...rows.map((r) => r.top));
    const bottom = Math.max(...rows.map((r) => r.bottom));
    // One row: every item within one control's height.
    expect(bottom - top).toBeLessThanOrEqual(40);
    const lefts = rows.map((r) => r.left);
    expect(lefts).toEqual([...lefts].toSorted((a, b) => a - b));
    const list = await page
      .getByRole("button", { name: "Hide occupant list" })
      .boundingBox();
    const details = await page
      .getByRole("button", {
        name: view === "template" ? "Hide inspector" : "Hide details",
      })
      .boundingBox();
    expect(list?.x).toBe(Math.min(...lefts));
    expect(details?.x).toBe(Math.max(...lefts));
    // Sample and State work, in whichever form fits: the surface view's only.
    if (view === "surface") {
      await choose(page, "Sample", "Stress");
      expect(urlQuery(page)).toContain("sample=stress");
    } else {
      await expect(page.getByRole("group", { name: "Sample" })).toHaveCount(0);
      await expect(page.getByRole("combobox", { name: "Sample" })).toHaveCount(
        0,
      );
    }
  });
}

test("the occupant is never behind the dock", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await open(page, "?occupant=activity-timeline&details=open");
  await stage(page).evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const occupant = await stage(page)
    .locator("[data-slot=occupant-fixture]")
    .boundingBox();
  const dock = await page.locator("[data-slot=workbench-dock]").boundingBox();
  expect((occupant?.y ?? 0) + (occupant?.height ?? 0)).toBeLessThanOrEqual(
    dock?.y ?? 0,
  );
});

test("the frame tag names the surface and width, just outside the frame", async ({
  page,
}) => {
  await open(page, "?occupant=queue");
  const tag = page.locator("[data-slot=workbench-frame-tag]");
  const frame = page.locator("[data-slot=workbench-frame]");
  await expect(tag).toHaveText("Side panel · 280px");
  await expect(tag).toHaveAttribute("aria-hidden", "true");

  // Above the frame's top-left corner, never over the occupant.
  const [tagBox, frameBox] = [
    await tag.boundingBox(),
    await frame.boundingBox(),
  ];
  expect((tagBox?.y ?? 0) + (tagBox?.height ?? 0)).toBeLessThanOrEqual(
    frameBox?.y ?? 0,
  );
  expect(Math.abs((tagBox?.x ?? 0) - (frameBox?.x ?? 0))).toBeLessThanOrEqual(
    1,
  );

  // Live, as the width and the surface change.
  await page.getByRole("slider", { name: "Width" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tag).toHaveText("Side panel · 284px");
  await page.getByRole("radio", { name: /^Content area,/ }).click();
  await expect(tag).toHaveText("Content area · 480px");
});

for (const theme of ["light", "dark"] as const) {
  test(`passes an axe scan, ${theme}`, async ({ page }) => {
    await open(page, `?occupant=queue${theme === "dark" ? "&theme=dark" : ""}`);
    await floorMeasured(page);
    expect(await axeViolations(page)).toEqual([]);
  });
}
