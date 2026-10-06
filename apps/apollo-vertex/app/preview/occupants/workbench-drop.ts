import type { TemplateHost } from "@/app/_components/template-hosts";
import type { OccupantSpec } from "@/lib/composition";
import {
  addOccupant,
  type ComposeLock,
  holdsPanel,
  REGISTERED,
  type SlotContents,
} from "./workbench-compose";
import {
  firstUnusedLabel,
  type LeftOut,
  leftOutFor,
  panelLocks,
  replaceIn,
} from "./workbench-picker";

/*
 * What dropping an occupant on the template view does. Every rule is the
 * composer's (workbench-picker): a drop is allowed exactly where a slot's
 * popover would offer the same occupant, and refused for the same reason.
 */

/** Where an occupant is dropped. */
export type DropTarget =
  /** A new tab, at a position among a panel's tabs (0 is first). */
  | { slot: string; kind: "new-tab"; at: number }
  /** Into a panel's tab, by index: its label, or its content when it's showing. */
  | { slot: string; kind: "tab"; index: number }
  /** A slot that holds one: in place of what it has, or into it when empty. */
  | { slot: string; kind: "slot" };

/** Why a drop is refused: the composer's lock, or why its picker leaves it out. */
export type DropRefusal = ComposeLock | LeftOut;

/** What a drop does: the contents after it and the tab to show, or why not. */
export type DropOutcome =
  | { ok: true; next: SlotContents; show?: { slot: string; tab: string } }
  | { ok: false; reason: DropRefusal };

const refuse = (reason: DropRefusal): DropOutcome => ({ ok: false, reason });

/** What dropping `occupant` on `target` does, by the composer's own rules. */
export function dropOutcome(
  host: TemplateHost,
  contents: SlotContents,
  target: DropTarget,
  occupant: string,
  known: readonly OccupantSpec[] = REGISTERED,
): DropOutcome {
  const spec = known.find((s) => s.name === occupant);
  if (!spec) return refuse("no-fit");
  const { slot } = target;
  const panel = contents[slot];

  if (target.kind === "slot") {
    if (holdsPanel(host, slot))
      return dropOutcome(
        host,
        contents,
        { slot, kind: "new-tab", at: 0 },
        occupant,
        known,
      );
    const why = leftOutFor(host, contents, slot, "replace", spec, known);
    if (why) return refuse(why);
    const next = panel
      ? replaceIn(host, contents, slot, occupant, known)
      : addOccupant(host, contents, slot, occupant, "new-tab", { known });
    return next === contents ? refuse("no-fit") : { ok: true, next };
  }

  const locks = panelLocks(contents, slot, known);
  if (target.kind === "new-tab") {
    if (locks.newTab) return refuse(locks.newTab);
    const why = leftOutFor(host, contents, slot, "new-tab", spec, known);
    if (why) return refuse(why);
    const next = addOccupant(host, contents, slot, occupant, "new-tab", {
      at: target.at,
      known,
    });
    return next === contents
      ? refuse("no-fit")
      : { ok: true, next, show: { slot, tab: occupant } };
  }

  const tab = panel?.tabs[target.index];
  if (!tab) return refuse("no-fit");
  const tabLock = locks.tabs[target.index];
  if (tabLock) return refuse(tabLock);
  const why = leftOutFor(host, contents, slot, target.index, spec, known);
  // An occupant that fills its tab can't join one; it can take a new tab.
  if (why) return refuse(why === "fill" ? "fill-alone" : why);
  const next = addOccupant(host, contents, slot, occupant, target.index, {
    label: firstUnusedLabel(panel),
    known,
  });
  return next === contents
    ? refuse("no-fit")
    : { ok: true, next, show: { slot, tab: tab.id } };
}
