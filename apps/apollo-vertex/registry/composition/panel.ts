/**
 * Panels: what a side panel holds, as tabs of occupants. One tab shows no
 * tab bar; a tab with several occupants stacks them under headings.
 *
 *   type OccupantRef = string | { occupant: string; title?: LocaleKey };
 *   type TabSpec = { id: string; label?: LocaleKey; occupants: OccupantRef[] };
 *   type PanelSpec = { surface: "side-panel"; tabs: TabSpec[] };
 *
 * A slot given one occupant normalizes to a panel of one tab, so every
 * single-occupant slot keeps working. Validate a panel with
 * validatePanel(), and check it fits a slot with fits().
 */

import {
  type LocaleKey,
  type OccupantSpec,
  occupantInset,
  occupantSizing,
  type SurfaceSpec,
} from "./composition";

/** An occupant in a panel: its name, or its name and a title for here. */
export type OccupantRef = string | { occupant: string; title?: LocaleKey };

/** One tab of a panel: one occupant, or several stacked under headings. */
export interface TabSpec {
  /** Unique in its panel; rendered as data-tab and used in links. */
  id: string;
  /** Required when the tab holds more than one occupant. */
  label?: LocaleKey;
  occupants: readonly OccupantRef[];
}

/**
 * What a side panel holds: its tabs. One tab shows no tab bar. Validate it
 * with validatePanel().
 */
export interface PanelSpec {
  surface: "side-panel";
  tabs: readonly TabSpec[];
}

/** The most tabs a panel can have. */
export const PANEL_MAX_TABS = 5;

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/**
 * A panel from either form a slot can be given: one occupant, the form
 * every slot took before tabs, or a whole panel. One occupant becomes one
 * tab, named after it.
 */
export function normalizePanel(config: OccupantRef | PanelSpec): PanelSpec {
  if (typeof config === "object" && "tabs" in config) return config;
  return {
    surface: "side-panel",
    tabs: [{ id: refName(config), occupants: [config] }],
  };
}

/** An occupant in a resolved panel: its spec, and the title it shows. */
export interface ResolvedOccupant {
  spec: OccupantSpec;
  /** The ref's title, else the spec's titleKey. Absent when neither is set. */
  title?: LocaleKey;
}

export interface ResolvedTab {
  id: string;
  /** The tab's label, else its only occupant's title. */
  label?: LocaleKey;
  occupants: readonly ResolvedOccupant[];
}

/** A panel with its occupants' specs looked up, ready to render or check. */
export interface ResolvedPanel {
  tabs: readonly ResolvedTab[];
}

/** An occupant's title: the ref's own, else its spec's titleKey. */
export function occupantTitle(
  ref: OccupantRef,
  spec: OccupantSpec,
): LocaleKey | undefined {
  if (typeof ref === "object" && ref.title) return ref.title;
  return spec.titleKey;
}

/** A tab's label: its own, else the title of its only occupant. */
export function tabLabel(
  tab: Pick<TabSpec, "label">,
  occupants: readonly ResolvedOccupant[],
): LocaleKey | undefined {
  if (tab.label) return tab.label;
  if (occupants.length !== 1) return;
  return occupants[0]?.title;
}

/**
 * Looks up every occupant in a panel by name. Unknown names are left out
 * and reported by validatePanel().
 */
export function resolvePanel(
  panel: PanelSpec,
  specs: readonly OccupantSpec[],
): ResolvedPanel {
  return {
    tabs: panel.tabs.map((tab) => {
      const occupants = tab.occupants.flatMap((ref) => {
        const spec = specs.find((s) => s.name === refName(ref));
        if (!spec) return [];
        const title = occupantTitle(ref, spec);
        return [{ spec, ...(title && { title }) }];
      });
      const label = tabLabel(tab, occupants);
      return { id: tab.id, ...(label && { label }), occupants };
    }),
  };
}

/**
 * Every rule a panel breaks, one plain sentence each. Empty when it's
 * valid:
 *
 * - it has 1 to PANEL_MAX_TABS tabs, with unique ids;
 * - every tab holds at least one occupant, each a known one;
 * - an occupant appears at most once in the panel;
 * - a tab with more than one occupant has a label, and every occupant in
 *   it has a title for its heading;
 * - with more than one tab, every tab has a label or a titled occupant;
 * - a "fill" occupant is alone in its tab.
 */
export function validatePanel(
  panel: PanelSpec,
  specs: readonly OccupantSpec[],
): string[] {
  const errors: string[] = [];
  const { tabs } = panel;
  if (tabs.length === 0) errors.push("A panel needs at least one tab.");
  if (tabs.length > PANEL_MAX_TABS) {
    errors.push(
      `A panel has at most ${PANEL_MAX_TABS} tabs; this one has ${tabs.length}.`,
    );
  }
  const ids = new Set<string>();
  const seen = new Set<string>();
  const resolved = resolvePanel(panel, specs);
  tabs.forEach((tab, index) => {
    if (ids.has(tab.id)) errors.push(`Tab id "${tab.id}" is used twice.`);
    ids.add(tab.id);
    if (tab.occupants.length === 0)
      errors.push(`Tab "${tab.id}" holds no occupant.`);
    for (const ref of tab.occupants) {
      const name = refName(ref);
      if (!specs.some((s) => s.name === name))
        errors.push(`Tab "${tab.id}" names an unknown occupant, "${name}".`);
      if (seen.has(name))
        errors.push(`The ${name} occupant appears more than once.`);
      seen.add(name);
    }
    const { occupants, label } = resolved.tabs[index] ?? { occupants: [] };
    const stacked = tab.occupants.length > 1;
    if (stacked && !tab.label) {
      errors.push(
        `Tab "${tab.id}" stacks ${tab.occupants.length} occupants, so it needs a label.`,
      );
    }
    if (stacked) {
      for (const occupant of occupants) {
        if (!occupant.title)
          errors.push(
            `The ${occupant.spec.name} occupant in tab "${tab.id}" needs a title for its heading.`,
          );
      }
    }
    if (tabs.length > 1 && !label && !stacked) {
      errors.push(
        `Tab "${tab.id}" needs a label, or an occupant with a title.`,
      );
    }
    for (const occupant of occupants) {
      if (stacked && occupantSizing(occupant.spec) === "fill") {
        errors.push(
          `The ${occupant.spec.name} occupant fills its tab, so it can't share tab "${tab.id}".`,
        );
      }
    }
  });
  return errors;
}

/**
 * The narrowest outer width, in px, a panel works at: the widest of its
 * occupants' minWidth plus their inset, across every tab, and never below
 * the surface's own minimum. Switching tabs never changes it.
 */
export function panelMinWidth(
  surface: SurfaceSpec,
  panel: ResolvedPanel,
): number {
  let min = surface.width?.min ?? 0;
  for (const tab of panel.tabs) {
    for (const { spec } of tab.occupants) {
      min = Math.max(min, spec.requires.minWidth + occupantInset(spec));
    }
  }
  return min;
}
