import { createContext, useContext } from "react";
import type { DropZone } from "./drop-zones-geometry";
import type { DropTarget } from "./workbench-drop";

/*
 * The drag in progress on the workbench, shared by the list rows that
 * start it and the drop zones that end it (see workbench-dnd).
 */

/** The data a drop zone carries. */
export interface ZoneData {
  target: DropTarget;
}

/** The data a dragged list row carries. */
export interface DragData {
  occupant: string;
}

interface DragContextValue {
  /** The occupant being dragged, if any. */
  dragging: string | null;
  /** The drop zones in keyboard order, set by the zones as they render. */
  zones: { current: readonly DropZone[] };
}

export const DragContext = createContext<DragContextValue | null>(null);

/** The drag in progress, for the list rows and the drop zones. */
export const useWorkbenchDrag = () => useContext(DragContext);
