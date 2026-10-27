import type { CellSelectionState, Updater } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import type { CellCommitMove } from './gridTypes';

export interface GridPosition {
  row: number;
  /** 0 = annotation column, then inputs, then outputs. */
  col: number;
}

/** A rectangular selection: where it started and where it currently reaches. */
export interface GridRange {
  anchor: GridPosition;
  focus: GridPosition;
}

/**
 * The selection of a grid whose navigation a component does not own, handed over so the decision
 * table designer can read, restore and drop the tests grid's selection alongside its own.
 */
export interface GridSelectionHandle {
  read: () => GridRange | null;
  restore: (range: GridRange | null) => void;
  clear: () => void;
  /** Whether the grid has a cell editor open. */
  editing: () => boolean;
}

/** The axis a header/gutter gesture picked, or null when a cell was picked. */
type AxisSelection = 'row' | 'column' | null;

/** What a replacing gesture picked, so a listener can tell which of its own selections it supersedes. */
type SelectionGesture = 'cell' | 'row' | 'column';

/** The range as an inclusive rectangle, whatever direction it was dragged in. */
export const normalizedRect = (
  range: GridRange
): { top: number; bottom: number; left: number; right: number } => ({
  top: Math.min(range.anchor.row, range.focus.row),
  bottom: Math.max(range.anchor.row, range.focus.row),
  left: Math.min(range.anchor.col, range.focus.col),
  right: Math.max(range.anchor.col, range.focus.col),
});

export interface GridNavigation {
  /** The rectangle's focus corner — where the keyboard moves from. */
  focus: GridPosition | null;
  /** Cell coordinates if there is a single selection, or null otherwise. */
  singleSelection: GridPosition | null;
  /** The focus cell's ids. */
  selectedIds: { rowId: string; columnId: string } | null;
  /** The full rectangular selection, or null when nothing is selected. */
  range: GridRange | null;
  /** Which axis gesture made the current selection, or null for an ordinary cell selection. */
  axisSelection: AxisSelection;
  /** The cell that wears the focus ring: the focus, unless a header or gutter picked the whole axis. */
  focusRing: GridPosition | null;
  editing: boolean;
  /** Whether typing opened the current edit, so the keystroke the browser delivers replaces the cell's text. */
  openedByTyping: boolean;
  select: (position: GridPosition) => void;
  /** Drops the selection entirely. */
  clear: () => void;
  /**
   * Restores a historical selection — the whole range, so undoing a range operation hands the
   * range back rather than a collapsed cell.
   */
  restore: (range: GridRange | null) => void;
  /** Moves the focus while the anchor holds — Shift+click and drag-selection. */
  extendTo: (position: GridPosition) => void;
  selectAll: () => void;
  /** The whole rule: anchor at the annotation, focus on the last output. */
  selectRow: (row: number) => void;
  /** The whole clause, every rule. */
  selectColumn: (col: number) => void;
  /** Selects the position and opens its inline editor in one step (the double-click path). */
  startEditAt: (position: GridPosition) => void;
  commitEdit: (move: CellCommitMove) => void;
  cancelEdit: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

const clamp = (value: number, max: number): number => Math.max(0, Math.min(value, max));

/** Keys that establish a selection when the grid has focus but no cell is selected yet. */
const GRID_ENTRY_KEYS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];

/** Where the selection lands after committing an inline edit. */
const MOVE_DELTA: Record<CellCommitMove, GridPosition> = {
  down: { row: 1, col: 0 },
  right: { row: 0, col: 1 },
  left: { row: 0, col: -1 },
  none: { row: 0, col: 0 },
};

