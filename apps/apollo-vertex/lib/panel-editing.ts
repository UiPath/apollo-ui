import {
  type LocaleKey,
  type OccupantSpec,
  occupantSizing,
} from "@/lib/composition";
import {
  type OccupantRef,
  PANEL_MAX_TABS,
  type PanelSpec,
  type TabSpec,
} from "@/lib/panel";

/*
 * Tooling. Edits a panel's tabs and stacks the way a composer does: put an
 * occupant in a new tab, stack it into an existing tab, or take it out.
 * Each edit returns a new panel, and refuses one that would break the
 * panel rules (see validatePanel). Not shipped; for previews and the
 * workbench.
 */

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

const isFill = (name: string, specs: readonly OccupantSpec[]) => {
  const spec = specs.find((s) => s.name === name);
  return spec ? occupantSizing(spec) === "fill" : false;
};

/** Whether the panel has room for another tab. */
export const canAddTab = (panel: PanelSpec) =>
  panel.tabs.length < PANEL_MAX_TABS;

/**
 * The panel with the occupant in a new tab: at `at`, a position among the
 * tabs (0 is first), kept within range, or at the end when it's left out.
 * Unchanged when the panel has no room for another tab.
 */
export function addAsTab(
  panel: PanelSpec,
  ref: OccupantRef,
  id: string,
  at: number = panel.tabs.length,
): PanelSpec {
  if (!canAddTab(panel)) return panel;
  const index = Math.min(Math.max(Math.trunc(at), 0), panel.tabs.length);
  const tabs = [...panel.tabs];
  tabs.splice(index, 0, { id, occupants: [ref] });
  return { ...panel, tabs };
}

/**
 * Why the occupant can't be stacked into the tab, or null when it can: a
 * fill occupant is alone in its tab, whichever side of the stack it's on.
 */
export function stackProblem(
  tab: TabSpec,
  name: string,
  specs: readonly OccupantSpec[],
): "fill-alone" | null {
  const fills =
    isFill(name, specs) ||
    tab.occupants.some((ref) => isFill(refName(ref), specs));
  return fills ? "fill-alone" : null;
}

/**
 * The panel with the occupant stacked into a tab. A tab that becomes a
 * stack needs a label, so give one when the tab has none. Unchanged when
 * the stack isn't allowed or there's no label for it.
 */
export function addToTab(
  panel: PanelSpec,
  index: number,
  ref: OccupantRef,
  specs: readonly OccupantSpec[],
  label?: LocaleKey,
): PanelSpec {
  const tab = panel.tabs[index];
  if (!tab || stackProblem(tab, refName(ref), specs)) return panel;
  const tabLabel = tab.label ?? label;
  if (!tabLabel) return panel;
  const tabs = panel.tabs.map((t, i) =>
    i === index
      ? { ...t, label: tabLabel, occupants: [...t.occupants, ref] }
      : t,
  );
  return { ...panel, tabs };
}

/**
 * The panel without the occupant. A tab back to one occupant drops its
 * label, so it takes that occupant's title again; an emptied tab goes.
 */
export function removeOccupant(panel: PanelSpec, name: string): PanelSpec {
  const tabs = panel.tabs
    .map((tab): TabSpec => {
      const occupants = tab.occupants.filter((ref) => refName(ref) !== name);
      if (occupants.length > 1) return { ...tab, occupants };
      return { id: tab.id, occupants };
    })
    .filter((tab) => tab.occupants.length > 0);
  return { ...panel, tabs };
}

/** Where a moved occupant goes: into a tab at a place in its stack, or a new tab. */
export type MoveTarget = { tab: number; at: number } | { newTab: number };

/** Why a move is refused: the panel rules it would break. */
export type MoveRefusal = "fill-alone" | "tab-cap" | "no-label";

export type MoveResult =
  | { ok: true; panel: PanelSpec }
  | { ok: false; refused: MoveRefusal };

const clamp = (value: number, max: number) =>
  Math.min(Math.max(Math.trunc(value), 0), max);

