import { describe, expect, it } from "vitest";
import {
  fits,
  fitsSurface,
  type OccupantSpec,
  occupantOrientations,
  type ScrollOwner,
  type SurfacePadding,
  slotHolds,
  slotInnerWidth,
} from "@/lib/composition";
import { contentAreaSurface } from "@/registry/content-area/content-area.surface";
import { pageHeaderSurface } from "@/registry/page-header/page-header.surface";
import { sidePanelSurface } from "@/registry/side-panel/side-panel.surface";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";

const slot = (name: string) => {
  const found = detailPageTemplate.slots.find((s) => s.name === name);
  if (!found) throw new Error(`No slot ${name}`);
  return found;
};
const start = slot("start-panel");
const end = slot("end-panel");
const main = slot("main");
const header = slot("header");

const occupant = (
  minWidth: number,
  padding: SurfacePadding = "padded",
  scroll: ScrollOwner | "either" = "either",
): OccupantSpec => ({
  name: "x",
  label: "X",
  titleKey: "detail_page_preview_placeholder",
  requires: { minWidth, scroll, padding },
});
const horizontal = (spec: OccupantSpec): OccupantSpec => ({
  ...spec,
  orientations: ["horizontal"],
});

describe("slotInnerWidth", () => {
  it("gives each slot's inner width, padded and flush", () => {
    expect(slotInnerWidth(start, sidePanelSurface, "padded")).toBe(272);
    expect(slotInnerWidth(end, sidePanelSurface, "padded")).toBe(312);
    expect(slotInnerWidth(main, contentAreaSurface, "padded")).toBe(432);
    expect(slotInnerWidth(start, sidePanelSurface, "flush")).toBe(320);
    expect(slotInnerWidth(end, sidePanelSurface, "flush")).toBe(360);
    expect(slotInnerWidth(main, contentAreaSurface, "flush")).toBe(480);
  });

  it("uses the header slot's guaranteed minimum, since it has no default", () => {
    expect(slotInnerWidth(header, pageHeaderSurface, "padded")).toBe(432);
    expect(slotInnerWidth(header, pageHeaderSurface, "flush")).toBe(480);
  });
});

describe("fits: width", () => {
  it.each([
    ["start", start, 272],
    ["end", end, 312],
    ["main", main, 432],
  ] as const)("%s: fits at its inner width, not 1px over", (_, s, inner) => {
    const surface = s === main ? contentAreaSurface : sidePanelSurface;
    expect(fits(s, surface, occupant(inner)).fits).toBe(true);
    expect(fits(s, surface, occupant(inner + 1)).fits).toBe(false);
  });

  it("gives a flush occupant the inset back", () => {
    expect(fits(start, sidePanelSurface, occupant(320, "flush")).fits).toBe(
      true,
    );
    expect(fits(start, sidePanelSurface, occupant(321, "flush")).fits).toBe(
      false,
    );
  });

  it("checks the header against main's floor", () => {
    expect(
      fits(header, pageHeaderSurface, horizontal(occupant(432))).fits,
    ).toBe(true);
    expect(
      fits(header, pageHeaderSurface, horizontal(occupant(433))).fits,
    ).toBe(false);
  });

  it("names the width and padding in the reason", () => {
    expect(fits(start, sidePanelSurface, occupant(273)).reasons).toEqual([
      "Needs 273px; the start-panel slot gives 272px (padded).",
    ]);
    expect(
      fits(start, sidePanelSurface, occupant(321, "flush")).reasons[0],
    ).toBe("Needs 321px; the start-panel slot gives 320px (flush).");
  });
});

