import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import type { LocaleKey } from "@/lib/composition";
import type { LayoutChoices } from "@/lib/layout";
import { occupantsIn, type SlotContents } from "./workbench-compose";

/*
 * Where each occupant on the page is: its slot, and whether that slot is
 * hidden, left out or closed. A hidden slot keeps what it holds, so an
 * occupant there is still placed, and never offered again.
 */

/** Why a slot isn't showing, or null when it is. */
export type Hidden = "left-out" | "closed" | null;

export interface Location {
  slot: string;
  /** The slot's declared name. */
  label: string;
  hidden: Hidden;
}

/** Whether a slot shows: left out by the layout, or closed, by choice or the template's rule. */
export function hiddenAs(
  layout: LayoutChoices,
  status: Readonly<Record<string, SlotStatus>> | null,
  slot: string,
): Hidden {
  if (layout[slot]?.present === false) return "left-out";
  const after = status?.[slot];
  const open = after ? after.open : layout[slot]?.open !== false;
  return open ? null : "closed";
}

/** Each placed occupant's location, by occupant name. */
export function locationsOf(
  host: TemplateHost,
  contents: SlotContents,
  layout: LayoutChoices,
  status: Readonly<Record<string, SlotStatus>> | null,
): Readonly<Record<string, Location>> {
  return Object.fromEntries(
    host.spec.slots.flatMap(({ name: slot }) => {
      const panel = contents[slot];
      if (!panel) return [];
      const location: Location = {
        slot,
        label: host.slotLabels[slot] ?? slot,
        hidden: hiddenAs(layout, status, slot),
      };
      return occupantsIn(panel).map((occupant) => [occupant, location]);
    }),
  );
}

/** A location in words, for the list. */
export const locationCopy = (location: Location): LocaleKey =>
  location.hidden === "left-out"
    ? "workbench_in_slot_left_out"
    : location.hidden === "closed"
      ? "workbench_in_slot_closed"
      : "workbench_in_slot";