/**
 * The panel with a tab moved from one place to another, both among its
 * tabs (0 is first), kept within range. Moving a tab never breaks a rule.
 */
export function moveTab(panel: PanelSpec, from: number, to: number): PanelSpec {
  const tab = panel.tabs[from];
  if (!tab) return panel;
  const tabs = panel.tabs.filter((_, i) => i !== from);
  tabs.splice(clamp(to, tabs.length), 0, tab);
  return { ...panel, tabs };
}

/**
 * A tab without one of its occupants: back to one, it drops its label and
 * takes that occupant's title again; its id follows its first occupant,
 * as a tab's id is its first occupant.
 */
function without(tab: TabSpec, name: string): TabSpec {
  const occupants = tab.occupants.filter((ref) => refName(ref) !== name);
  const [first] = occupants;
  const id = tab.id === name && first ? refName(first) : tab.id;
  if (occupants.length > 1) return { ...tab, id, occupants };
  return { id, occupants };
}

/**
 * The panel with an occupant moved: within its stack, into another tab at
 * a place in that tab's stack, or to a new tab at a place among the tabs
 * as they are now (an insertion point, 0 to the number of tabs). The
 * panel rules hold for the result, or the move is refused: a fill
 * occupant is alone in its tab, a panel has at most PANEL_MAX_TABS tabs,
 * and a tab that becomes a stack takes `label` when it has none. A stack
 * left with one occupant drops its label; a tab left empty goes.
 */
export function moveOccupant(
  panel: PanelSpec,
  name: string,
  target: MoveTarget,
  specs: readonly OccupantSpec[],
  label?: LocaleKey,
): MoveResult {
  const from = panel.tabs.findIndex((tab) =>
    tab.occupants.some((ref) => refName(ref) === name),
  );
  const source = panel.tabs[from];
  const ref = source?.occupants.find((r) => refName(r) === name);
  if (!source || !ref) return { ok: true, panel };
  const alone = source.occupants.length === 1;

  if ("newTab" in target) {
    // Alone in its tab, it's the tab that moves.
    if (alone) {
      const at = clamp(target.newTab, panel.tabs.length);
      return { ok: true, panel: moveTab(panel, from, at > from ? at - 1 : at) };
    }
    if (!canAddTab(panel)) return { ok: false, refused: "tab-cap" };
    const tabs = panel.tabs.map((tab, i) =>
      i === from ? without(tab, name) : tab,
    );
    tabs.splice(clamp(target.newTab, tabs.length), 0, {
      id: name,
      occupants: [ref],
    });
    return { ok: true, panel: { ...panel, tabs } };
  }

  const into = panel.tabs[target.tab];
  if (!into) return { ok: true, panel };
  // Within its own stack: a new order, nothing else changes.
  if (target.tab === from) {
    const others = source.occupants.filter((r) => refName(r) !== name);
    others.splice(clamp(target.at, others.length), 0, ref);
    const [first] = others;
    const id = first ? refName(first) : source.id;
    const tabs = panel.tabs.map((tab, i) =>
      i === from ? { ...tab, id, occupants: others } : tab,
    );
    return { ok: true, panel: { ...panel, tabs } };
  }
  if (stackProblem(into, name, specs))
    return { ok: false, refused: "fill-alone" };
  const stackLabel = into.label ?? label;
  if (!stackLabel) return { ok: false, refused: "no-label" };
  const occupants = [...into.occupants];
  occupants.splice(clamp(target.at, occupants.length), 0, ref);
  const [first] = occupants;
  const tabs = panel.tabs
    .map((tab, i): TabSpec => {
      if (i === target.tab)
        return {
          ...tab,
          id: first ? refName(first) : tab.id,
          label: stackLabel,
          occupants,
        };
      return i === from ? without(tab, name) : tab;
    })
    .filter((tab) => tab.occupants.length > 0);
  return { ok: true, panel: { ...panel, tabs } };
}
