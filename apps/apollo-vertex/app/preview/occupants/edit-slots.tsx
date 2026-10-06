"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { DropZones } from "./drop-zones";
import type { SlotTarget } from "./slot-popover";
import {
  type Box,
  frameOf,
  sideTowardCenter,
  slotElement,
  useSlotBoxes,
} from "./use-slot-boxes";
import type { SlotContents } from "./workbench-compose";
import { useWorkbenchDrag } from "./workbench-drag";

/** The frame's own box, from its top-left corner. */
const frameBox = (element: HTMLElement | null): Box => {
  const frame = frameOf(element);
  return {
    x: 0,
    y: 0,
    width: frame?.offsetWidth ?? 0,
    height: frame?.offsetHeight ?? 0,
  };
};

interface EditSlotsProps {
  host: TemplateHost;
  /** What each slot holds, and the focused occupant, for the drop zones. */
  contents: SlotContents;
  focus: string;
  /** The slot whose popover is open, if any. */
  opened: SlotTarget | null;
  onOpen: (target: SlotTarget) => void;
  onClose: () => void;
}

/**
 * Edit mode's layer over the page: every slot outlined, with its name,
 * and the whole slot a button that opens its popover, placed against it.
 * It sits beside the page, not in it, so the page can be inert, and it
 * takes no room, so no slot's width changes.
 */
export function EditSlots({
  host,
  contents,
  focus,
  opened,
  onOpen,
  onClose,
}: EditSlotsProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const boxes = useSlotBoxes(host, ref);
  // While dragging, the tabs are what to see: the names step aside.
  const dragging = useWorkbenchDrag()?.dragging ?? null;
  return (
    <div
      ref={ref}
      data-slot="workbench-edit-slots"
      className="pointer-events-none absolute inset-0 z-20"
    >
      {host.spec.slots.map(({ name: slot }) => {
        const box = boxes[slot];
        if (!box) return null;
        const label = host.slotLabels[slot] ?? slot;
        const expanded = opened?.slot === slot;
        return (
          <button
            key={slot}
            type="button"
            data-slot="workbench-edit-slot"
            data-edit-slot={slot}
            aria-haspopup="dialog"
            aria-expanded={expanded}
            aria-label={t("workbench_edit_slot", { slot: label })}
            style={{
              left: `${box.x}px`,
              top: `${box.y}px`,
              width: `${box.width}px`,
              height: `${box.height}px`,
            }}
            className="group pointer-events-auto absolute cursor-pointer rounded-sm outline-1 -outline-offset-1 outline-primary/60 outline-dashed hover:bg-primary/5 hover:outline-2 hover:outline-solid focus-visible:outline-2 focus-visible:outline-solid aria-expanded:bg-primary/5 aria-expanded:outline-2 aria-expanded:outline-solid"
            onClick={(event) => {
              if (expanded) {
                onClose();
                return;
              }
              const element = slotElement(frameOf(ref.current), host, slot);
              onOpen({
                slot,
                opener: event.currentTarget,
                anchor: element ?? event.currentTarget,
                side: sideTowardCenter(box, frameBox(ref.current)),
              });
            }}
          >
            <span
              aria-hidden="true"
              hidden={dragging !== null}
              className="absolute top-1 left-1 rounded-sm bg-primary px-1.5 py-0.5 text-[11px] leading-none font-medium text-primary-foreground"
            >
              {label}
            </span>
          </button>
        );
      })}
      <DropZones host={host} contents={contents} focus={focus} />
    </div>
  );
}
