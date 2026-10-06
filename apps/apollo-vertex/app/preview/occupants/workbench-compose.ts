import type { TemplateHost } from "@/app/_components/template-hosts";
import type { LocaleKey } from "@/lib/composition";
import {
  type FitResult,
  fits,
  type OccupantSpec,
  slotHolds,
} from "@/lib/composition";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import {
  normalizePanel,
  type OccupantRef,
  type PanelSpec,
  validatePanel,
} from "@/lib/panel";
import { addAsTab, addToTab, removeOccupant } from "@/lib/panel-editing";

/*
 * What each slot of the template view holds, for any template: a panel of
 * tabs and stacks (see @/lib/panel) for a slot that declares it holds one,
 * else at most one occupant. The focused occupant, the one picked in the
 * list, is always placed in its slot. Every rule comes from the template's
 * declarations and composition's checks: fits(), validatePanel(), and the
 * slot's capacity.
 */

/**
 * fits() for the occupant in a template slot: against each surface the
 * slot accepts, the first that fits, or the first one's reasons.
 */
export function slotFit(
  host: TemplateHost,
  slotName: string,
  spec: OccupantSpec,
): FitResult {
  const slot = host.spec.slots.find((s) => s.name === slotName);
  if (!slot) return { fits: false, reasons: [`No ${slotName} slot.`] };
  const results = slot.surfaces.flatMap((name) =>
    SURFACE_SPECS.filter((s) => s.name === name).map((surface) =>
      fits(slot, surface, spec),
    ),
  );
  return (
    results.find((result) => result.fits) ??
    results[0] ?? {
      fits: false,
      reasons: [`The ${slotName} slot takes no surface.`],
    }
  );
}

/** Each slot's composition, by slot name. Slots with nothing added are left out. */
export type SlotContents = Readonly<Record<string, PanelSpec>>;

/**
 * Takes the composer's change: the new contents, and the tab to show
 * after it, when it added to a tab or made one.
 */
export type ContentsChange = (
  contents: SlotContents,
  show?: { slot: string; tab: string },
  /** A slot the page left out, to include in the same change. */
  include?: string,
) => void;

/**
 * Why a composer choice can't be made, as a reason code; each has its copy
 * as a locale key (reasonCopy).
 *
 * - focus: it's the focused occupant, so it stays.
 * - fill-alone: a fill occupant has a tab to itself.
 * - tab-cap: the panel has as many tabs as it can.
 * - no-fit: the occupant doesn't fit this slot's surface.
 */
export type ComposeLock = "focus" | "fill-alone" | "tab-cap" | "no-fit";

/** Labels a stack's tab can take, by their id in links, in the order the composer offers them. */
export const TAB_LABELS = [
  { id: "overview", key: "workbench_tab_label_overview" },
  { id: "details", key: "workbench_tab_label_details" },
  { id: "activity", key: "workbench_tab_label_activity" },
  { id: "people", key: "workbench_tab_label_people" },
] as const satisfies readonly { id: string; key: LocaleKey }[];

/**
 * The occupants the composer can use: every registered one. Each function
 * takes a list of its own (`known`), for tests.
 */
export const REGISTERED: readonly OccupantSpec[] = OCCUPANT_SPECS.map(
  (entry) => entry.spec,
);

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/** Every occupant a panel holds, in tab order. */
export const occupantsIn = (panel: PanelSpec): string[] =>
  panel.tabs.flatMap((tab) => tab.occupants.map(refName));

/** Whether a slot declares it holds a panel of tabs and stacks. */
export const holdsPanel = (host: TemplateHost, slot: string) => {
  const spec = host.spec.slots.find((s) => s.name === slot);
  return spec ? slotHolds(spec) === "panel" : false;
};

/** Whether a slot's composition is one it can hold, by every declared rule. */
export function isValid(
  host: TemplateHost,
  slot: string,
  panel: PanelSpec,
  known: readonly OccupantSpec[],
): boolean {
  const names = occupantsIn(panel);
  if (names.length === 0) return false;
  if (!holdsPanel(host, slot) && names.length > 1) return false;
  if (validatePanel(panel, known).length > 0) return false;
  return names.every((name) => {
    const spec = known.find((s) => s.name === name);
    return spec ? slotFit(host, slot, spec).fits : false;
  });
}

/** The panel with each tab's id its first occupant, as links give them. */
const withTabIds = (panel: PanelSpec): PanelSpec => ({
  ...panel,
  tabs: panel.tabs.map((tab) => {
    const [first] = tab.occupants;
    return first ? { ...tab, id: refName(first) } : tab;
  }),
});

