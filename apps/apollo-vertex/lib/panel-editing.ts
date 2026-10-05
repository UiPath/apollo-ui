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

/** The panel with the occupant in a new tab at the end; unchanged when full. */
export function addAsTab(
  panel: PanelSpec,
  ref: OccupantRef,
  id: string,
): PanelSpec {
  if (!canAddTab(panel)) return panel;
  return { ...panel, tabs: [...panel.tabs, { id, occupants: [ref] }] };
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
