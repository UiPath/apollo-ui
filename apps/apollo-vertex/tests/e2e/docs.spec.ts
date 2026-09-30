import {
  fitsSurface,
  LAYOUT_TOKENS,
  occupantOrientations,
  PADDED_INSET_PX,
  PANEL_TRANSITION_DURATION_MS,
  SIDE_PANEL_TINT_STRENGTH,
} from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import { surfaceLabel } from "@/lib/surface-labels";
import { activityTimelineOccupant } from "@/registry/activity-timeline/activity-timeline.occupant";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { pageHeaderSurface } from "@/registry/page-header/page-header.surface";
import { queueOccupant } from "@/registry/queue/queue.occupant";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { stageStripOccupant } from "@/registry/stage-strip/stage-strip.occupant";
import {
  END_PANEL_WIDTH,
  MAIN_MIN_OUTER_PX,
  START_PANEL_WIDTH,
} from "@/templates/detail-page/detail-page.template";
import { expect, test } from "./fixtures";

const px = (n: number) => `${n}px`;

/** Each page, and values it must render from the specs and tokens. */
const PAGES: Record<string, string[]> = {
  "/guidelines/design-architecture": [
    px(LAYOUT_TOKENS.surfaceInset),
    px(LAYOUT_TOKENS.sidePanelWidthMin),
    px(LAYOUT_TOKENS.contentAreaWidthMin),
    `${PANEL_TRANSITION_DURATION_MS}ms`,
    `${SIDE_PANEL_TINT_STRENGTH}%`,
    px(LAYOUT_TOKENS.slotDividerWidth),
    "Page header (horizontal)",
    "Side panel (vertical), content area (vertical)",
  ],
  "/templates/detail-page": [
    px(START_PANEL_WIDTH.default),
    px(START_PANEL_WIDTH.max),
    px(END_PANEL_WIDTH.default),
    px(MAIN_MIN_OUTER_PX),
    px(MAIN_MIN_OUTER_PX + START_PANEL_WIDTH.default + END_PANEL_WIDTH.min),
    px(MAIN_MIN_OUTER_PX + START_PANEL_WIDTH.default),
    px(MAIN_MIN_OUTER_PX + END_PANEL_WIDTH.min),
    px(PADDED_INSET_PX),
  ],
  "/surfaces/page-header": [
    px(PADDED_INSET_PX),
    px(pageHeaderSurface.provides.width.min),
    pageHeaderSurface.provides.orientation,
  ],
  "/surfaces/side-panel": [
    px(sidePanelSurface.width.min),
    px(sidePanelSurface.provides.width.min),
    px(START_PANEL_WIDTH.default - 2 * PADDED_INSET_PX),
    px(END_PANEL_WIDTH.default - 2 * PADDED_INSET_PX),
    `${SIDE_PANEL_TINT_STRENGTH}%`,
    sidePanelSurface.provides.orientation,
  ],
  "/guidelines/design-architecture/creating-occupants": [
    px(stageStripOccupant.requires.minWidth),
    px(activityTimelineOccupant.requires.minWidth),
    px(queueOccupant.requires.minWidth),
    px(LAYOUT_TOKENS.sidePanelWidthMin),
  ],
  "/surfaces/content-area": [
    px(contentAreaSurface.width.min),
    px(contentAreaSurface.provides.width.min),
    contentAreaSurface.provides.orientation,
  ],
};

// Every registered occupant's page, and every surface's list of the occupants
// that fit it, from the occupant index. A new occupant is checked with no edits.
for (const { spec } of OCCUPANT_SPECS) {
  const surfaces = SURFACE_SPECS.filter(
    (surface) => fitsSurface(surface, spec).fits,
  );
  // The "Occupant" badge beside the title is checked in occupant-page.spec.ts.
  PAGES[`/patterns/${spec.name}`] = [
    `Surfaces | ${surfaces
      .map((surface) => surfaceLabel(surface.name))
      .toSorted()
      .join(", ")}`,
    `Minimum width | ${px(spec.requires.minWidth)}`,
    `Orientations | ${occupantOrientations(spec).join(", ")}`,
  ];
  for (const surface of surfaces) {
    PAGES[`/surfaces/${surface.name}`]?.push(
      `${spec.label} | ${px(spec.requires.minWidth)}`,
    );
  }
}

for (const [path, values] of Object.entries(PAGES)) {
  test(`${path} renders its values from the specs, in plain language`, async ({
    page,
  }) => {
    await page.goto(path);
    await page.locator("article, main").first().waitFor();
    const text = await page.evaluate(() =>
      [
        ...document.querySelectorAll(
          "article li, article tr, article p, article blockquote, article pre, main li, main tr, main p, main blockquote, main pre",
        ),
      ]
        .map((el) =>
          el.tagName === "TR"
            ? [...el.children].map((c) => c.textContent?.trim()).join(" | ")
            : el.textContent,
        )
        .join("\n")
        .replaceAll(/[‘’]/g, "'"),
    );
    for (const value of values) expect(text, value).toContain(value);
    expect(text).not.toMatch(/undefined|NaN|\[object/);
    // A value in inline code once rendered its expression literally.
    expect(text).not.toMatch(/\{\w+\.[\w.]+\}/);
  });
}

test("the Detail page docs embed the preview without the Configure card or URL writes", async ({
  page,
}) => {
  await page.goto("/templates/detail-page");
  await page.locator("[data-template=detail-page]").waitFor();
  await expect(page.locator("#detail-page-preview-config")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Configure" })).toHaveCount(0);
  expect(await page.evaluate(() => location.search)).toBe("");
});

test("the Surfaces section is in the nav, and every internal link resolves", async ({
  page,
}) => {
  // It visits every page and link, which grows with each occupant, and a dev
  // server compiles each page on its first visit.
  test.setTimeout(180_000);
  const links = new Set<string>();
  for (const path of Object.keys(PAGES)) {
    await page.goto(path);
    await page.locator("article, main").first().waitFor();
    const hrefs = await page
      .locator("article a[href^='/'], main a[href^='/']")
      .evaluateAll((anchors) =>
        anchors
          .filter(
            (a) =>
              !a.closest(
                "[data-sidebar], [data-template], header nav, .not-prose",
              ),
          )
          .map((a) => a.getAttribute("href")!.split("#")[0]),
      );
    for (const href of hrefs) links.add(href);
    if (path === "/guidelines/design-architecture") {
      const nav = await page.locator("aside a, nav a").allTextContents();
      expect(nav.map((t) => t.trim())).toContain("Page header");
    }
  }
  for (const href of links) {
    const response = await page.request.get(href);
    expect(response.status(), href).toBe(200);
  }
});
