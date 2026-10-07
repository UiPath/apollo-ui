import type { LocaleKey, OccupantSpec } from "@/lib/composition";
import type { OccupantRef, PanelSpec } from "@/lib/panel";
import { type MoveResult, moveOccupant, moveTab } from "@/lib/panel-editing";
import { type Renames, stackTarget } from "./workbench-renames";

/*
 * Moving things around a panel slot in the inspector: what's moved, where
 * it lands, and what follows from it. The panel rules are panel-editing's;
 * this adds the inspector's view of them.
 */

/** What's moved: a whole tab, or one occupant. */
export type MoveItem =
  | { kind: "tab"; index: number }
  | { kind: "occupant"; name: string };

/** Where it lands: a new tab at an insertion point, or into a tab's stack. */
export type MovePlace =
  | { kind: "new-tab"; at: number }
  | { kind: "into"; tab: number; at: number };

const refName = (ref: OccupantRef) =>
  typeof ref === "string" ? ref : ref.occupant;
const namesOf = (panel: PanelSpec, index: number) =>
  panel.tabs[index]?.occupants.map(refName) ?? [];

/** Where an occupant is: its tab, and its place in that tab's stack. */
export function whereIs(panel: PanelSpec, name: string) {
  const tab = panel.tabs.findIndex((t) =>
    t.occupants.some((ref) => refName(ref) === name),
  );
  return { tab, at: tab < 0 ? -1 : namesOf(panel, tab).indexOf(name) };
}

/** The panel after a move, or why it's refused. A tab can always move. */
export function applyMove(
  panel: PanelSpec,
  item: MoveItem,
  place: MovePlace,
  specs: readonly OccupantSpec[],
  label: LocaleKey | undefined,
): MoveResult {
  if (item.kind === "tab") {
    if (place.kind !== "new-tab") return { ok: true, panel };
    const to = place.at > item.index ? place.at - 1 : place.at;
    return { ok: true, panel: moveTab(panel, item.index, to) };
  }
  return moveOccupant(
    panel,
    item.name,
    place.kind === "new-tab"
      ? { newTab: place.at }
      : { tab: place.tab, at: place.at },
    specs,
    label,
  );
}

/** Whether a move changes anything: where it's dropped back where it was, it doesn't. */
export const changes = (before: PanelSpec, result: MoveResult) =>
  !result.ok ||
  JSON.stringify(result.panel.tabs) !== JSON.stringify(before.tabs);

/**
 * The tab after a change that's the same tab as one before it: the one
 * holding most of its occupants, so a tab is followed even when its id,
 * its first occupant, changes. An occupant that was alone in it is
 * followed to wherever it went.
 */
export function followTab(
  before: PanelSpec,
  after: PanelSpec,
  id: string,
): string | null {
  const was = before.tabs.findIndex((tab) => tab.id === id);
  if (was < 0) return null;
  const names = namesOf(before, was);
  let best: { id: string; shared: number } | null = null;
  for (const [index, tab] of after.tabs.entries()) {
    const shared = namesOf(after, index).filter((n) =>
      names.includes(n),
    ).length;
    if (shared > (best?.shared ?? 0)) best = { id: tab.id, shared };
  }
  return best?.id ?? null;
}

/** A slot's stack renames, carried to each stack's id after a change. */
export function followRenames(
  slot: string,
  before: PanelSpec,
  after: PanelSpec,
  renames: Renames,
): Renames {
  const moved = new Set(before.tabs.map((tab) => stackTarget(slot, tab.id)));
  const kept = Object.entries(renames).filter(([target]) => !moved.has(target));
  const carried = before.tabs.flatMap((tab) => {
    const key = renames[stackTarget(slot, tab.id)];
    const now = key ? followTab(before, after, tab.id) : null;
    const still = after.tabs.find((t) => t.id === now);
    return key && now && still && still.occupants.length > 1
      ? [[stackTarget(slot, now), key] as const]
      : [];
  });
  return Object.fromEntries([...kept, ...carried]);
}

/**
 * Move up or Move down, for a menu: a tab one place along the tabs, an
 * occupant one place along its stack. Null at either end.
 */
export function stepPlace(
  panel: PanelSpec,
  item: MoveItem,
  by: -1 | 1,
): MovePlace | null {
  if (item.kind === "tab") {
    const to = item.index + by;
    if (to < 0 || to >= panel.tabs.length) return null;
    // An insertion point past the tab it moves over.
    return { kind: "new-tab", at: by > 0 ? to + 1 : to };
  }
  const { tab, at } = whereIs(panel, item.name);
  const size = namesOf(panel, tab).length;
  if (tab < 0 || size < 2) return null;
  const to = at + by;
  if (to < 0 || to >= size) return null;
  return { kind: "into", tab, at: to };
}

/**
 * Every place a drag can land, in the order they appear, for the keyboard:
 * each insertion point among the tabs, and each place in every stack,
 * including a tab of one becoming a stack. A tab only takes insertion
 * points.
 */
export function placesInOrder(panel: PanelSpec, item: MoveItem): MovePlace[] {
  const places: MovePlace[] = [];
  for (const [index] of panel.tabs.entries()) {
    places.push({ kind: "new-tab", at: index });
    if (item.kind === "occupant") {
      const size = namesOf(panel, index).length;
      for (let at = 0; at <= size; at += 1)
        places.push({ kind: "into", tab: index, at });
    }
  }
  places.push({ kind: "new-tab", at: panel.tabs.length });
  return places;
}
