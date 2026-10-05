import { describe, expect, it } from "vitest";
import {
  layoutMenu,
  placementCopy,
  reasonCopy,
  withFocus,
} from "@/app/preview/occupants/workbench-layout";
import type { TemplateSpec } from "@/lib/composition";
import { detailPageTemplate } from "@/templates/detail-page/detail-page.template";
import { twoUpTemplate } from "./fixtures/two-up-template";

// The workbench's layout rules, from what a template declares.

describe("withFocus", () => {
  it("keeps an optional, closable focused slot present and open", () => {
    const choices = {
      "start-panel": {
        present: false,
        open: false,
        placement: "beside-header",
      },
    };
    expect(withFocus(detailPageTemplate, choices, "start-panel")).toEqual({
      "start-panel": { present: true, open: true, placement: "beside-header" },
    });
  });

  it("leaves a slot with no such options alone", () => {
    const choices = { "end-panel": { open: false } };
    expect(withFocus(detailPageTemplate, choices, "main")).toBe(choices);
  });

  it("fixes only what the slot's options let a page change", () => {
    const closableOnly: TemplateSpec = {
      name: "closable-only",
      slots: [{ name: "drawer", required: true, surfaces: [] }],
      layout: {
        columns: [{ name: "a", size: 1 }],
        rows: [{ name: "r", size: 1 }],
        areas: { drawer: { columns: ["a", "a"], rows: ["r", "r"] } },
        options: { drawer: { closable: true } },
      },
    };
    expect(
      withFocus(closableOnly, { drawer: { open: false } }, "drawer"),
    ).toEqual({ drawer: { open: true } });
  });
});

describe("layoutMenu", () => {
  it("locks leaving out or closing the focused slot, and nothing else", () => {
    const menu = layoutMenu(detailPageTemplate, {}, "start-panel");
    const start = menu.find((s) => s.slot === "start-panel");
    const end = menu.find((s) => s.slot === "end-panel");
    expect(start?.present).toEqual([
      { value: true, lock: null },
      { value: false, lock: "focus" },
    ]);
    expect(start?.open).toEqual([
      { value: true, lock: null },
      { value: false, lock: "focus" },
    ]);
    expect(start?.placement?.every((o) => o.lock === null)).toBe(true);
    const endOptions = [
      ...(end?.present ?? []),
      ...(end?.open ?? []),
      ...(end?.placement ?? []),
    ];
    expect(endOptions.every((o) => o.lock === null)).toBe(true);
  });

  it("offers nothing for a slot that declares no choices", () => {
    const menu = layoutMenu(detailPageTemplate, {}, "main");
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
