import type { TemplateHost } from "@/app/_components/template-hosts";
import {
  type LocaleKey,
  type OccupantSpec,
  occupantSizing,
} from "@/lib/composition";
import { normalizePanel, type OccupantRef, type PanelSpec } from "@/lib/panel";
import { canAddTab, stackProblem } from "@/lib/panel-editing";
import {
  type ComposeLock,
  type Destination,
  holdsPanel,
  isValid,
  occupantsIn,
  REGISTERED,
  type SlotContents,
  slotFit,
  TAB_LABELS,
} from "./workbench-compose";

/*
 * The composer's choices for one slot, as its popover offers them: what
 * the picker lists for a place in the slot, and what it leaves out; the
 * real limits on a panel's tabs; a stack's label; and replacing what a
 * slot that holds one has. The composer offers each occupant once on the
 * page; composition's own rules don't require that.
 */

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;

/** Every occupant on the page, in any slot. */
export const onPage = (contents: SlotContents): ReadonlySet<string> =>
  new Set(Object.values(contents).flatMap((panel) => occupantsIn(panel)));

/**
 * Where the picker puts an occupant: a new tab, into a tab by index, or in
 * place of what a slot that holds one has.
 */
export type PickTarget = Destination | "replace";

/**
 * Why the picker leaves an occupant out: it's on the page already, it
 * doesn't fit the slot, or it fills its tab, so it can't join one.
 */
export type LeftOut = "on-page" | "no-fit" | "fill";

const LEFT_OUT_ORDER: readonly LeftOut[] = ["on-page", "no-fit", "fill"];

/**
 * Why the picker leaves one occupant out of a place in a slot, or null
 * when it offers it. Dropping it there reads the same (see
 * workbench-drop).
 */
export function leftOutFor(
  host: TemplateHost,
  contents: SlotContents,
  slot: string,
  to: PickTarget,
  spec: OccupantSpec,
  known: readonly OccupantSpec[] = REGISTERED,
): LeftOut | null {
  if (onPage(contents).has(spec.name)) return "on-page";
  if (!slotFit(host, slot, spec).fits) return "no-fit";
  const tab = typeof to === "number" ? contents[slot]?.tabs[to] : null;
  return tab && stackProblem(tab, spec.name, known) ? "fill" : null;
}

/** What the picker offers, and how many it leaves out, by why. */
export interface Picker {
  choices: string[];
  left: { reason: LeftOut; count: number }[];
}

/**
 * The occupants the picker offers for a place in a slot: each one that
 * fits it and isn't anywhere on the page, the focused one included. The
 * rest are counted by why, for one line each.
 */
export function picker(
  host: TemplateHost,
  contents: SlotContents,
  slot: string,
  to: PickTarget,
  known: readonly OccupantSpec[] = REGISTERED,
): Picker {
  const choices: string[] = [];
  const counts = new Map<LeftOut, number>();
  for (const spec of known) {
    const reason = leftOutFor(host, contents, slot, to, spec, known);
    if (reason) counts.set(reason, (counts.get(reason) ?? 0) + 1);
    else choices.push(spec.name);
  }
  return {
    choices,
    left: LEFT_OUT_ORDER.flatMap((reason) => {
      const count = counts.get(reason) ?? 0;
      return count > 0 ? [{ reason, count }] : [];
    }),
  };
}

/** What a panel slot can't take more of: a new tab, and each tab, by index. */
export interface PanelLocks {
  newTab: ComposeLock | null;
  tabs: (ComposeLock | null)[];
}

/**
 * The real limits on a panel slot: no new tab at the tab cap, and nothing
 * stacks into a tab that holds a fill occupant.
 */
export function panelLocks(
  contents: SlotContents,
  slot: string,
  known: readonly OccupantSpec[] = REGISTERED,
): PanelLocks {
  const panel = contents[slot] ?? { surface: "side-panel", tabs: [] };
  const fills = (ref: OccupantRef) => {
    const spec = known.find((s) => s.name === refName(ref));
    return spec ? occupantSizing(spec) === "fill" : false;
  };
  return {
    newTab: canAddTab(panel) ? null : "tab-cap",
    tabs: panel.tabs.map((tab) =>
      tab.occupants.some(fills) ? "fill-alone" : null,
    ),
  };
}

/** The label a tab takes when it becomes a stack: the first preset no tab has. */
export function firstUnusedLabel(panel?: PanelSpec): LocaleKey {
  const used = new Set(panel?.tabs.map((tab) => tab.label));
  const [first] = TAB_LABELS;
  return (TAB_LABELS.find((l) => !used.has(l.key)) ?? first).key;
}

/** The contents with a stack's tab given another label; one occupant takes none. */
export function relabel(
  contents: SlotContents,
  slot: string,
  index: number,
  label: LocaleKey,
): SlotContents {
  const panel = contents[slot];
  const tab = panel?.tabs[index];
  if (!panel || !tab || tab.occupants.length < 2) return contents;
  const tabs = panel.tabs.map((t, i) => (i === index ? { ...t, label } : t));
  return { ...contents, [slot]: { ...panel, tabs } };
}

/**
 * The contents with a slot that holds one given another occupant in place
 * of its own. Unchanged for a panel slot, the focused occupant's slot, or
 * an occupant the slot can't hold.
 */
export function replaceIn(
  host: TemplateHost,
  contents: SlotContents,
  slot: string,
  occupant: string,
  focus: string,
  known: readonly OccupantSpec[] = REGISTERED,
): SlotContents {
  const here = contents[slot];
  if (holdsPanel(host, slot) || (here && occupantsIn(here).includes(focus)))
    return contents;
  const next = normalizePanel(occupant);
  return isValid(host, slot, next, known)
    ? { ...contents, [slot]: next }
    : contents;
}
