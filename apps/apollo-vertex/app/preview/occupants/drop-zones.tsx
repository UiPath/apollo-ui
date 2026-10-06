"use client";

import { useDroppable } from "@dnd-kit/core";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
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
}

/**
 * One place to drop: invisible until the drag is over it, then a line
 * between tabs, a highlighted tab or content, or a highlighted slot. A
 * refused one is dimmed for the whole drag, and says why when it's under
 * the drag.
 */
function Zone({ zone, outcome, reason }: ZoneProps) {
  const data: ZoneData = {
    target: zone.target,
    ...(zone.include && { include: zone.include }),
  };
  const { setNodeRef, isOver } = useDroppable({ id: zone.id, data });
  const refused = !outcome.ok;
  return (
    <div
      ref={setNodeRef}
      data-slot="workbench-drop-zone"
      data-zone={zone.id}
      data-look={zone.look}
      data-refused={refused}
      data-over={isOver}
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
          (zone.look === "content" || zone.look === "slot") &&
          "bg-primary/10 ring-2 ring-primary ring-inset",
      )}
    >
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
      {refused && isOver && reason && (
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
  /** The focused occupant. */
  focus: string;
}

/**
 * The places to drop the occupant being dragged, measured from the page
 * when the drag starts. Each says what dropping there does, by
 * dropOutcome, so it's the same as each slot's popover.
 */
export function DropZones({ host, contents, focus, ghosts }: DropZonesProps) {
  const { t } = useTranslation();
  const drag = useWorkbenchDrag();
  const dragging = drag?.dragging ?? null;
  const ref = useRef<HTMLDivElement>(null);
  const [zones, setZones] = useState<readonly DropZone[]>([]);
  useLayoutEffect(() => {
    const frame = frameOf(ref.current);
    const measured: DropZone[] =
      dragging && frame
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
  if (!dragging) return <div ref={ref} hidden />;
  return (
    <div
      ref={ref}
      data-slot="workbench-drop-zones"
      className="pointer-events-none absolute inset-0 z-30"
    >
      {zones.map((zone) => {
        const outcome = dropOutcome(
          host,
          contents,
          focus,
          zone.target,
          dragging,
        );
        return (
          <Zone
            key={zone.id}
            zone={zone}
            outcome={outcome}
            reason={
              outcome.ok ? null : t(reasonCopy(host.spec, outcome.reason))
            }
          />
        );
      })}
    </div>
  );
}
