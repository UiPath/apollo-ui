import { describe, expect, it } from "vitest";
import { ghostBox, leftOutSlots } from "@/app/preview/occupants/ghost-geometry";
import { resolveLayout } from "@/lib/layout";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";

// Where a left-out slot's ghost goes: its own area, as if it were there.

const template = { x: 100, y: 50, width: 1000, height: 800 };

describe("a left-out slot's ghost", () => {
  it("knows which slots are left out", () => {
    expect(
      leftOutSlots(detailPageTemplate, { "start-panel": { present: false } }),
    ).toEqual(["start-panel"]);
    expect(leftOutSlots(detailPageTemplate, {})).toEqual([]);
  });

  it("sits where the slot would, by the layout's own tracks", () => {
    const choices = { "start-panel": { present: false } };
    const box = ghostBox(detailPageTemplate, choices, "start-panel", template);
    if (!box) throw new Error("No ghost box");
    // The start panel's area: its columns and rows, as if included.
    const layout = resolveLayout(detailPageTemplate, {});
    const used = layout.columns.filter((c) => c.used);
    const total = used.reduce((sum, c) => sum + c.size, 0);
    const start = layout.regions.find((r) => r.slot === "start-panel");
    const first = used.findIndex((c) => c.name === start?.columns[0]);
    const before = used.slice(0, first).reduce((sum, c) => sum + c.size, 0);
    expect(box.x).toBeCloseTo(100 + (1000 * before) / total);
    expect(box.width).toBeGreaterThan(0);
    expect(box.width).toBeLessThan(1000);
    expect(box.y).toBeGreaterThanOrEqual(50);
    expect(box.y + box.height).toBeLessThanOrEqual(850);
    // The end panel's is on the other side.
    const end = ghostBox(
      detailPageTemplate,
      { "end-panel": { present: false } },
      "end-panel",
      template,
    );
    expect((end?.x ?? 0) + (end?.width ?? 0)).toBeCloseTo(1100);
  });

  it("lines its edges up with a slot that's there, sharing their track", () => {
    const choices = { "start-panel": { present: false } };
    // Main, as rendered, starts 130px down: the header row's real height.
    const main = { x: 100, y: 180, width: 700, height: 670 };
    const box = ghostBox(detailPageTemplate, choices, "start-panel", template, {
      main,
    });
    expect(box?.y).toBe(180);
    expect((box?.y ?? 0) + (box?.height ?? 0)).toBe(850);
  });
});
