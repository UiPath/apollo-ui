import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import type { PanelSpec } from "@/lib/panel";
import {
  fillPlaceholderOccupant,
  namedPlaceholderOccupant,
} from "./placeholder-occupants";

/*
 * Preview-only. The fixed ways the preview arranges a Detail page panel:
 * its own placeholder ("base") alone, or with others as a stack, tabs, or
 * enough tabs to overflow. Each is a fixture checked by validatePanel and
 * validateOccupantMap (tests/unit/preview-arrangements.test.ts).
 */

export const ARRANGEMENTS = ["single", "stack", "tabs", "overflow"] as const;

export type Arrangement = (typeof ARRANGEMENTS)[number];

/** Each arrangement's name in the Configure card. */
export const ARRANGEMENT_LABELS: Record<Arrangement, LocaleKey> = {
  single: "detail_page_preview_arrangement_single",
  stack: "detail_page_preview_arrangement_stack",
  tabs: "detail_page_preview_arrangement_tabs",
  overflow: "detail_page_preview_arrangement_overflow",
};

/** The other placeholders an arrangement puts beside the panel's own. */
type ExtraOccupant = "details" | "activity" | "people" | "notes" | "document";
type PreviewOccupant = "base" | ExtraOccupant;

const EXTRA_TITLES: Record<ExtraOccupant, LocaleKey> = {
  details: "detail_page_preview_occupant_details",
  activity: "detail_page_preview_occupant_activity",
  people: "detail_page_preview_occupant_people",
  notes: "detail_page_preview_occupant_notes",
  document: "detail_page_preview_occupant_document",
};

/**
 * The panel's own placeholder's title once it shares the panel: neutral,
 * like the others, not the slot's name.
 */
const BASE_TITLE: LocaleKey = "detail_page_preview_occupant_summary";

/** The slots that hold a side panel, so can be arranged. */
export const PANEL_SLOTS = ["start-panel", "end-panel"] as const;

export type PanelSlotName = (typeof PANEL_SLOTS)[number];

interface PreviewTab {
  label?: LocaleKey;
  occupants: readonly PreviewOccupant[];
}

/**
 * Single: one occupant. Stack: two flow occupants in one tab. Tabs: three
 * tabs, one of them the fill stand-in. Overflow: five tabs, more than fit
 * a narrow panel.
 */
const FIXTURES: Record<Arrangement, readonly PreviewTab[]> = {
  single: [{ occupants: ["base"] }],
  stack: [
    {
      label: "detail_page_preview_tab_overview",
      occupants: ["base", "details"],
    },
  ],
  tabs: [
    { occupants: ["base"] },
    { occupants: ["details"] },
    { occupants: ["document"] },
  ],
  overflow: [
    { occupants: ["base"] },
    { occupants: ["details"] },
    { occupants: ["activity"] },
    { occupants: ["people"] },
    { occupants: ["notes"] },
  ],
};

/** Reads an arrangement from its URL value; anything else is single. */
export const parseArrangement = (value: string | null): Arrangement =>
  ARRANGEMENTS.find((a) => a === value) ?? "single";

const specName = (occupant: PreviewOccupant) =>
  occupant === "base" ? "placeholder" : `placeholder-${occupant}`;

/**
 * An arrangement's panel and the specs of the occupants it names: the
 * panel's own placeholder, titled, and the placeholders beside it. Null
 * for single, which renders as a plain single-occupant slot.
 */
export function arrangementPanel(
  arrangement: Arrangement,
  base: OccupantSpec,
  translate: (key: LocaleKey) => string,
): { panel: PanelSpec; specs: OccupantSpec[] } | null {
  if (arrangement === "single") return null;
  const tabs = FIXTURES[arrangement];
  const specs = tabs
    .flatMap((tab) => tab.occupants)
    .map((occupant): OccupantSpec => {
      if (occupant === "base")
        return { ...base, label: translate(BASE_TITLE), titleKey: BASE_TITLE };
      const title = EXTRA_TITLES[occupant];
      return occupant === "document"
        ? fillPlaceholderOccupant(translate(title), title)
        : namedPlaceholderOccupant(specName(occupant), translate(title), title);
    });
  return {
    panel: {
      surface: "side-panel",
      tabs: tabs.map((tab) => ({
        // Each occupant appears once, so its first one names the tab.
        id: tab.occupants[0] ?? "",
        ...(tab.label && { label: tab.label }),
        occupants: tab.occupants.map(specName),
      })),
    },
    specs,
  };
}
