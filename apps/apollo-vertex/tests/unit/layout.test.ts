import { describe, expect, it } from "vitest";
import type { TemplateSpec } from "@/lib/composition";
import { type LayoutChoices, resolveLayout, slotControls } from "@/lib/layout";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";

// resolveLayout() for the Detail page's declared layout, and the rules it
// applies to any template's.

const areas = (choices: LayoutChoices = {}) =>
  Object.fromEntries(
    resolveLayout(detailPageTemplate, choices).regions.map((r) => [
      r.slot,
      `${r.columns.join("-")}/${r.rows.join("-")}${r.open ? "" : " closed"}`,
    ]),
  );
const used = (choices: LayoutChoices = {}) => {
  const layout = resolveLayout(detailPageTemplate, choices);
  return {
    columns: layout.columns.filter((t) => t.used).map((t) => t.name),
    rows: layout.rows.filter((t) => t.used).map((t) => t.name),
  };
};

describe("resolveLayout for the Detail page", () => {
  it("lays out every slot by default, the header across the top", () => {
    expect(areas()).toEqual({
      header: "start-end/header-header",
      "start-panel": "start-start/body-body",
      main: "main-main/body-body",
      "end-panel": "end-end/body-body",
    });
    expect(used()).toEqual({
      columns: ["start", "main", "end"],
      rows: ["header", "body"],
    });
  });

  it("leaves out an optional panel, and its column takes no room", () => {
    const choices = { "start-panel": { present: false } };
    expect(areas(choices)).not.toHaveProperty("start-panel");
    expect(used(choices).columns).toEqual(["main", "end"]);
  });

  it("keeps a closed panel in its place", () => {
    expect(areas({ "end-panel": { open: false } })["end-panel"]).toBe(
      "end-end/body-body closed",
    );
  });

  it("runs a beside-header panel the full height, and moves the header over", () => {
    expect(areas({ "start-panel": { placement: "beside-header" } })).toEqual({
      header: "main-end/header-header",
      "start-panel": "start-start/header-body",
      main: "main-main/body-body",
      "end-panel": "end-end/body-body",
    });
    const both = areas({
      "start-panel": { placement: "beside-header" },
      "end-panel": { placement: "beside-header" },
    });
    expect(both.header).toBe("main-main/header-header");
  });

  it("treats an unknown placement as the slot's own area", () => {
    expect(areas({ "end-panel": { placement: "nope" } })["end-panel"]).toBe(
      "end-end/body-body",
    );
  });

  it("never leaves out a required slot", () => {
    expect(areas({ main: { present: false } })).toHaveProperty("main");
  });
});

describe("resolveLayout's rules for any template", () => {
  const twoUp: TemplateSpec = {
    name: "two-up",
    slots: [
      { name: "left", required: true, surfaces: ["content-area"] },
      { name: "right", required: false, surfaces: ["side-panel"] },
      { name: "band", required: false, surfaces: ["page-header"] },
    ],
    layout: {
      columns: [
        { name: "a", size: 1 },
        { name: "b", size: 1 },
        { name: "c", size: 1 },
      ],
      rows: [{ name: "top", size: 1 }],
      areas: {
        left: { columns: ["a", "a"], rows: ["top", "top"] },
        right: { columns: ["c", "c"], rows: ["top", "top"] },
        band: { columns: ["b", "b"], rows: ["top", "top"] },
      },
      options: {
        band: {
          optional: true,
          placements: { wide: { columns: ["a", "c"], rows: ["top", "top"] } },
        },
      },
    },
  };

  // The type requires a layout; data that skips the types can lack one.
  it("has nothing to lay out without a declared layout", () => {
    const bare = { name: "bare", slots: [] } as unknown as TemplateSpec;
    expect(resolveLayout(bare).regions).toEqual([]);
  });

  it("refuses a placement that would cut a slot in two", () => {
    expect(() =>
      resolveLayout(
        {
          ...twoUp,
          layout: {
            ...(twoUp.layout ?? { columns: [], rows: [], areas: {} }),
            areas: {
              left: { columns: ["a", "c"], rows: ["top", "top"] },
              band: { columns: ["a", "a"], rows: ["top", "top"] },
            },
            options: {
              left: {},
              band: {
                placements: {
                  mid: { columns: ["b", "b"], rows: ["top", "top"] },
                },
              },
            },
          },
          slots: [
            { name: "left", required: true, surfaces: [] },
            { name: "band", required: false, surfaces: [] },
          ],
        },
        { band: { placement: "mid" } },
      ),
    ).toThrow("would cut left in two");
  });

  it("refuses a placement that leaves a slot no room", () => {
    expect(() => resolveLayout(twoUp, { band: { placement: "wide" } })).toThrow(
      "leaves left no room",
    );
  });
});

describe("slotControls", () => {
  it("offers only what the Detail page declares, for its panels", () => {
    const controls = slotControls(detailPageTemplate);
    expect(controls.map((c) => c.slot)).toEqual(["start-panel", "end-panel"]);
    for (const control of controls) {
      expect(control.present?.map((o) => o.value)).toEqual([true, false]);
      expect(control.open?.map((o) => o.value)).toEqual([true, false]);
      expect(control.placement?.map((o) => o.value)).toEqual([
        "below-header",
        "beside-header",
      ]);
      const all = [
        ...(control.present ?? []),
        ...(control.open ?? []),
        ...(control.placement ?? []),
      ];
      expect(all.every((o) => !o.refused)).toBe(true);
    }
  });

  it("marks a choice the layout would refuse", () => {
    const tight: TemplateSpec = {
      name: "tight",
      slots: [
        { name: "body", required: true, surfaces: [] },
        { name: "rail", required: false, surfaces: [] },
      ],
      layout: {
        columns: [
          { name: "a", size: 1 },
          { name: "b", size: 1 },
        ],
        rows: [{ name: "r", size: 1 }],
        areas: {
          body: { columns: ["a", "a"], rows: ["r", "r"] },
          rail: { columns: ["b", "b"], rows: ["r", "r"] },
        },
        options: {
          rail: {
            optional: true,
            // Taking column a would leave body no room.
            placements: { over: { columns: ["a", "a"], rows: ["r", "r"] } },
          },
        },
      },
    };
    const [rail] = slotControls(tight);
    expect(rail?.slot).toBe("rail");
    expect(rail?.open).toBeUndefined();
    expect(rail?.placement).toEqual([
      { value: "default", refused: false },
      { value: "over", refused: true },
    ]);
  });
});
