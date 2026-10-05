import { describe, expect, it } from "vitest";
import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import { PANEL_MAX_TABS, type PanelSpec, validatePanel } from "@/lib/panel";
import {
  addAsTab,
  addToTab,
  canAddTab,
  removeOccupant,
  stackProblem,
} from "@/lib/panel-editing";

// Made-up keys for made-up occupants; real specs are checked against en.json.
const key = (name: string) => name as LocaleKey;

const spec = (
  name: string,
  extra: Partial<OccupantSpec> = {},
): OccupantSpec => ({
  name,
  label: name,
  titleKey: key(`${name}_title`),
  requires: { minWidth: 0, scroll: "either" },
  ...extra,
});
const SPECS = [
  spec("alpha"),
  spec("beta"),
  spec("gamma"),
  spec("delta"),
  spec("epsilon"),
  spec("zeta"),
  spec("viewer", { sizing: "fill" }),
];
const ONE: PanelSpec = {
  surface: "side-panel",
  tabs: [{ id: "alpha", occupants: ["alpha"] }],
};

describe("addAsTab", () => {
  it("adds the occupant in a new tab at the end", () => {
    const next = addAsTab(ONE, "beta", "beta");
    expect(next.tabs).toEqual([
      { id: "alpha", occupants: ["alpha"] },
      { id: "beta", occupants: ["beta"] },
    ]);
    expect(validatePanel(next, SPECS)).toEqual([]);
  });

  it(`stops at ${PANEL_MAX_TABS} tabs`, () => {
    let panel = ONE;
    for (const name of ["beta", "gamma", "delta", "epsilon"])
      panel = addAsTab(panel, name, name);
    expect(panel.tabs).toHaveLength(PANEL_MAX_TABS);
    expect(canAddTab(panel)).toBe(false);
    expect(addAsTab(panel, "zeta", "zeta")).toBe(panel);
  });
});

describe("addToTab", () => {
  it("stacks into a tab, giving it the label", () => {
    const next = addToTab(ONE, 0, "beta", SPECS, key("stack_label"));
    expect(next.tabs).toEqual([
      { id: "alpha", label: "stack_label", occupants: ["alpha", "beta"] },
    ]);
    expect(validatePanel(next, SPECS)).toEqual([]);
  });

  it("keeps a stack's own label", () => {
    const stacked = addToTab(ONE, 0, "beta", SPECS, key("first"));
    const next = addToTab(stacked, 0, "gamma", SPECS, key("second"));
    expect(next.tabs[0]?.label).toBe("first");
    expect(next.tabs[0]?.occupants).toEqual(["alpha", "beta", "gamma"]);
  });

  it("needs a label to make a stack", () => {
    expect(addToTab(ONE, 0, "beta", SPECS)).toBe(ONE);
  });

  it("refuses a fill occupant, either way round", () => {
    const [first] = ONE.tabs;
    if (!first) throw new Error("No tab");
    expect(stackProblem(first, "viewer", SPECS)).toBe("fill-alone");
    expect(stackProblem(first, "beta", SPECS)).toBeNull();
    expect(addToTab(ONE, 0, "viewer", SPECS, key("label"))).toBe(ONE);
    const withViewer = addAsTab(ONE, "viewer", "viewer");
    expect(addToTab(withViewer, 1, "beta", SPECS, key("label"))).toBe(
      withViewer,
    );
  });

  it("leaves the panel alone for a tab that isn't there", () => {
    expect(addToTab(ONE, 3, "beta", SPECS, key("label"))).toBe(ONE);
  });
});

describe("removeOccupant", () => {
  it("drops a stack's label when it's back to one occupant", () => {
    const stacked = addToTab(ONE, 0, "beta", SPECS, key("stack_label"));
    expect(removeOccupant(stacked, "beta").tabs).toEqual([
      { id: "alpha", occupants: ["alpha"] },
    ]);
  });

  it("removes a tab it empties", () => {
    const two = addAsTab(ONE, "beta", "beta");
    expect(removeOccupant(two, "beta")).toEqual(ONE);
  });

  it("keeps a stack that still has several occupants", () => {
    let panel = addToTab(ONE, 0, "beta", SPECS, key("stack_label"));
    panel = addToTab(panel, 0, "gamma", SPECS);
    expect(removeOccupant(panel, "beta").tabs).toEqual([
      { id: "alpha", label: "stack_label", occupants: ["alpha", "gamma"] },
    ]);
  });
});