/** Through User-Agent Client Hints where the browser has them; `navigator.platform` is the fallback Safari and Firefox still need. */
const isApplePlatform = (): boolean => {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const platform =
    (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData?.platform ??
    navigator.platform;
  return /mac|iphone|ipad|ipod|ios/i.test(platform);
};

/**
 * A key that starts typing: a character, or a dead key whose accent the editor then composes. No
 * Ctrl or Cmd chord. Off Apple platforms Ctrl+Alt is AltGr, which types one, and Alt alone is a
 * shortcut; on macOS it is the reverse — Option types one, and Ctrl+Option is a shortcut chord.
 * Keys pressed mid-composition belong to the IME.
 */
const isTypedCharacter = (event: React.KeyboardEvent): boolean => {
  if (
    (event.key.length !== 1 && event.key !== 'Dead') ||
    event.metaKey ||
    event.nativeEvent.isComposing
  ) {
    return false;
  }
  if (event.ctrlKey) {
    return event.altKey && !isApplePlatform();
  }
  return !event.altKey || isApplePlatform();
};

const ARROW_DELTAS: Record<string, GridPosition | undefined> = {
  ArrowUp: { row: -1, col: 0 },
  ArrowDown: { row: 1, col: 0 },
  ArrowLeft: { row: 0, col: -1 },
  ArrowRight: { row: 0, col: 1 },
};

/**
 * Spreadsheet-style selection + edit state for the decision table grid, backed by TanStack
 * `cellSelectionFeature`.
 *
 * table-core owns the rectangle as `{anchorRowId, anchorColumnId, focusRowId, focusColumnId}`;
 * this hook is the seam that keeps the grid's own `{row, col}` vocabulary. Every consumer
 * (clipboard, history, formula bar, addressing) still speaks integer positions, because those
 * indices are what the DMN model arrays are addressed by and what serializes to the file.
 *
 * Ids change the deletion semantics for the better: a rule id is unique and never reused, so a
 * position cannot be resurrected by the grid regrowing. Where the index-based predecessor clamped
 * a vanished row onto its neighbour, a vanished id now clears the selection — the user is not
 * silently re-pointed at a rule they never picked.
 *
 * `editing` stays React state: table-core has no concept of an inline editor, and the
 * commit-and-move semantics below are ours.
 */
interface GridNavigationOptions {
  /**
   * A gesture started a NEW selection — never fired when one is extended. `gesture` names what
   * was picked, so a listener can keep the selection it is about to set rather than depending on
   * the order the two are called in.
   */
  onSelectionReplaced?: (gesture: SelectionGesture) => void;
  /**
   * Whether a position can enter edit mode. Enter/F2 and typing are inert where it returns false —
   * without this the hook would flag itself editing for a cell whose editor never renders, and the
   * grid would ignore arrows and the clipboard until the next click. `"type"` asks for more: the
   * editor has to mount before the keydown returns, or the keystroke lands nowhere.
   */
  canEditAt?: (position: GridPosition, gesture: EditGesture) => boolean;
  /** Fires after Escape has cleared the selection. */
  onEscape?: () => void;
}

/** How an edit is being opened: a command (Enter, F2), or a typed key the editor has to receive. */
export type EditGesture = 'command' | 'type';

/**
 * What this hook needs of a table-core instance. Structural, not a concrete `Table<...>`: the two
 * grids register different feature sets, so their table types are mutually unassignable.
 */
export interface GridSelectionSource {
  table: {
    state: { cellSelection?: CellSelectionState };
    setCellSelection: (updater: Updater<CellSelectionState>) => void;
  };
  rowIds: readonly string[];
  colIds: readonly string[];
}

export const useGridNavigation = (
  { table, rowIds, colIds }: GridSelectionSource,
  options: GridNavigationOptions = {}
): GridNavigation => {
  const [editing, setEditing] = useState(false);
  const [openedByTyping, setOpenedByTyping] = useState(false);
  // Through a ref so every mutator below keeps a stable identity — they reach each memoised row.
  const onSelectionReplacedRef = useRef(options.onSelectionReplaced);
  onSelectionReplacedRef.current = options.onSelectionReplaced;
  const announceReplaced = useCallback(
    (gesture: SelectionGesture) => onSelectionReplacedRef.current?.(gesture),
    []
  );
  const canEditAtRef = useRef(options.canEditAt);
  canEditAtRef.current = options.canEditAt;
  const onEscapeRef = useRef(options.onEscape);
  onEscapeRef.current = options.onEscape;
  // Read through a ref inside the setters: `useTable` does not promise a stable instance, and a
  // setter whose identity tracked it would re-render every memoised row on every render.
  const tableRef = useRef(table);
  tableRef.current = table;
  /** `undefined` = nothing pending; `null` = a pending clear. See `restore`. */
  const pendingRestoreRef = useRef<GridRange | null | undefined>(undefined);
  /** The axis a header/gutter gesture picked; every mutator that moves the rectangle drops it. */
  const axisRectRef = useRef<AxisSelection>(null);

  const rowCount = rowIds.length;
  const colCount = colIds.length;
  const hasCells = rowCount > 0 && colCount > 0;

  const rowIndexById = useMemo(() => new Map(rowIds.map((id, index) => [id, index])), [rowIds]);
  const colIndexById = useMemo(() => new Map(colIds.map((id, index) => [id, index])), [colIds]);

  const toIds = useCallback(
    (position: GridPosition): { rowId: string; columnId: string } | null => {
      if (!hasCells) {
        return null;
      }
      return {
        rowId: rowIds[clamp(position.row, rowCount - 1)]!,
        columnId: colIds[clamp(position.col, colCount - 1)]!,
      };
    },
    [hasCells, rowIds, colIds, rowCount, colCount]
  );

  const setRange = useCallback(
    (anchor: GridPosition, focus: GridPosition) => {
      const anchorIds = toIds(anchor);
      const focusIds = toIds(focus);
      if (!anchorIds || !focusIds) {
        return;
      }
      tableRef.current.setCellSelection([
        {
          anchorRowId: anchorIds.rowId,
          anchorColumnId: anchorIds.columnId,
          focusRowId: focusIds.rowId,
          focusColumnId: focusIds.columnId,
        },
      ]);
    },
    [toIds]
  );

  const active = table.state.cellSelection?.[0];
  // Resolved to plain coordinates first, then memoised on those four numbers. `range` and
  // `focus` are read by every row's memo through the callbacks below, so a fresh object per
  // render would change each callback's identity and repaint the whole mounted window on any
  // render at all — which is what the selection-cost contract measures.
  const anchorRow = active ? rowIndexById.get(active.anchorRowId) : undefined;
  const anchorCol = active ? colIndexById.get(active.anchorColumnId) : undefined;
  const focusRow = active ? rowIndexById.get(active.focusRowId) : undefined;
  const focusCol = active ? colIndexById.get(active.focusColumnId) : undefined;
  // Both ends must still resolve: half a rectangle is not a selection, and a stale anchor would
  // make Shift+Arrow extend from a rule that is no longer in the table.
  const range = useMemo<GridRange | null>(
    () =>
      anchorRow === undefined ||
      anchorCol === undefined ||
      focusRow === undefined ||
      focusCol === undefined
        ? null
        : { anchor: { row: anchorRow, col: anchorCol }, focus: { row: focusRow, col: focusCol } },
    [anchorRow, anchorCol, focusRow, focusCol]
  );
  const focus = useMemo<GridPosition | null>(() => range?.focus ?? null, [range]);
  const axisSelection: AxisSelection = range ? axisRectRef.current : null;
  // One cell, or null. A row or column gesture never counts as one, whatever its shape.
  const singleSelection = useMemo<GridPosition | null>(
    () =>
      range &&
      !axisSelection &&
      range.anchor.row === range.focus.row &&
      range.anchor.col === range.focus.col
        ? range.focus
        : null,
    [range, axisSelection]
  );
  // Memoised on the two strings, so consumers keying effects on it are not re-fired per render.
  const focusRowId = range ? active?.focusRowId : undefined;
  const focusColumnId = range ? active?.focusColumnId : undefined;
  const selectedIds = useMemo(
    () =>
      focusRowId === undefined || focusColumnId === undefined
        ? null
        : { rowId: focusRowId, columnId: focusColumnId },
    [focusRowId, focusColumnId]
  );

  // Drop a selection whose rules or columns were deleted. Read-time resolution already reports
  // null, but leaving the dead ids in table-core would let a later `extendTo` rebuild a rectangle
  // from an anchor the user can no longer see.
  useEffect(() => {
    if (table.state.cellSelection?.length && !range) {
      table.setCellSelection([]);
      setEditing(false);
    }
  }, [table, range]);

  const select = useCallback(
    (position: GridPosition) => {
      announceReplaced('cell');
      axisRectRef.current = null;
      setRange(position, position);
      setEditing(false);
    },
    [setRange, announceReplaced]
  );

  /** Drops the selection without starting another — not a replacement, so it announces nothing. */
  const clear = useCallback(() => {
    axisRectRef.current = null;
    tableRef.current.setCellSelection([]);
    setEditing(false);
  }, []);

  /**
   * Applied on the next commit rather than immediately. Undo runs before React re-renders, so the
   * id arrays still describe the pre-undo table at call time — translating a restored position
   * against them would resolve a rule that is about to move, or none at all. The index-based
   * predecessor stored the raw position and leaned on read-time clamping for the same reason;
   * with ids there is nothing to store until the ids exist, so the write waits instead.
   */
  const restore = useCallback((next: GridRange | null) => {
    axisRectRef.current = null;
    pendingRestoreRef.current = next;
    setEditing(false);
  }, []);

  // Intentionally dep-free: it must run on whichever commit brings the restored model in, and it
  // costs one ref read when nothing is pending.
  useEffect(() => {
    const pending = pendingRestoreRef.current;
    if (pending === undefined) {
      return;
    }
    pendingRestoreRef.current = undefined;
    if (!pending) {
      tableRef.current.setCellSelection([]);
    } else {
      setRange(pending.anchor, pending.focus);
    }
  });

  // Reads the live anchor through the updater rather than closing over `range`. Depending on
  // `range` would give this callback a new identity on every selection move, and it reaches every
  // memoised row as `onSelectCell` — repainting the whole mounted window instead of two rows.
  const extendTo = useCallback(
    (position: GridPosition) => {
      // Extending moves the rectangle off the one the header made, so it stops being that gesture.
      axisRectRef.current = null;
      const focusIds = toIds(position);
      if (!focusIds) {
        return;
      }
      tableRef.current.setCellSelection((previous) => {
        const active = previous?.[0];
        return [
          {
            anchorRowId: active?.anchorRowId ?? focusIds.rowId,
            anchorColumnId: active?.anchorColumnId ?? focusIds.columnId,
            focusRowId: focusIds.rowId,
            focusColumnId: focusIds.columnId,
          },
        ];
      });
      setEditing(false);
    },
    [toIds]
  );

  const selectAll = useCallback(() => {
    announceReplaced('cell');
    axisRectRef.current = null;
    setRange({ row: 0, col: 0 }, { row: rowCount - 1, col: colCount - 1 });
    setEditing(false);
  }, [setRange, rowCount, colCount, announceReplaced]);

  const selectRow = useCallback(
    (row: number) => {
      announceReplaced('row');
      setRange({ row, col: colCount - 1 }, { row, col: 0 });
      axisRectRef.current = 'row';
      setEditing(false);
    },
    [setRange, colCount, announceReplaced]
  );

  const selectColumn = useCallback(
    (col: number) => {
      announceReplaced('column');
      setRange({ row: rowCount - 1, col }, { row: 0, col });
      axisRectRef.current = 'column';
      setEditing(false);
    },
    [setRange, rowCount, announceReplaced]
  );

  const openEditAt = useCallback(
    (position: GridPosition, byTyping: boolean) => {
      announceReplaced('cell');
      axisRectRef.current = null;
      setRange(position, position);
      setOpenedByTyping(byTyping);
      setEditing(true);
    },
    [setRange, announceReplaced]
  );

  const startEditAt = useCallback(
    (position: GridPosition) => openEditAt(position, false),
    [openEditAt]
  );

  // Same reason as `extendTo`: the current focus comes from the updater, not from a closed-over
  // `focus`, so committing an edit does not hand every row a new `onCommitCell`.
  const commitEdit = useCallback(
    (move: CellCommitMove) => {
      axisRectRef.current = null;
      tableRef.current.setCellSelection((previous) => {
        const active = previous?.[0];
        if (!active) {
          return previous ?? [];
        }
        const row = rowIndexById.get(active.focusRowId);
        const col = colIndexById.get(active.focusColumnId);
        if (row === undefined || col === undefined) {
          return previous;
        }
        const next = toIds({ row: row + MOVE_DELTA[move].row, col: col + MOVE_DELTA[move].col });
        if (!next) {
          return previous;
        }
        return [
          {
            anchorRowId: next.rowId,
            anchorColumnId: next.columnId,
            focusRowId: next.rowId,
            focusColumnId: next.columnId,
          },
        ];
      });
      setEditing(false);
    },
    [toIds, rowIndexById, colIndexById]
  );

  const cancelEdit = useCallback(() => setEditing(false), []);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (editing) {
        return;
      }
      // Ahead of the no-focus guard: the host may still hold a selection this grid does not.
      if (event.key === 'Escape') {
        // Claimed only when there was something here to clear, so a host's own Escape still gets it.
        if (range) {
          event.preventDefault();
        }
        clear();
        onEscapeRef.current?.();
        return;
      }

      const meta = event.metaKey || event.ctrlKey;
      // Nothing is selected until a pointer picks a cell, and the cells are not focusable — so a
      // user who tabbed into the grid found Arrow/Enter/F2 all inert and had no keyboard way in.
      // The first such key establishes a position instead of being swallowed.
      if (!focus) {
        if (
          hasCells &&
          (GRID_ENTRY_KEYS.includes(event.key) || event.key === 'Enter' || event.key === 'F2')
        ) {
          event.preventDefault();
          select({ row: 0, col: 0 });
        }
        return;
      }

      if (meta && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        selectAll();
        return;
      }

      const delta = ARROW_DELTAS[event.key];
      if (delta) {
        event.preventDefault();
        // Ctrl/Cmd jumps to the region edge; Shift extends the range instead of moving it.
        const from = event.shiftKey && range ? range.focus : focus;
        const next = {
          row: meta
            ? delta.row === 0
              ? from.row
              : delta.row < 0
                ? 0
                : rowCount - 1
            : from.row + delta.row,
          col: meta
            ? delta.col === 0
              ? from.col
              : delta.col < 0
                ? 0
                : colCount - 1
            : from.col + delta.col,
        };
        if (event.shiftKey) {
          extendTo(next);
        } else {
          select(next);
        }
        return;
      }

      if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        const next = {
          row: meta ? (event.key === 'Home' ? 0 : rowCount - 1) : focus.row,
          col: event.key === 'Home' ? 0 : colCount - 1,
        };
        if (event.shiftKey) {
          extendTo(next);
        } else {
          select(next);
        }
        return;
      }

      if (event.key === 'Enter' || event.key === 'F2') {
        // Swallowed either way, so Enter never reaches the page; it just opens no editor where
        // the cell has none.
        event.preventDefault();
        if (canEditAtRef.current?.(focus, 'command') !== false) {
          setOpenedByTyping(false);
          setEditing(true);
        }
        return;
      }

      if (event.key === 'Tab' && !meta && !event.altKey) {
        const col = focus.col + (event.shiftKey ? -1 : 1);
        // Past the row's ends Tab leaves the grid, or the keyboard would be trapped in it (WCAG 2.1.2).
        if (col < 0 || col >= colCount) {
          return;
        }
        event.preventDefault();
        select({ row: focus.row, col });
        return;
      }
      if (isTypedCharacter(event) && canEditAtRef.current?.(focus, 'type') !== false) {
        flushSync(() => openEditAt(focus, true));
      }
    },
    [
      editing,
      focus,
      range,
      hasCells,
      rowCount,
      colCount,
      extendTo,
      select,
      selectAll,
      clear,
      openEditAt,
    ]
  );

  return {
    focus,
    singleSelection,
    selectedIds,
    range,
    axisSelection,
    focusRing: axisSelection ? null : focus,
    editing,
    openedByTyping: editing && openedByTyping,
    select,
    clear,
    restore,
    extendTo,
    selectAll,
    selectRow,
    selectColumn,
    startEditAt,
    commitEdit,
    cancelEdit,
    onKeyDown,
  };
};
