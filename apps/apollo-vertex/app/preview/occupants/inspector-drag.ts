import { createContext, useContext } from "react";
import type { MoveResult } from "@/lib/panel-editing";
import type { MoveItem, MovePlace } from "./inspector-move";

/** A drag in a panel slot's inspector: what's dragged, and where it would land. */
export interface DragState {
  item: MoveItem;
  /** The dragged thing's name, for the overlay and announcements. */
  name: string;
  place: MovePlace | null;
  result: MoveResult | null;
  /** Whether it would land back where it is: no slot opens. */
  noop: boolean;
  /** The dragged row's height: the slot opens at its size. */
  height: number;
}

export const InspectorDragContext = createContext<DragState | null>(null);
/** The drag in this slot's inspector, if any. */
export const useInspectorDrag = () => useContext(InspectorDragContext);
