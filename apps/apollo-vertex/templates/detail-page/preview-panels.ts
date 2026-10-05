import type { LocaleKey } from "@/lib/composition";
import { PANEL_MAX_TABS } from "@/lib/panel";

/*
 * Preview-only. What each Detail page panel holds in the preview: its own
 * placeholder ("base"), and any others the composer added, as tabs or
 * stacked in a tab. One tab holding only the base is the default, and
 * renders the panel exactly as a single-occupant slot.
 */

/** Occupants the composer can add, beside the panel's own placeholder. */
export const EXTRA_OCCUPANTS = [
  "details",
  "activity",
  "people",
  "notes",
  "document",
] as const;

export type ExtraOccupant = (typeof EXTRA_OCCUPANTS)[number];
export type PreviewOccupant = "base" | ExtraOccupant;

/** Each panel's own placeholder's title, once it shares the panel. */
export const PANEL_TITLES = {
  "start-panel": "detail_page_preview_start_panel",
  "end-panel": "detail_page_preview_end_panel",
} as const satisfies Record<string, LocaleKey>;

/** Each added placeholder's title. */
export const EXTRA_TITLES: Record<ExtraOccupant, LocaleKey> = {
  details: "detail_page_preview_occupant_details",
  activity: "detail_page_preview_occupant_activity",
  people: "detail_page_preview_occupant_people",
  notes: "detail_page_preview_occupant_notes",
  document: "detail_page_preview_occupant_document",
};

/** The document stand-in fills its tab, so it can't be stacked. */
export const FILL_OCCUPANTS: readonly PreviewOccupant[] = ["document"];

/** Labels a stack's tab can take, by short id (used in the URL). */
export const TAB_LABELS = {
  overview: "detail_page_preview_tab_overview",
  work: "detail_page_preview_tab_work",
  history: "detail_page_preview_tab_history",
} as const satisfies Record<string, LocaleKey>;

export type TabLabelId = keyof typeof TAB_LABELS;

export const TAB_LABEL_IDS: readonly TabLabelId[] = [
  "overview",
  "work",
  "history",
];

export interface PreviewTab {
  /** Required once the tab stacks more than one occupant. */
  label?: TabLabelId;
  occupants: readonly PreviewOccupant[];
}

export type PanelComposition = readonly PreviewTab[];

export const SINGLE_OCCUPANT: PanelComposition = [{ occupants: ["base"] }];

/** A tab's id: its first occupant's, unique since each occupant appears once. */
export const previewTabId = (tab: PreviewTab) => tab.occupants[0] ?? "";

/** Whether the panel holds just its own placeholder: the classic slot. */
export const isSingleOccupant = (composition: PanelComposition) =>
  composition.length === 1 && composition[0]?.occupants.length === 1;

export const occupantsIn = (composition: PanelComposition) =>
  composition.flatMap((tab) => tab.occupants);

/** Why an occupant can't be stacked into a tab, or null when it can. */
export function stackProblem(
  occupant: PreviewOccupant,
  tab: PreviewTab,
): "fill-alone" | null {
  const fills = (o: PreviewOccupant) => FILL_OCCUPANTS.includes(o);
  return fills(occupant) || tab.occupants.some(fills) ? "fill-alone" : null;
}

export const canAddTab = (composition: PanelComposition) =>
  composition.length < PANEL_MAX_TABS;

export function addAsTab(
  composition: PanelComposition,
  occupant: ExtraOccupant,
): PanelComposition {
  if (!canAddTab(composition)) return composition;
  return [...composition, { occupants: [occupant] }];
}

export function addToTab(
  composition: PanelComposition,
  index: number,
  occupant: ExtraOccupant,
  label?: TabLabelId,
): PanelComposition {
  return composition.map((tab, i) => {
    if (i !== index || stackProblem(occupant, tab)) return tab;
    const tabLabel = tab.label ?? label;
    return {
      ...(tabLabel && { label: tabLabel }),
      occupants: [...tab.occupants, occupant],
    };
  });
}

/** Removes an added occupant, and its tab when that empties it. */
export function removeOccupant(
  composition: PanelComposition,
  occupant: ExtraOccupant,
): PanelComposition {
  return composition
    .map((tab) => {
      const occupants = tab.occupants.filter((o) => o !== occupant);
      // A tab back to one occupant takes that occupant's title again.
      return occupants.length > 1 ? { ...tab, occupants } : { occupants };
    })
    .filter((tab) => tab.occupants.length > 0);
}

const isOccupant = (value: string): value is PreviewOccupant =>
  value === "base" || EXTRA_OCCUPANTS.some((o) => o === value);
const isLabel = (value: string): value is TabLabelId =>
  TAB_LABEL_IDS.some((id) => id === value);

/** Whether a composition follows the panel rules the preview can break. */
function isValid(composition: PanelComposition): boolean {
  const all = occupantsIn(composition);
  return (
    composition.length > 0 &&
    composition.length <= PANEL_MAX_TABS &&
    all.includes("base") &&
    new Set(all).size === all.length &&
    composition.every(
      (tab) =>
        tab.occupants.length > 0 &&
        (tab.occupants.length === 1 ||
          (Boolean(tab.label) &&
            !tab.occupants.some((o) => FILL_OCCUPANTS.includes(o)))),
    )
  );
}

/**
 * Reads a panel's composition from its URL value: tabs joined by "~", each
 * an optional "<label>:" then occupants joined by "+", like
 * "base~overview:details+people". Anything invalid is the default.
 */
export function parseComposition(value: string | null): PanelComposition {
  if (!value) return SINGLE_OCCUPANT;
  const tabs: PreviewTab[] = [];
  for (const part of value.split("~")) {
    const labeled = part.includes(":");
    const [label = "", rest = ""] = labeled ? part.split(":") : ["", part];
    const names = rest.split("+");
    if ((labeled && !isLabel(label)) || !names.every((n) => isOccupant(n)))
      return SINGLE_OCCUPANT;
    tabs.push({
      ...(isLabel(label) && { label }),
      occupants: names.filter((n) => isOccupant(n)),
    });
  }
  return isValid(tabs) ? tabs : SINGLE_OCCUPANT;
}

/** The URL value for a composition; empty for the default. */
export function serializeComposition(composition: PanelComposition): string {
  if (isSingleOccupant(composition)) return "";
  return composition
    .map(
      (tab) => `${tab.label ? `${tab.label}:` : ""}${tab.occupants.join("+")}`,
    )
    .join("~");
}