describe("fits: slot, scroll, surfaces, orientation", () => {
  it("rejects a surface the slot doesn't accept", () => {
    expect(fits(main, sidePanelSurface, occupant(0)).reasons).toEqual([
      "The main slot doesn't accept side-panel.",
    ]);
    expect(fits(header, contentAreaSurface, occupant(0)).fits).toBe(false);
  });

  it("lets side panels take either scroll owner, and keeps the header from scrolling", () => {
    expect(
      fits(start, sidePanelSurface, occupant(0, "padded", "occupant")).fits,
    ).toBe(true);
    expect(
      fits(start, sidePanelSurface, occupant(0, "padded", "surface")).fits,
    ).toBe(true);
    const needsScroll = horizontal(occupant(0, "padded", "surface"));
    expect(fits(header, pageHeaderSurface, needsScroll).reasons).toEqual([
      "Needs surface scrolling; page-header supports occupant only.",
    ]);
    expect(
      fits(
        header,
        pageHeaderSurface,
        horizontal(occupant(0, "padded", "occupant")),
      ).fits,
    ).toBe(true);
  });

  it("keeps an occupant to the surfaces it lists", () => {
    const scoped = { ...horizontal(occupant(0)), surfaces: ["page-header"] };
    expect(fits(header, pageHeaderSurface, scoped).fits).toBe(true);
    expect(fits(main, contentAreaSurface, scoped).reasons).toContain(
      "Works only in page-header; this slot holds content-area.",
    );
    expect(fits(main, contentAreaSurface, occupant(0)).fits).toBe(true);
  });

  it("checks orientation, defaulting to vertical", () => {
    expect(pageHeaderSurface.provides.orientation).toBe("horizontal");
    expect(sidePanelSurface.provides.orientation).toBe("vertical");
    expect(contentAreaSurface.provides.orientation).toBe("vertical");
    expect(occupantOrientations(occupant(0))).toEqual(["vertical"]);
    expect(fits(header, pageHeaderSurface, occupant(0)).reasons).toEqual([
      "Works only in vertical surfaces; page-header is horizontal.",
    ]);
    expect(
      fits(main, contentAreaSurface, horizontal(occupant(0))).reasons,
    ).toEqual(["Works only in horizontal surfaces; content-area is vertical."]);
    const both: OccupantSpec = {
      ...occupant(0),
      orientations: ["horizontal", "vertical"],
    };
    expect(fits(header, pageHeaderSurface, both).fits).toBe(true);
    expect(fits(main, contentAreaSurface, both).fits).toBe(true);
    expect(fits(start, sidePanelSurface, both).fits).toBe(true);
    const wide = { ...both, requires: { ...both.requires, minWidth: 400 } };
    const result = fits(end, sidePanelSurface, wide);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toMatch(/^Needs 400px/);
  });

  it("lists every failed requirement, and none when it fits", () => {
    expect(
      fits(main, pageHeaderSurface, occupant(9999, "padded", "surface"))
        .reasons,
    ).toHaveLength(4);
    const all = fits(main, pageHeaderSurface, {
      ...occupant(9999, "padded", "surface"),
      surfaces: ["side-panel"],
    });
    expect(all.reasons).toHaveLength(5);
    expect(fits(main, contentAreaSurface, occupant(432))).toEqual({
      fits: true,
      reasons: [],
    });
  });
});

describe("fitsSurface", () => {
  it("checks scroll, orientation, and listed surfaces, but not width, which is the slot's", () => {
    expect(fitsSurface(sidePanelSurface, occupant(9999))).toEqual({
      fits: true,
      reasons: [],
    });
    expect(fitsSurface(pageHeaderSurface, occupant(0)).reasons).toEqual([
      "Works only in vertical surfaces; page-header is horizontal.",
    ]);
    expect(
      fitsSurface(
        pageHeaderSurface,
        horizontal(occupant(0, "padded", "surface")),
      ).reasons,
    ).toEqual(["Needs surface scrolling; page-header supports occupant only."]);
    expect(
      fitsSurface(contentAreaSurface, {
        ...occupant(0),
        surfaces: ["side-panel"],
      }).fits,
    ).toBe(false);
  });

  it("is what fits() adds after the slot and width checks", () => {
    const spec = {
      ...occupant(9999, "padded", "surface"),
      surfaces: ["side-panel"],
    };
    const all = fits(main, pageHeaderSurface, spec).reasons;
    expect(all.slice(2)).toEqual(fitsSurface(pageHeaderSurface, spec).reasons);
  });
});

describe("slotHolds", () => {
  it("is one occupant unless a slot declares a panel", () => {
    expect(slotHolds({ name: "x", required: true, surfaces: [] })).toBe("one");
    expect(
      Object.fromEntries(
        detailPageTemplate.slots.map((s) => [s.name, slotHolds(s)]),
      ),
    ).toEqual({
      header: "one",
      "start-panel": "panel",
      main: "one",
      "end-panel": "panel",
    });
  });
});
