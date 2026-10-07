import type { TemplateHost } from "@/app/_components/template-hosts";
import { type Box, boxOn, slotElement } from "./use-slot-boxes";
import { holdsPanel, type SlotContents } from "./workbench-compose";
import type { DropTarget } from "./workbench-drop";

/*
 * Where an occupant can be dropped on the template view, measured from
 * the page. A panel slot that has occupants is two large choices filling
 * it: "Add as tab" above, a new tab at the end, and "Stack with" its
 * showing tab below. Where it has a tab bar, its precise places win
 * over them: between its tabs and at the bar's end (a new tab there),
 * and on a tab's label (into that tab), each as tall as the tab. An
 * empty panel slot is one choice, "Add to" it; a slot that holds one is
 * one zone, in place of what it has.
 */

/** What a drop zone looks like when it's the one under the drag. */
export type ZoneLook = "insert" | "tab" | "choice" | "slot";

/** A large labeled choice: add as a tab, stack with the tab showing, or add to an empty panel. */
export type ZoneChoice = "as-tab" | "stack" | "add-to";

/** Precise places, in the tab bar, win over the large choices where they overlap. */
export const isPrecise = (zone: DropZone) =>
  zone.look === "insert" || zone.look === "tab";

export interface DropZone {
  /** Unique on the page; also its order for the keyboard. */
  id: string;
  target: DropTarget;
  look: ZoneLook;
  /** Its box on the frame. */
  box: Box;
  /** A left-out slot's ghost: a drop there includes the slot too. */
  include?: string;
  /** A large labeled choice, filling half its slot or all of it. */
  choice?: ZoneChoice;
}

/** How wide a between-tabs zone is, centered on the gap. */
const INSERT_PX = 16;
/** The gap between a panel's two large choices. */
const CHOICE_GAP_PX = 4;

const visible = (element: HTMLElement) =>
  !element.hidden && element.offsetWidth > 0;

/** A panel slot's zones: its tabs, the gaps between them, and its content. */
function panelZones(
  frame: HTMLElement,
  slot: string,
  element: HTMLElement,
  contents: SlotContents,
): DropZone[] {
  const panel = contents[slot];
  const slotBox = boxOn(frame, element);
  if (!panel || panel.tabs.length === 0)
    return [
      {
        id: `${slot}:slot`,
        target: { slot, kind: "slot" },
        look: "choice",
        choice: "add-to",
        box: slotBox,
      },
    ];
  const zones: DropZone[] = [];
  // A panel of one tab has no tab bar: the two choices are all it has.
  const bar = element.querySelector<HTMLElement>("[data-part=tab-bar]");
  const tabs = bar
    ? [...bar.querySelectorAll<HTMLElement>("[data-tab-trigger]")]
        .filter((trigger) => visible(trigger))
        .map((trigger) => ({
          id: trigger.dataset.tabTrigger ?? "",
          box: boxOn(frame, trigger),
          active: trigger.getAttribute("aria-selected") === "true",
        }))
        .toSorted((a, b) => a.box.x - b.box.x)
    : [];
  const indexOf = (id: string) => panel.tabs.findIndex((tab) => tab.id === id);
  for (const tab of tabs) {
    const at = indexOf(tab.id);
    if (at < 0) continue;
    zones.push({
      id: `${slot}:insert:${at}`,
      target: { slot, kind: "new-tab", at },
      look: "insert",
      box: {
        x: tab.box.x - INSERT_PX / 2,
        y: tab.box.y,
        width: INSERT_PX,
        height: tab.box.height,
      },
    });
    zones.push({
      id: `${slot}:tab:${at}`,
      target: { slot, kind: "tab", index: at },
      look: "tab",
      box: {
        x: tab.box.x + INSERT_PX / 2,
        y: tab.box.y,
        width: Math.max(0, tab.box.width - INSERT_PX),
        height: tab.box.height,
      },
    });
  }
  const last = tabs.at(-1);
  if (bar && last) {
    const barBox = boxOn(frame, bar);
    const start = last.box.x + last.box.width - INSERT_PX / 2;
    zones.push({
      id: `${slot}:insert:${panel.tabs.length}`,
      target: { slot, kind: "new-tab", at: panel.tabs.length },
      look: "insert",
      box: {
        x: start,
        y: last.box.y,
        width: Math.max(INSERT_PX, barBox.x + barBox.width - start),
        height: last.box.height,
      },
    });
  }
  const active = tabs.find((tab) => tab.active) ?? tabs[0];
  const showing = active ? Math.max(0, indexOf(active.id)) : 0;
  const half = (slotBox.height - CHOICE_GAP_PX) / 2;
  zones.push(
    {
      id: `${slot}:as-tab`,
      target: { slot, kind: "new-tab", at: panel.tabs.length },
      look: "choice",
      choice: "as-tab",
      box: { ...slotBox, height: half },
    },
    {
      id: `${slot}:stack`,
      target: { slot, kind: "tab", index: showing },
      look: "choice",
      choice: "stack",
      box: { ...slotBox, y: slotBox.y + half + CHOICE_GAP_PX, height: half },
    },
  );
  return zones;
}

/** Every drop zone on the page, slot by slot, in the template's order. */
export function measureZones(
  frame: HTMLElement,
  host: TemplateHost,
  contents: SlotContents,
): DropZone[] {
  return host.spec.slots.flatMap(({ name: slot }) => {
    const element = slotElement(frame, host, slot);
    if (!element || element.offsetWidth === 0) return [];
    if (holdsPanel(host, slot))
      return panelZones(frame, slot, element, contents);
    return [
      {
        id: `${slot}:slot`,
        target: { slot, kind: "slot" },
        look: "slot",
        box: boxOn(frame, element),
      },
    ];
  });
}
