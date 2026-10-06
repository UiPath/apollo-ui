"use client";

import {
  type Announcements,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { specFor } from "@/lib/occupant-lookup";
import type { TabSpec } from "@/lib/panel";
import { offsetFromPointer } from "./drag-preview-offset";
import type { DropZone } from "./drop-zones-geometry";
import type { ContentsChange, SlotContents } from "./workbench-compose";
import { DragContext } from "./workbench-drag";
import { type DropTarget, dropOutcome } from "./workbench-drop";
import { reasonCopy } from "./workbench-layout";

/*
 * Dragging an occupant from the list onto the template view, in Edit mode.
 * What a drop does, and why one is refused, is dropOutcome's: the
 * composer's own rules, the same as each slot's popover.
 */

/** A drag starts once the pointer moves this far, so a plain click still selects. */
const DRAG_THRESHOLD_PX = 8;

const occupantOf = (data: unknown): string | null =>
  typeof data === "object" &&
  data &&
  "occupant" in data &&
  typeof data.occupant === "string"
    ? data.occupant
    : null;
const targetOf = (data: unknown): DropTarget | null =>
  typeof data === "object" && data && "target" in data
    ? // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- only drop zones carry a target
      (data.target as DropTarget)
    : null;

const includeOf = (data: unknown): string | null =>
  typeof data === "object" &&
  data &&
  "include" in data &&
  typeof data.include === "string"
    ? data.include
    : null;

interface WorkbenchDndProps {
  host: TemplateHost | undefined;
  contents: SlotContents;
  /** The focused occupant. */
  focus: string;
  onContents: ContentsChange;
  children: ReactNode;
}

/** The drag and drop around the workbench: its sensors, announcements, and drops. */
export function WorkbenchDnd({
  host,
  contents,
  focus,
  onContents,
  children,
}: WorkbenchDndProps) {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState<string | null>(null);
  const zones = useRef<readonly DropZone[]>([]);
  // The zone the keyboard moved to: it's where the drag is, not the pointer.
  const keyboardZone = useRef<string | null>(null);

  const keyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { context },
  ) => {
    const order = zones.current;
    if (order.length === 0) return;
    const forward = event.code === "ArrowRight" || event.code === "ArrowDown";
    const back = event.code === "ArrowLeft" || event.code === "ArrowUp";
    if (!forward && !back) return;
    event.preventDefault();
    const now = order.findIndex((zone) => zone.id === keyboardZone.current);
    const next =
      now < 0
        ? forward
          ? 0
          : order.length - 1
        : (now + (forward ? 1 : -1) + order.length) % order.length;
    const zone = order[next];
    if (!zone) return;
    keyboardZone.current = zone.id;
    const rect = context.droppableRects.get(zone.id);
    if (!rect) return;
    return { x: rect.left, y: rect.top };
  };
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_THRESHOLD_PX },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );
  // The pointer's zone, or the keyboard's.
  const collisions: CollisionDetection = (args) =>
    args.pointerCoordinates
      ? pointerWithin(args)
      : keyboardZone.current
        ? [{ id: keyboardZone.current }]
        : [];

  const name = (occupant: string | null) =>
    occupant ? (specFor(occupant)?.label ?? occupant) : "";
  const slotName = (slot: string) =>
    (host?.slotLabels[slot] ?? slot).toLowerCase();
  const tabName = (tab: TabSpec | undefined) => {
    if (!tab) return "";
    if (tab.label) return t(tab.label);
    const [first] = tab.occupants;
    const occupant = typeof first === "string" ? first : first?.occupant;
    const spec = occupant ? specFor(occupant) : null;
    return spec ? t(spec.titleKey) : (occupant ?? "");
  };
  const place = (target: DropTarget) => {
    const slot = slotName(target.slot);
    const panel = contents[target.slot];
    if (target.kind === "new-tab") {
      const before = panel?.tabs[target.at];
      return before
        ? t("workbench_drop_new_tab", { slot, tab: tabName(before) })
        : t("workbench_drop_new_tab_end", { slot });
    }
    if (target.kind === "tab")
      return t("workbench_drop_tab", {
        slot,
        tab: tabName(panel?.tabs[target.index]),
      });
    const [here] = panel?.tabs[0]?.occupants ?? [];
    const occupant = typeof here === "string" ? here : here?.occupant;
    return occupant
      ? t("workbench_drop_replace", { slot, occupant: name(occupant) })
      : t("workbench_drop_slot", { slot });
  };
  const outcome = (target: DropTarget, occupant: string) =>
    host ? dropOutcome(host, contents, focus, target, occupant) : null;

  const announcements: Announcements = {
    onDragStart: ({ active }) =>
      t("workbench_drag_start", {
        occupant: name(occupantOf(active.data.current)),
      }),
    onDragOver: ({ active, over }) => {
      const occupant = occupantOf(active.data.current);
      const target = targetOf(over?.data.current);
      if (!occupant || !target || !host) return;
      const result = outcome(target, occupant);
      return result && !result.ok
        ? t("workbench_drag_over_refused", {
            place: place(target),
            reason: t(reasonCopy(host.spec, result.reason)),
          })
        : t("workbench_drag_over", { place: place(target) });
    },
    onDragEnd: ({ active, over }) => {
      const occupant = occupantOf(active.data.current);
      const target = targetOf(over?.data.current);
      if (!occupant || !target || !host)
        return t("workbench_drag_end_nowhere", { occupant: name(occupant) });
      const result = outcome(target, occupant);
      return result && !result.ok
        ? t("workbench_drag_end_refused", {
            occupant: name(occupant),
            reason: t(reasonCopy(host.spec, result.reason)),
          })
        : t("workbench_drag_end", {
            occupant: name(occupant),
            place: place(target),
          });
    },
    onDragCancel: ({ active }) =>
      t("workbench_drag_cancel", {
        occupant: name(occupantOf(active.data.current)),
      }),
  };

  const end = (event: DragEndEvent) => {
    setDragging(null);
    keyboardZone.current = null;
    const occupant = occupantOf(event.active.data.current);
    const target = targetOf(event.over?.data.current);
    if (!occupant || !target) return;
    const result = outcome(target, occupant);
    const include = includeOf(event.over?.data.current);
    if (!result?.ok) return;
    // On a left-out slot's ghost, the drop includes the slot too: one change.
    if (include) onContents(result.next, result.show, include);
    else onContents(result.next, result.show);
  };

  return (
    <DragContext.Provider value={{ dragging, zones }}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisions}
        // The zones are measured when the drag starts, and change with it.
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        accessibility={{
          announcements,
          screenReaderInstructions: {
            draggable: t("workbench_drag_instructions"),
          },
        }}
        onDragStart={(event) => {
          keyboardZone.current = null;
          setDragging(occupantOf(event.active.data.current));
        }}
        onDragEnd={end}
        onDragCancel={() => {
          setDragging(null);
          keyboardZone.current = null;
        }}
      >
        {children}
        <DragOverlay dropAnimation={null} modifiers={[offsetFromPointer]}>
          {dragging && (
            <div
              data-slot="workbench-drag-preview"
              className="flex w-fit items-center gap-1.5 rounded-md border border-primary bg-background px-3 py-2 text-sm font-medium shadow-lg"
            >
              <GripVertical
                aria-hidden
                className="size-4 text-muted-foreground"
              />
              {name(dragging)}
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </DragContext.Provider>
  );
}
