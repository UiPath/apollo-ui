import type { TemplateHost } from "@/app/_components/template-hosts";
import type { LocaleKey } from "@/lib/composition";
import {
  type FitResult,
  fits,
  type OccupantSpec,
  slotHolds,
} from "@/lib/composition";
import { specFor } from "@/lib/occupant-lookup";
import { OCCUPANT_SPECS, SURFACE_SPECS } from "@/lib/occupants.generated";
import {
  normalizePanel,
  type OccupantRef,
  type PanelSpec,
  validatePanel,
} from "@/lib/panel";
import {
  addAsTab,
  addToTab,
  canAddTab,
  removeOccupant,
  stackProblem,
} from "@/lib/panel-editing";

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
 * Why a composer choice can't be made, as a reason code; each has its copy
 * as a locale key (reasonCopy).
 *
 * - focus: it's the focused occupant, so it stays.
 * - fill-alone: a fill occupant has a tab to itself.
 * - tab-cap: the panel has as many tabs as it can.
 * - no-fit: the occupant doesn't fit this slot's surface.
 * - full: the slot holds one occupant, and has one.
 * - present: the occupant is in this slot already.
 */
export type ComposeLock =
  | "focus"
  | "fill-alone"
  | "tab-cap"
  | "no-fit"
  | "full"
  | "present";

const specs = (): OccupantSpec[] => OCCUPANT_SPECS.map((entry) => entry.spec);

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/** Every occupant a panel holds, in tab order. */
export const occupantsIn = (panel: PanelSpec): string[] =>
  panel.tabs.flatMap((tab) => tab.occupants.map(refName));

const holdsPanel = (host: TemplateHost, slot: string) => {
  const spec = host.spec.slots.find((s) => s.name === slot);
  return spec ? slotHolds(spec) === "panel" : false;
};

/** Whether a slot's composition is one it can hold, by every declared rule. */
function isValid(host: TemplateHost, slot: string, panel: PanelSpec): boolean {
  const names = occupantsIn(panel);
  if (names.length === 0) return false;
  if (!holdsPanel(host, slot) && names.length > 1) return false;
  if (validatePanel(panel, specs()).length > 0) return false;
  return names.every((name) => {
    const spec = specFor(name);
    return spec ? slotFit(host, slot, spec).fits : false;
  });
}

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
 * the focused occupant alone.
 */
export function normalizeContents(
  host: TemplateHost,
  contents: SlotContents,
  focusSlot: string,
  focus: string,
): SlotContents {
  const slots = host.spec.slots.map((slot) => slot.name);
  const kept: Record<string, PanelSpec> = {};
  for (const slot of slots) {
    const panel = contents[slot];
    if (!panel) continue;
    // The focused occupant goes in its own slot only.
    const elsewhere = slot === focusSlot ? panel : removeOccupant(panel, focus);
    if (isValid(host, slot, elsewhere)) kept[slot] = elsewhere;
  }
  const alone = normalizePanel(focus);
  const own = kept[focusSlot];
  if (!own || !occupantsIn(own).includes(focus)) {
    const placed =
      own && holdsPanel(host, focusSlot) ? withFocusFirst(own, focus) : alone;
    kept[focusSlot] = isValid(host, focusSlot, placed) ? placed : alone;
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

/** A choice in the composer, and why it's locked, or null when it can be made. */
export interface ComposeChoice<T> {
  value: T;
  lock: ComposeLock | null;
}

/**
 * Every registered occupant as a choice to add to a slot, each locked when
 * it can't go there: it's there already, it's the focused occupant, which
 * stays in its own slot, it doesn't fit, or the slot holds one and has it.
 */
export function addChoices(
  host: TemplateHost,
  contents: SlotContents,
  slot: string,
  focus: string,
): ComposeChoice<string>[] {
  const here = contents[slot];
  const names = here ? occupantsIn(here) : [];
  const full = !holdsPanel(host, slot) && names.length > 0;
  const lockFor = (spec: OccupantSpec): ComposeLock | null => {
    if (names.includes(spec.name)) return "present";
    if (spec.name === focus) return "focus";
    if (!slotFit(host, slot, spec).fits) return "no-fit";
    return full ? "full" : null;
  };
  return specs().map((spec) => ({ value: spec.name, lock: lockFor(spec) }));
}

/** Where an occupant can go in a panel slot: a new tab, or into a tab, by index. */
export type Destination = "new-tab" | number;

/**
 * Where an occupant can go in a slot that holds a panel: a new tab, locked
 * at the tab cap, and each tab to stack it in, locked when either is a
 * fill occupant.
 */
export function destinations(
  host: TemplateHost,
  contents: SlotContents,
  slot: string,
  occupant: string,
): ComposeChoice<Destination>[] {
  if (!holdsPanel(host, slot)) return [];
  const panel = contents[slot] ?? { surface: "side-panel", tabs: [] };
  return [
    { value: "new-tab", lock: canAddTab(panel) ? null : "tab-cap" },
    ...panel.tabs.map((tab, index) => ({
      value: index,
      lock: stackProblem(tab, occupant, specs())
        ? ("fill-alone" as const)
        : null,
    })),
  ];
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
  label?: LocaleKey,
): SlotContents {
  const here = contents[slot];
  const panel = here ?? { surface: "side-panel" as const, tabs: [] };
  if (!holdsPanel(host, slot) && here) return contents;
  const next =
    to === "new-tab"
      ? addAsTab(panel, occupant, occupant)
      : addToTab(panel, to, occupant, specs(), label);
  if (next === panel || !isValid(host, slot, next)) return contents;
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