/** The focused occupant placed first in a panel, as its own tab. */
const withFocusFirst = (panel: PanelSpec, focus: string): PanelSpec => ({
  ...panel,
  tabs: [{ id: focus, occupants: [focus] }, ...panel.tabs],
});

/**
 * The contents as the template view can show them: only the template's
 * slots, each valid by its rules or dropped, and the focused occupant in
 * its slot (first, when the slot holds a panel) and in no other. A slot
 * that can't take the focused occupant beside what it holds falls back to
 * the focused occupant alone. Each tab's id is its first occupant.
 */
export function normalizeContents(
  host: TemplateHost,
  contents: SlotContents,
  focusSlot: string,
  focus: string,
  known: readonly OccupantSpec[] = REGISTERED,
): SlotContents {
  const slots = host.spec.slots.map((slot) => slot.name);
  const kept: Record<string, PanelSpec> = {};
  for (const slot of slots) {
    const panel = contents[slot];
    if (!panel) continue;
    // The focused occupant goes in its own slot only.
    const ided = withTabIds(panel);
    const elsewhere = slot === focusSlot ? ided : removeOccupant(ided, focus);
    if (isValid(host, slot, elsewhere, known)) kept[slot] = elsewhere;
  }
  const alone = normalizePanel(focus);
  const own = kept[focusSlot];
  if (!own || !occupantsIn(own).includes(focus)) {
    const placed =
      own && holdsPanel(host, focusSlot) ? withFocusFirst(own, focus) : alone;
    kept[focusSlot] = isValid(host, focusSlot, placed, known) ? placed : alone;
  }
  return kept;
}

/** The tab a slot shows first: the focused occupant's, else its first. */
export function activeTab(panel: PanelSpec, focus: string): string {
  const own = panel.tabs.find((tab) =>
    tab.occupants.some((ref) => refName(ref) === focus),
  );
  return (own ?? panel.tabs[0])?.id ?? "";
}

/**
 * The tab chosen in each slot, kept while the slot has it. A tab that's
 * gone, as when its first occupant is taken out, falls back to the first.
 */
export function normalizeTabs(
  contents: SlotContents,
  tabs: Readonly<Record<string, string>>,
): Readonly<Record<string, string>> {
  return Object.fromEntries(
    Object.entries(tabs).flatMap(([slot, id]) => {
      const panel = contents[slot];
      const first = panel?.tabs[0]?.id;
      if (!panel || !first) return [];
      return [[slot, panel.tabs.some((tab) => tab.id === id) ? id : first]];
    }),
  );
}

/** Where an occupant goes in a panel slot: a new tab, or into a tab, by index. */
export type Destination = "new-tab" | number;

interface AddOptions {
  /** The label a tab stacked into takes, when it has none. */
  label?: LocaleKey;
  /** Where a new tab goes among the tabs (0 is first); at the end when left out. */
  at?: number;
  known?: readonly OccupantSpec[];
}

/**
 * The contents with an occupant added to a slot: in a new tab, or stacked
 * into a tab, which takes `label` if it has none. Unchanged when a rule
 * refuses it.
 */
export function addOccupant(
  host: TemplateHost,
  contents: SlotContents,
  slot: string,
  occupant: string,
  to: Destination = "new-tab",
  { label, at, known = REGISTERED }: AddOptions = {},
): SlotContents {
  const here = contents[slot];
  const panel = here ?? { surface: "side-panel" as const, tabs: [] };
  if (!holdsPanel(host, slot) && here) return contents;
  const next =
    to === "new-tab"
      ? addAsTab(panel, occupant, occupant, at ?? panel.tabs.length)
      : addToTab(panel, to, occupant, known, label);
  if (next === panel || !isValid(host, slot, next, known)) return contents;
  return { ...contents, [slot]: next };
}

/** Whether an occupant can be taken out of a slot: never the focused one. */
export const removeLock = (
  occupant: string,
  focus: string,
): ComposeLock | null => (occupant === focus ? "focus" : null);

/** The contents without an occupant in a slot; a tab it empties goes too. */
export function removeFromSlot(
  contents: SlotContents,
  slot: string,
  occupant: string,
  focus: string,
): SlotContents {
  const here = contents[slot];
  if (!here || removeLock(occupant, focus)) return contents;
  const next = removeOccupant(here, occupant);
  const { [slot]: _gone, ...rest } = contents;
  return next.tabs.length > 0 ? { ...rest, [slot]: next } : rest;
}
