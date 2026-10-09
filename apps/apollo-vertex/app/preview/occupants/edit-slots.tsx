"use client";

import { type MouseEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import type { LayoutChoices } from "@/lib/layout";
import { DropZones } from "./drop-zones";
import { ghostBox, leftOutSlots } from "./ghost-geometry";
import { type Box, TEMPLATE_BOX, useSlotBoxes } from "./use-slot-boxes";
import { occupantsIn, type SlotContents } from "./workbench-compose";
import { useWorkbenchDrag } from "./workbench-drag";

/** A box as an absolutely placed element's style. */
const place = (box: Box) => ({
  left: `${box.x}px`,
  top: `${box.y}px`,
  width: `${box.width}px`,
  height: `${box.height}px`,
});

/**
 * The room a slot's label needs above the slot's top edge. With less
 * (the header, at the top of the page), it sits inside the top-right
 * corner instead. Either way it's clear of the slot's content's start.
 */
const LABEL_ROOM = 18;

/** How wide a closed slot's strip is, on its edge of the template. */
const STRIP = 24;

/** A closed slot's strip: on its edge of the template, over the slot beside it. */
const strip = (box: Box, template: Box | undefined): Box => {
  const atStart = !template || box.x - template.x < template.width / 2;
  return { ...box, x: atStart ? box.x : box.x - STRIP, width: STRIP };
};

interface EditSlotsProps {
  host: TemplateHost;
  /** The page's layout choices, for the slots it left out. */
  layout: LayoutChoices;
  /** What each slot holds, for the drop zones. */
  contents: SlotContents;
  /** The slot selected, if any: the inspector shows it. */
  selected: string | null;
  /** Selects a slot; `byKeyboard` when it was Enter or Space, not a click. */
  onSelect: (slot: string, byKeyboard: boolean) => void;
  /** The inspector's id, which a slot's selection shows. */
  inspectorId: string;
}

/**
 * Edit mode's layer over the page: every slot outlined, with its name
 * above its top edge (inside its top-right corner without room there),
 * and the whole slot a button that selects it, for the inspector; a slot
 * the page left out is a ghost where it would sit, and a closed one a
 * strip on its edge, each selected the same way.
 * It sits beside the page, not in it, so the page can be inert, and it
 * takes no room, so no slot's width changes.
 */
export function EditSlots({
  host,
  layout,
  contents,
  selected,
  onSelect,
  inspectorId,
}: EditSlotsProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const boxes = useSlotBoxes(host, ref);
  // Each left-out slot's ghost, where it would sit.
  const template = boxes[TEMPLATE_BOX];
  // A closed slot has no width: no edge to line a ghost up with.
  const open = Object.fromEntries(
    Object.entries(boxes).filter(([, box]) => box.width > 0),
  );
  const ghosts = template
    ? leftOutSlots(host.spec, layout).flatMap((slot) => {
        const box = ghostBox(host.spec, layout, slot, template, open);
        return box ? [{ slot, box }] : [];
      })
    : [];
  // While dragging, the tabs are what to see: the names step aside.
  const dragging = useWorkbenchDrag()?.dragging ?? null;
  // A click selects; Enter or Space (a click with no pointer) moves on to it.
  const select = (slot: string) => (event: MouseEvent<HTMLButtonElement>) =>
    onSelect(slot, event.detail === 0);
  // A hidden slot keeps what it holds: its ghost or strip says how many.
  const held = (slot: string, hidden: "left-out" | "closed") => {
    const panel = contents[slot];
    const count = panel ? occupantsIn(panel).length : 0;
    const values = { slot: host.slotLabels[slot] ?? slot, count };
    if (hidden === "closed")
      return count > 0
        ? t("workbench_closed_label_held", values)
        : t("workbench_closed_label", values);
    return count > 0
      ? t("workbench_ghost_label_held", values)
      : t("workbench_ghost_label", values);
  };
  return (
    <div
      ref={ref}
      data-slot="workbench-edit-slots"
      className="pointer-events-none absolute inset-0 z-20 select-none"
    >
      {host.spec.slots.map(({ name: slot }) => {
        const box = boxes[slot];
        if (!box) return null;
        const label = host.slotLabels[slot] ?? slot;
        if (box.width === 0)
          return (
            <button
              key={slot}
              type="button"
              data-slot="workbench-closed-slot"
              data-edit-slot={slot}
              data-selected={selected === slot}
              aria-pressed={selected === slot}
              aria-controls={inspectorId}
              aria-label={held(slot, "closed")}
              style={place(strip(box, template))}
              className="pointer-events-auto absolute z-10 flex cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-muted-foreground/50 bg-background/90 text-[11px] font-medium text-muted-foreground hover:border-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:outline-none data-[selected=true]:border-solid data-[selected=true]:border-primary data-[selected=true]:text-foreground"
              onClick={select(slot)}
            >
              <span aria-hidden="true" className="[writing-mode:vertical-rl]">
                {held(slot, "closed")}
              </span>
            </button>
          );
        const inside = box.y < LABEL_ROOM;
        return (
          <button
            key={slot}
            type="button"
            data-slot="workbench-edit-slot"
            data-edit-slot={slot}
            data-selected={selected === slot}
            aria-pressed={selected === slot}
            aria-controls={inspectorId}
            aria-label={t("workbench_edit_slot", { slot: label })}
            style={place(box)}
            className="group pointer-events-auto absolute cursor-pointer rounded-sm outline-1 -outline-offset-1 outline-muted-foreground/50 outline-dashed hover:outline-2 hover:outline-solid hover:outline-muted-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-ring data-[selected=true]:outline-2 data-[selected=true]:outline-solid data-[selected=true]:outline-primary"
            onClick={select(slot)}
          >
            <span
              aria-hidden="true"
              hidden={dragging !== null}
              data-slot="workbench-edit-slot-label"
              data-label-at={inside ? "inside" : "above"}
              // Above the top edge, so it never covers the slot's content.
              className="absolute bottom-full left-0 mb-px rounded-sm border border-border bg-secondary px-1.5 py-0.5 text-[11px] leading-none font-medium text-secondary-foreground group-data-[selected=true]:border-primary group-data-[selected=true]:bg-primary group-data-[selected=true]:text-primary-foreground data-[label-at=inside]:top-1 data-[label-at=inside]:right-1 data-[label-at=inside]:bottom-auto data-[label-at=inside]:left-auto data-[label-at=inside]:mb-0"
            >
              {label}
            </span>
          </button>
        );
      })}
      {ghosts.map(({ slot, box }) => {
        return (
          <button
            key={slot}
            type="button"
            data-slot="workbench-ghost-slot"
            data-ghost-slot={slot}
            data-selected={selected === slot}
            aria-pressed={selected === slot}
            aria-controls={inspectorId}
            aria-label={held(slot, "left-out")}
            style={place(box)}
            className="pointer-events-auto absolute flex cursor-pointer items-center justify-center rounded-sm border-2 border-dashed border-muted-foreground/50 bg-background/70 bg-[repeating-linear-gradient(135deg,transparent_0_8px,var(--border)_8px_9px)] text-xs font-medium text-muted-foreground backdrop-blur-[1px] hover:border-muted-foreground hover:text-foreground focus-visible:border-ring focus-visible:outline-none data-[selected=true]:border-solid data-[selected=true]:border-primary data-[selected=true]:text-foreground"
            onClick={select(slot)}
          >
            <span
              aria-hidden="true"
              className="rounded-sm bg-background px-1.5 py-0.5"
            >
              {held(slot, "left-out")}
            </span>
          </button>
        );
      })}
      <DropZones host={host} contents={contents} ghosts={ghosts} />
    </div>
  );
}
