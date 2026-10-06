import type { TemplateHost } from "@/app/_components/template-hosts";
import { type Box, boxOn, slotElement } from "./use-slot-boxes";
import { holdsPanel, type SlotContents } from "./workbench-compose";
import type { DropTarget } from "./workbench-drop";

/*
 * Where an occupant can be dropped on the template view, measured from
 * the page: in a panel slot, between its tabs and at the end of its tab
 * bar (a new tab there), on a tab's label (into that tab), and on the
 * showing tab's content (into it); anywhere in a slot that holds one, or
 * in an empty panel slot.
 */

/** What a drop zone looks like when it's the one under the drag. */
export type ZoneLook = "insert" | "tab" | "content" | "slot";

export interface DropZone {
  /** Unique on the page; also its order for the keyboard. */
  id: string;
  target: DropTarget;
  look: ZoneLook;
  /** Its box on the frame. */
  box: Box;
}

/** How wide a between-tabs zone is, centered on the gap. */
const INSERT_PX = 16;
/** How tall the strip standing in for a tab bar is, over a panel of one tab. */
const STRIP_PX = 40;

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
        look: "slot",
        box: slotBox,
      },
    ];
  const bar = element.querySelector<HTMLElement>("[data-part=tab-bar]");
  // A panel of one tab shows no tab bar: a strip at its top stands in for one.
  const tabs = bar
    ? [...bar.querySelectorAll<HTMLElement>("[data-tab-trigger]")]
        .filter((trigger) => visible(trigger))
        .map((trigger) => ({
          id: trigger.dataset.tabTrigger ?? "",
          box: boxOn(frame, trigger),
          active: trigger.getAttribute("aria-selected") === "true",
        }))
        .toSorted((a, b) => a.box.x - b.box.x)
    : [
        {
          id: panel.tabs[0]?.id ?? "",
          box: { ...slotBox, height: STRIP_PX },
          active: true,
        },
      ];
  const barBox = bar ? boxOn(frame, bar) : { ...slotBox, height: STRIP_PX };
  const indexOf = (id: string) => panel.tabs.findIndex((tab) => tab.id === id);
  const zones: DropZone[] = [];
  for (const tab of tabs) {
    const at = indexOf(tab.id);
    if (at < 0) continue;
    zones.push({
      id: `${slot}:insert:${at}`,
      target: { slot, kind: "new-tab", at },
      look: "insert",
      box: {
        x: tab.box.x - INSERT_PX / 2,
        y: barBox.y,
        width: INSERT_PX,
        height: barBox.height,
      },
    });
    zones.push({
      id: `${slot}:tab:${at}`,
      target: { slot, kind: "tab", index: at },
      look: "tab",
      box: {
        x: tab.box.x + INSERT_PX / 2,
        y: barBox.y,
        width: Math.max(0, tab.box.width - INSERT_PX),
        height: barBox.height,
      },
    });
  }
  const last = tabs.at(-1);
  if (last) {
    const start = last.box.x + last.box.width - INSERT_PX / 2;
    zones.push({
      id: `${slot}:insert:${panel.tabs.length}`,
      target: { slot, kind: "new-tab", at: panel.tabs.length },
      look: "insert",
      box: {
        x: start,
        y: barBox.y,
        width: Math.max(INSERT_PX, barBox.x + barBox.width - start),
        height: barBox.height,
      },
    });
  }
  const active = tabs.find((tab) => tab.active) ?? tabs[0];
  const index = active ? indexOf(active.id) : 0;
  const top = barBox.y + barBox.height;
  zones.push({
    id: `${slot}:content`,
    target: { slot, kind: "tab", index: Math.max(0, index) },
    look: "content",
    box: {
      x: slotBox.x,
      y: top,
      width: slotBox.width,
      height: Math.max(0, slotBox.y + slotBox.height - top),
    },
  });
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
