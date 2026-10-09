import { describe, expect, it } from "vitest";
import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import { PANEL_MAX_TABS, type PanelSpec, validatePanel } from "@/lib/panel";
import {
  addAsTab,
  addToTab,
  canAddTab,
  type MoveResult,
  moveOccupant,
  moveTab,
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

describe("addAsTab at a position", () => {
  const THREE: PanelSpec = {
    surface: "side-panel",
    tabs: ["alpha", "beta", "gamma"].map((id) => ({ id, occupants: [id] })),
  };
  const ids = (panel: PanelSpec) => panel.tabs.map((tab) => tab.id);

  it("puts the new tab first at 0", () => {
    expect(ids(addAsTab(THREE, "delta", "delta", 0))).toEqual([
      "delta",
      "alpha",
      "beta",
      "gamma",
    ]);
  });

  it("puts it between two tabs in the middle", () => {
    expect(ids(addAsTab(THREE, "delta", "delta", 2))).toEqual([
      "alpha",
      "beta",
      "delta",
      "gamma",
    ]);
  });

  it("puts it last at the end, as when no position is given", () => {
    const atEnd = addAsTab(THREE, "delta", "delta", 3);
    expect(ids(atEnd)).toEqual(["alpha", "beta", "gamma", "delta"]);
    expect(addAsTab(THREE, "delta", "delta")).toEqual(atEnd);
  });

  it("keeps a position out of range within it", () => {
    expect(ids(addAsTab(THREE, "delta", "delta", -2))[0]).toBe("delta");
    expect(ids(addAsTab(THREE, "delta", "delta", 99)).at(-1)).toBe("delta");
    expect(ids(addAsTab(THREE, "delta", "delta", 1.7))[1]).toBe("delta");
  });

  it("adds nothing at any position when the panel has its most tabs", () => {
    let panel = ONE;
    for (const name of ["beta", "gamma", "delta", "epsilon"])
      panel = addAsTab(panel, name, name);
    expect(panel.tabs).toHaveLength(PANEL_MAX_TABS);
    expect(addAsTab(panel, "zeta", "zeta", 0)).toBe(panel);
    expect(addAsTab(panel, "zeta", "zeta", 2)).toBe(panel);
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

const OVERVIEW = key("label_overview");
const PEOPLE = key("label_people");
/** alpha | overview: beta, gamma, delta | epsilon */
const MIXED: PanelSpec = {
  surface: "side-panel",
  tabs: [
    { id: "alpha", occupants: ["alpha"] },
    { id: "beta", label: OVERVIEW, occupants: ["beta", "gamma", "delta"] },
    { id: "epsilon", occupants: ["epsilon"] },
  ],
};
const ids = (panel: PanelSpec) => panel.tabs.map((tab) => tab.id);
const shape = (panel: PanelSpec) =>
  panel.tabs.map((tab) =>
    [
      tab.label ?? "",
      tab.occupants
        .map((ref) => (typeof ref === "string" ? ref : ref.occupant))
        .join("."),
    ].join(":"),
  );
/** A move's panel, checked against the panel rules, or its refusal. */
const moved = (result: MoveResult) => {
  if (!result.ok) return result.refused;
  expect(validatePanel(result.panel, SPECS)).toEqual([]);
  return shape(result.panel);
};

describe("moveTab", () => {
  it("moves a tab to any place, first to last and last to first", () => {
    expect(ids(moveTab(MIXED, 0, 2))).toEqual(["beta", "epsilon", "alpha"]);
    expect(ids(moveTab(MIXED, 2, 0))).toEqual(["epsilon", "alpha", "beta"]);
    expect(ids(moveTab(MIXED, 0, 1))).toEqual(["beta", "alpha", "epsilon"]);
  });

  it("keeps a place within range, and leaves the panel be for no tab", () => {
    expect(ids(moveTab(MIXED, 0, 99))).toEqual(["beta", "epsilon", "alpha"]);
    expect(ids(moveTab(MIXED, 2, -3))).toEqual(["epsilon", "alpha", "beta"]);
    expect(moveTab(MIXED, 1, 1).tabs).toEqual(MIXED.tabs);
    expect(moveTab(MIXED, 7, 0)).toBe(MIXED);
  });
});

describe("moveOccupant", () => {
  it("reorders a stack, its first occupant naming its tab", () => {
    expect(
      moved(moveOccupant(MIXED, "delta", { tab: 1, at: 0 }, SPECS)),
    ).toEqual([":alpha", "label_overview:delta.beta.gamma", ":epsilon"]);
    // To the end, and past it.
    expect(
      moved(moveOccupant(MIXED, "beta", { tab: 1, at: 2 }, SPECS)),
    ).toEqual([":alpha", "label_overview:gamma.delta.beta", ":epsilon"]);
    const result = moveOccupant(MIXED, "beta", { tab: 1, at: 99 }, SPECS);
    expect(result.ok && ids(result.panel)).toEqual([
      "alpha",
      "gamma",
      "epsilon",
    ]);
  });

  it("stacks into another tab at a place; a tab of one takes the next label", () => {
    expect(
      moved(moveOccupant(MIXED, "gamma", { tab: 0, at: 0 }, SPECS, PEOPLE)),
    ).toEqual([
      "label_people:gamma.alpha",
      "label_overview:beta.delta",
      ":epsilon",
    ]);
    expect(
      moved(moveOccupant(MIXED, "gamma", { tab: 2, at: 1 }, SPECS, PEOPLE)),
    ).toEqual([
      ":alpha",
      "label_overview:beta.delta",
      "label_people:epsilon.gamma",
    ]);
  });

  it("an existing stack keeps its label", () => {
    expect(
      moved(moveOccupant(MIXED, "alpha", { tab: 1, at: 3 }, SPECS, PEOPLE)),
    ).toEqual(["label_overview:beta.gamma.delta.alpha", ":epsilon"]);
  });

  it("a stack left with one drops its label; a tab left empty goes", () => {
    const pair: PanelSpec = {
      surface: "side-panel",
      tabs: [
        { id: "alpha", label: OVERVIEW, occupants: ["alpha", "beta"] },
        { id: "gamma", occupants: ["gamma"] },
      ],
    };
    const result = moveOccupant(
      pair,
      "alpha",
      { tab: 1, at: 1 },
      SPECS,
      PEOPLE,
    );
    expect(moved(result)).toEqual([":beta", "label_people:gamma.alpha"]);
    // The stack's id follows its new first occupant.
    expect(result.ok && ids(result.panel)).toEqual(["beta", "gamma"]);
    expect(
      moved(moveOccupant(MIXED, "epsilon", { tab: 1, at: 0 }, SPECS)),
    ).toEqual([":alpha", "label_overview:epsilon.beta.gamma.delta"]);
  });

  it("to a new tab: at any insertion point, from a stack or alone", () => {
    expect(moved(moveOccupant(MIXED, "gamma", { newTab: 0 }, SPECS))).toEqual([
      ":gamma",
      ":alpha",
      "label_overview:beta.delta",
      ":epsilon",
    ]);
    expect(moved(moveOccupant(MIXED, "gamma", { newTab: 3 }, SPECS))).toEqual([
      ":alpha",
      "label_overview:beta.delta",
      ":epsilon",
      ":gamma",
    ]);
    // Its stack's first, it leaves the stack an id of its own.
    const result = moveOccupant(MIXED, "beta", { newTab: 1 }, SPECS);
    expect(result.ok && ids(result.panel)).toEqual([
      "alpha",
      "beta",
      "gamma",
      "epsilon",
    ]);
    // Alone in its tab, the tab moves: insertion points count as they are.
    expect(moved(moveOccupant(MIXED, "alpha", { newTab: 3 }, SPECS))).toEqual([
      "label_overview:beta.gamma.delta",
      ":epsilon",
      ":alpha",
    ]);
    expect(moved(moveOccupant(MIXED, "epsilon", { newTab: 0 }, SPECS))).toEqual(
      [":epsilon", ":alpha", "label_overview:beta.gamma.delta"],
    );
    expect(moveOccupant(MIXED, "alpha", { newTab: 1 }, SPECS)).toEqual({
      ok: true,
      panel: MIXED,
    });
  });

  it("refuses a sixth tab, but a tab of one can still move at the cap", () => {
    const full: PanelSpec = {
      surface: "side-panel",
      tabs: [
        { id: "alpha", label: OVERVIEW, occupants: ["alpha", "beta"] },
        ...["gamma", "delta", "epsilon", "zeta"].map((name) => ({
          id: name,
          occupants: [name],
        })),
      ],
    };
    expect(full.tabs).toHaveLength(PANEL_MAX_TABS);
    expect(moved(moveOccupant(full, "beta", { newTab: 5 }, SPECS))).toBe(
      "tab-cap",
    );
    expect(moved(moveOccupant(full, "zeta", { newTab: 0 }, SPECS))).toEqual([
      ":zeta",
      "label_overview:alpha.beta",
      ":gamma",
      ":delta",
      ":epsilon",
    ]);
  });

  it("refuses to stack a fill occupant, or into a fill occupant's tab", () => {
    const withViewer: PanelSpec = {
      surface: "side-panel",
      tabs: [
        { id: "alpha", occupants: ["alpha"] },
        { id: "viewer", occupants: ["viewer"] },
      ],
    };
    expect(
      moved(
        moveOccupant(withViewer, "viewer", { tab: 0, at: 0 }, SPECS, PEOPLE),
      ),
    ).toBe("fill-alone");
    expect(
      moved(
        moveOccupant(withViewer, "alpha", { tab: 1, at: 1 }, SPECS, PEOPLE),
      ),
    ).toBe("fill-alone");
    // A fill occupant can still move as its own tab.
    expect(
      moved(moveOccupant(withViewer, "viewer", { newTab: 0 }, SPECS)),
    ).toEqual([":viewer", ":alpha"]);
  });

  it("refuses a new stack with no label to give it", () => {
    expect(moved(moveOccupant(MIXED, "gamma", { tab: 0, at: 1 }, SPECS))).toBe(
      "no-label",
    );
  });

  it("leaves the panel be for an occupant or tab it doesn't have", () => {
    expect(moveOccupant(MIXED, "nobody", { newTab: 0 }, SPECS)).toEqual({
      ok: true,
      panel: MIXED,
    });
    expect(moveOccupant(MIXED, "alpha", { tab: 9, at: 0 }, SPECS)).toEqual({
      ok: true,
      panel: MIXED,
    });
  });
});
