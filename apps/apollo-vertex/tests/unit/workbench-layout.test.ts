import { describe, expect, it } from "vitest";
import {
  layoutMenu,
  placementCopy,
  reasonCopy,
} from "@/app/preview/occupants/workbench-layout";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";
import { twoUpTemplate } from "./fixtures/two-up-template";

// The workbench's layout rules, from what a template declares.

describe("layoutMenu", () => {
  it("locks nothing the template's layout allows: no slot is focused", () => {
    const menu = layoutMenu(detailPageTemplate, {});
    const options = menu.flatMap((s) => [
      ...(s.present ?? []),
      ...(s.open ?? []),
      ...(s.placement ?? []),
    ]);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.lock === null)).toBe(true);
    // Every panel can be left out and closed.
    for (const slot of ["start-panel", "end-panel"]) {
      const section = menu.find((s) => s.slot === slot);
      expect(section?.present?.map((o) => o.value)).toEqual([true, false]);
      expect(section?.open?.map((o) => o.value)).toEqual([true, false]);
    }
  });

  it("offers nothing for a slot that declares no choices", () => {
    const menu = layoutMenu(detailPageTemplate, {});
    expect(menu.map((s) => s.slot)).toEqual(["start-panel", "end-panel"]);
  });
});

describe("a template's own copy", () => {
  it("uses the template's words where it declares them", () => {
    expect(reasonCopy(detailPageTemplate, "rule")).toBe(
      "detail_page_closed_by_main_width",
    );
    expect(placementCopy(detailPageTemplate, "beside-header")).toBe(
      "detail_page_placement_beside_header",
    );
  });

  it("falls back to a neutral line where it declares none", () => {
    expect(reasonCopy(twoUpTemplate, "rule")).toBe(
      "workbench_layout_closed_by_layout_rule",
    );
    expect(reasonCopy(detailPageTemplate, "refused")).toBe(
      "workbench_layout_refused",
    );
    expect(reasonCopy(twoUpTemplate, "unknown-code")).toBe(
      "workbench_layout_closed_by_layout_rule",
    );
    expect(placementCopy(twoUpTemplate, "anywhere")).toBeNull();
  });
});
