"use client";

import { useDndContext, useDroppable } from "@dnd-kit/core";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { specFor } from "@/lib/occupant-lookup";
import { cn } from "@/lib/utils";
import { type DropZone, measureZones } from "./drop-zones-geometry";
import { type Box, frameOf } from "./use-slot-boxes";
import type { SlotContents } from "./workbench-compose";
import { useWorkbenchDrag, type ZoneData } from "./workbench-drag";
import { type DropOutcome, dropOutcome } from "./workbench-drop";
import { reasonCopy } from "./workbench-layout";

interface ZoneProps {
  zone: DropZone;
  outcome: DropOutcome;
  /** Why it's refused, in words, when it is. */
  reason: string | null;
  /** A large choice's name: "Add as tab", "Stack with Queue". */
  label: string | null;
  /** Whether the drag is over this zone's slot: its choices show. */
  inSlot: boolean;
}

/**
 * One place to drop. A precise one is unseen until the drag is over it,
 * then a line between tabs or a highlighted tab; a slot that holds one
 * highlights. A large choice shows, labeled, while the drag is over its
 * slot, and highlights under the pointer. A refused one is dimmed for the
 * whole drag; a refused choice says why in it, and a precise one when
 * it's under the drag.
 */
function Zone({ zone, outcome, reason, label, inSlot }: ZoneProps) {
  const data: ZoneData = {
    target: zone.target,
    ...(zone.include && { include: zone.include }),
    ...(label && { label }),
  };
  const { setNodeRef, isOver } = useDroppable({ id: zone.id, data });
  const refused = !outcome.ok;
  const choice = zone.look === "choice";
  return (
    <div
      ref={setNodeRef}
      data-slot="workbench-drop-zone"
      data-zone={zone.id}
      data-look={zone.look}
      {...(zone.choice && { "data-choice": zone.choice })}
      data-refused={refused}
      data-over={isOver}
      data-shown={choice && inSlot}
      style={{
        left: `${zone.box.x}px`,
        top: `${zone.box.y}px`,
        width: `${zone.box.width}px`,
        height: `${zone.box.height}px`,
      }}
      className={cn(
        "absolute",
        // Refused: dimmed for the whole drag.
        refused &&
          zone.look !== "insert" &&
          "bg-muted/60 bg-[repeating-linear-gradient(135deg,transparent_0_6px,var(--border)_6px_7px)]",
        !refused &&
          isOver &&
          zone.look === "tab" &&
          "rounded-md bg-primary/20 ring-2 ring-primary",
        !refused &&
          isOver &&
          zone.look === "slot" &&
          "bg-primary/10 ring-2 ring-primary ring-inset",
        // A choice: labeled while the drag is over its slot.
        choice &&
          inSlot &&
          "flex flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-primary/40 p-3 text-center",
        choice && inSlot && !refused && "bg-background/80",
        choice &&
          inSlot &&
          !refused &&
          isOver &&
          "border-solid border-primary bg-primary/10",
      )}
    >
      {choice && inSlot && label && (
        <span
          data-slot="workbench-drop-choice"
          className={cn(
            "rounded-md bg-background px-2 py-1 text-sm font-medium shadow-sm",
            refused ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {label}
        </span>
      )}
      {choice && inSlot && refused && reason && (
        <span
          data-slot="workbench-drop-reason"
          className="max-w-64 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md"
        >
          {reason}
        </span>
      )}
      {zone.look === "insert" && isOver && !refused && (
        <span
          aria-hidden="true"
          data-slot="workbench-insert-line"
          className={cn(
            "absolute inset-y-1 w-0.5 rounded-full bg-primary",
            // At the end of the bar, the line is where the new tab starts.
            zone.box.width > 16 ? "start-0" : "start-1/2 -translate-x-1/2",
          )}
        />
      )}
      {!choice && refused && isOver && reason && (
        <span
          data-slot="workbench-drop-reason"
          className="absolute top-1 left-1 z-10 max-w-64 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md"
        >
          {reason}
        </span>
      )}
    </div>
  );
}

interface DropZonesProps {
  host: TemplateHost;
  /** The left-out slots' ghosts: dropping on one includes the slot too. */
  ghosts: readonly { slot: string; box: Box }[];
  contents: SlotContents;
}

/**
 * The places to drop the occupant being dragged, measured from the page
 * when the drag starts. Each says what dropping there does, by
 * dropOutcome, so it's the same as each slot's popover.
 */
export function DropZones({ host, contents, ghosts }: DropZonesProps) {
  const { t } = useTranslation();
  const drag = useWorkbenchDrag();
  // The slot the drag is over: its large choices show.
  const overSlot = String(useDndContext().over?.id ?? "").split(":")[0] ?? "";
  // A tab as the page names it: its label, else its occupant's title.
  const tabName = (slot: string, index: number) => {
    const tab = contents[slot]?.tabs[index];
    if (!tab) return "";
    if (tab.label) return t(tab.label);
    const [first] = tab.occupants;
    const occupant = typeof first === "string" ? first : first?.occupant;
    const key = occupant ? specFor(occupant)?.titleKey : null;
    return key ? t(key) : (occupant ?? "");
  };
  const labelOf = (zone: DropZone) => {
    if (zone.choice === "as-tab") return t("workbench_drop_choice_as_tab");
    if (zone.choice === "stack" && zone.target.kind === "tab")
      return t("workbench_drop_choice_stack", {
        tab: tabName(zone.target.slot, zone.target.index),
      });
    if (zone.choice === "add-to")
      return t("workbench_drop_choice_add_to", {
        slot: host.slotLabels[zone.target.slot] ?? zone.target.slot,
      });
    return null;
  };
  const dragging = drag?.dragging ?? null;
  const ref = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<readonly DropZone[]>([]);
  useLayoutEffect(() => {
    const frame = frameOf(ref.current);
    // Measured again as a drag starts, as the tabs may have changed.
    const measured: DropZone[] = frame
      ? [
          ...measureZones(frame, host, contents),
          ...ghosts.map(({ slot, box }) => ({
            id: `${slot}:ghost`,
            target: { slot, kind: "slot" as const },
            look: "slot" as const,
            box,
            include: slot,
          })),
        ]
      : [];
    setZones(measured);
    if (drag) drag.zones.current = measured;
  }, [dragging, host, contents, drag, ghosts]);
  // The places are there before a drag starts, unseen, so the drag
  // measures them as it starts and the keyboard can reach every one.
  return (
    <div
      ref={ref}
      data-slot={
        dragging ? "workbench-drop-zones" : "workbench-drop-zones-idle"
      }
      className="pointer-events-none absolute inset-0 z-30"
    >
      {zones.map((zone) => {
        const outcome: DropOutcome = dragging
          ? dropOutcome(host, contents, zone.target, dragging)
          : { ok: true, next: contents };
        return (
          <Zone
            key={zone.id}
            zone={zone}
            outcome={outcome}
            label={labelOf(zone)}
            inSlot={dragging !== null && zone.target.slot === overSlot}
            reason={
              outcome.ok ? null : t(reasonCopy(host.spec, outcome.reason))
            }
          />
        );
      })}
    </div>
  );
}
