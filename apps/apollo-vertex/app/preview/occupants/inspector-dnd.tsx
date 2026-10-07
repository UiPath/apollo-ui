"use client";

import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { type CSSProperties, type ReactNode, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { PanelSpec } from "@/lib/panel";
import type { MoveResult } from "@/lib/panel-editing";
import { type DragState, InspectorDragContext } from "./inspector-drag";
import {
  changes,
  type MoveItem,
  type MovePlace,
  placesInOrder,
} from "./inspector-move";

/*
 * Dragging in the inspector, within one panel slot: a tab by its header's
 * grip, an occupant by its card's. Rows are the drop targets; where in a
 * row the pointer is decides the place. The keyboard steps through every
 * place in order. What a move does, and why one is refused, is the
 * panel rules', the same as everywhere else.
 */

/** The pointer must move this far before a drag starts, so a click is a click. */
const DRAG_THRESHOLD_PX = 4;
/** The edge of a row, in px, that means "a new tab beside it". */
const EDGE_PX = 10;

/** A row's role as a drop target. */
export type RowZone =
  | { zone: "single"; tab: number }
  | { zone: "stack"; tab: number }
  | { zone: "end" };

/**
 * Drops are judged against the rows as they were (see onDragMove);
 * dnd-kit's own collisions aren't used.
 */
const noCollisions: CollisionDetection = () => [];

/** The rows where they were when the drag started: drops are judged there. */
interface Geometry {
  rows: readonly { zone: RowZone; rect: DOMRect }[];
  /** Each stack's cards, but the dragged one, by tab. */
  cards: ReadonlyMap<number, readonly DOMRect[]>;
  end: DOMRect | null;
}

/** The rows' drop roles, read from their data-drop-zone and data-tab-index. */
function measure(root: HTMLElement, dragged: string | null): Geometry {
  const rows = [
    ...root.querySelectorAll<HTMLElement>("[data-drop-zone]"),
  ].flatMap((el): { zone: RowZone; rect: DOMRect }[] => {
    const kind = el.dataset.dropZone;
    const tab = Number(el.dataset.tabIndex);
    const rect = el.getBoundingClientRect();
    if (kind === "end") return [{ zone: { zone: "end" }, rect }];
    if (kind === "single" || kind === "stack")
      return [{ zone: { zone: kind, tab }, rect }];
    return [];
  });
  const cards = new Map<number, DOMRect[]>();
  for (const card of root.querySelectorAll<HTMLElement>("[data-stack-card]")) {
    if (card.dataset.row === dragged) continue;
    const tab = Number(card.dataset.tabIndex);
    cards.set(tab, [...(cards.get(tab) ?? []), card.getBoundingClientRect()]);
  }
  const end = root.querySelector("[data-drop-zone=end]");
  return { rows, cards, end: end?.getBoundingClientRect() ?? null };
}

const isItem = (data: unknown): data is { item: MoveItem; name: string } =>
  typeof data === "object" && data !== null && "item" in data && "name" in data;

/** Where in a row the pointer is: its edges are new tabs, its middle a stack. */
function placeIn(
  zone: RowZone,
  rect: { top: number; height: number },
  y: number,
  item: MoveItem,
  cards: readonly DOMRect[],
  tabs: number,
): MovePlace | null {
  if (zone.zone === "end") return { kind: "new-tab", at: tabs };
  const half = y < rect.top + rect.height / 2;
  // A tab only goes between tabs.
  if (item.kind === "tab")
    return { kind: "new-tab", at: half ? zone.tab : zone.tab + 1 };
  if (y < rect.top + EDGE_PX) return { kind: "new-tab", at: zone.tab };
  if (y > rect.top + rect.height - EDGE_PX)
    return { kind: "new-tab", at: zone.tab + 1 };
  if (zone.zone === "single") return { kind: "into", tab: zone.tab, at: 1 };
  const at = cards.filter((card) => card.top + card.height / 2 < y).length;
  return { kind: "into", tab: zone.tab, at };
}

interface InspectorDndProps {
  panel: PanelSpec;
  /** What a move would do, or why it's refused. */
  preview: (item: MoveItem, place: MovePlace) => MoveResult;
  onMove: (item: MoveItem, place: MovePlace) => void;
  /** A place in words, for announcements. */
  placeName: (place: MovePlace) => string;
  /** A refusal in words. */
  reason: (result: MoveResult) => string;
  children: ReactNode;
}

/** The drag and drop around a panel slot's rows in the inspector. */
export function InspectorDnd({
  panel,
  preview,
  onMove,
  placeName,
  reason,
  children,
}: InspectorDndProps) {
  const { t } = useTranslation();
  const [drag, setDragState] = useState<DragState | null>(null);
  // The same, for the sensors' callbacks, which keep their first closure.
  const dragRef = useRef<DragState | null>(null);
  const setDrag = (
    next: DragState | null | ((now: DragState | null) => DragState | null),
  ) => {
    const value = typeof next === "function" ? next(dragRef.current) : next;
    dragRef.current = value;
    setDragState(value);
  };
  const [said, setSaid] = useState("");
  const root = useRef<HTMLDivElement>(null);
  // Where the keyboard has moved the drag to, among every place in order.
  const step = useRef(-1);
  const geometry = useRef<Geometry | null>(null);

  const land = (place: MovePlace | null) =>
    setDrag((now) => {
      if (!now) return now;
      const same = JSON.stringify(place) === JSON.stringify(now.place);
      if (same) return now;
      const result = place ? preview(now.item, place) : null;
      if (place && result)
        setSaid(
          result.ok
            ? t("workbench_drag_over", { place: placeName(place) })
            : t("workbench_drag_over_refused", {
                place: placeName(place),
                reason: reason(result),
              }),
        );
      const noop = !place || (result?.ok === true && !changes(panel, result));
      return { ...now, place, result, noop };
    });

  const keyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { currentCoordinates },
  ) => {
    const forward = event.code === "ArrowDown" || event.code === "ArrowRight";
    const back = event.code === "ArrowUp" || event.code === "ArrowLeft";
    const now = dragRef.current;
    if (!now || (!forward && !back)) return;
    event.preventDefault();
    const places = placesInOrder(panel, now.item);
    if (places.length === 0) return;
    step.current =
      step.current < 0
        ? forward
          ? 0
          : places.length - 1
        : (step.current + (forward ? 1 : -1) + places.length) % places.length;
    land(places[step.current] ?? null);
    // The overlay follows a little, so it reads as moving.
    return {
      x: currentCoordinates.x,
      y: currentCoordinates.y + (forward ? 12 : -12),
    };
  };
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: DRAG_THRESHOLD_PX },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current;
    if (!isItem(data)) return;
    step.current = -1;
    if (root.current)
      geometry.current = measure(
        root.current,
        data.item.kind === "occupant" ? data.item.name : null,
      );
    setSaid(t("workbench_drag_start", { occupant: data.name }));
    setDrag({
      item: data.item,
      name: data.name,
      place: null,
      result: null,
      noop: true,
      height: active.rect.current.initial?.height ?? 32,
    });
  };
  const onDragMove = ({ activatorEvent, delta }: DragMoveEvent) => {
    const now = dragRef.current;
    const at = geometry.current;
    if (!(activatorEvent instanceof PointerEvent) || !now || !at) return;
    const y = activatorEvent.clientY + delta.y;
    // An open slot pushes what's below it down by its size: take that out,
    // and the pointer is on the rows as they were. Over the slot, the
    // place stays.
    const slot = root.current
      ?.querySelector("[data-slot=workbench-contents-drop-slot]")
      ?.getBoundingClientRect();
    const endNow = root.current
      ?.querySelector("[data-drop-zone=end]")
      ?.getBoundingClientRect();
    const shift = at.end && endNow ? endNow.top - at.end.top : 0;
    let still = y;
    if (slot && shift > 0) {
      if (y >= slot.top && y < slot.top + shift) return;
      if (y >= slot.top + shift) still = y - shift;
    }
    const row = at.rows.find(
      (r) => still >= r.rect.top && still <= r.rect.bottom,
    );
    // Between rows: it stays where it was.
    if (!row) return;
    const cards =
      row.zone.zone === "stack" ? (at.cards.get(row.zone.tab) ?? []) : [];
    land(
      placeIn(row.zone, row.rect, still, now.item, cards, panel.tabs.length),
    );
  };
  const finish = (dropped: boolean) => {
    const now = dragRef.current;
    setDrag(null);
    step.current = -1;
    geometry.current = null;
    if (!now) return;
    if (!dropped) {
      setSaid(t("workbench_drag_cancel", { occupant: now.name }));
      return;
    }
    if (!now.place || !now.result || !changes(panel, now.result)) {
      setSaid(t("workbench_drag_end_nowhere", { occupant: now.name }));
      return;
    }
    if (!now.result.ok) {
      setSaid(
        t("workbench_drag_end_refused", {
          occupant: now.name,
          reason: reason(now.result),
        }),
      );
      return;
    }
    setSaid(
      t("workbench_drag_end", {
        occupant: now.name,
        place: placeName(now.place),
      }),
    );
    onMove(now.item, now.place);
  };
  const onDragEnd = (_: DragEndEvent) => finish(true);

  // The lifted card is as wide as the rows.
  const overlay: CSSProperties = {
    width: root.current?.getBoundingClientRect().width ?? 0,
  };
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={noCollisions}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      accessibility={{
        // Every step is said in the live region below, in the workbench's words.
        announcements: {
          onDragStart: () => "",
          onDragOver: () => "",
          onDragEnd: () => "",
          onDragCancel: () => "",
        },
        screenReaderInstructions: {
          draggable: t("workbench_move_instructions"),
        },
      }}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={() => finish(false)}
    >
      <InspectorDragContext.Provider value={drag}>
        <div
          ref={root}
          data-slot="workbench-contents-dnd"
          data-dragging={drag !== null}
        >
          {children}
        </div>
      </InspectorDragContext.Provider>
      <p
        aria-live="assertive"
        className="sr-only"
        data-slot="workbench-move-said"
      >
        {said}
      </p>
      <DragOverlay dropAnimation={null}>
        {drag && (
          <div
            data-slot="workbench-move-preview"
            style={overlay}
            // Lifted: a shadow and a faint accent ring; a tilt only with motion.
            className="flex min-h-8 items-center gap-1 rounded-sm bg-background px-1 text-sm shadow-lg ring-2 ring-primary/40 motion-safe:rotate-1 motion-safe:animate-in motion-safe:zoom-in-95"
          >
            <GripVertical
              aria-hidden
              className="size-4 text-muted-foreground"
            />
            <span className="truncate font-medium">{drag.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
