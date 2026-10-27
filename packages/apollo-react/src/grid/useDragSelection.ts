import type React from 'react';
import { useEffect, useRef } from 'react';
import { isBlankContainerPress } from './gridEvents';

interface CellPosition {
  row: number;
  col: number;
}

interface DragSelectionOptions {
  editing: boolean;
  /** Whether this grid holds a selection a Shift-press can extend. */
  hasSelection: boolean;
  /** The cell an event landed on, or null for anything that is not a cell. */
  cellAt: (element: Element) => CellPosition | null;
  select: (position: CellPosition) => void;
  extendTo: (position: CellPosition) => void;
  onEmptyAreaPress: () => void;
  /** After a press picked a cell; `extended` when Shift grew the range rather than replacing it. */
  onCellPress?: (position: CellPosition, extended: boolean) => void;
}

/** Spreadsheet drag selection for a grid container: press a cell to anchor, cross others to extend. */
export const useDragSelection = ({
  editing,
  hasSelection,
  cellAt,
  select,
  extendTo,
  onEmptyAreaPress,
  onCellPress,
}: DragSelectionOptions) => {
  const draggingRef = useRef(false);
  useEffect(() => {
    const endDrag = () => {
      draggingRef.current = false;
    };
    // Escape cancels the selection mid-drag; without this the next pointerover would rebuild it.
    const endDragOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') endDrag();
    };
    document.addEventListener('pointerup', endDrag);
    document.addEventListener('keydown', endDragOnEscape, true);
    return () => {
      document.removeEventListener('pointerup', endDrag);
      document.removeEventListener('keydown', endDragOnEscape, true);
    };
  }, []);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (editing || event.button !== 0) {
      return;
    }
    draggingRef.current = false;
    if (isBlankContainerPress(event)) {
      onEmptyAreaPress();
      return;
    }
    const cell = cellAt(event.target as Element);
    if (!cell) {
      return;
    }
    draggingRef.current = true;
    // Anchor on the pressed cell now: its own click fires on pointerup, and a drag ending on another
    // cell never delivers one, so every pointerover would extend from a stale anchor. Shift keeps it.
    // With nothing here to extend, Shift is a plain press: `select` is what clears the other grid.
    const extended = event.shiftKey && hasSelection;
    if (extended) {
      extendTo(cell);
    } else {
      select(cell);
    }
    onCellPress?.(cell, extended);
  };

  // `pointerover` rather than pointer capture + elementFromPoint: the windowed cells report what was crossed.
  const onPointerOver = (event: React.PointerEvent) => {
    if (!draggingRef.current || (event.buttons & 1) === 0) {
      return;
    }
    const cell = cellAt(event.target as Element);
    if (cell) {
      extendTo(cell);
    }
  };

  return { onPointerDown, onPointerOver };
};
