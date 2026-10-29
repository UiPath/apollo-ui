// The decision table's virtualized editing surface: banded sticky
// headers, column resize and group-bounded reorder, row drag, windowed rendering, rectangular
// clipboard. Deliberately domain-free — labels, menus and clipboard mappings are the consumer's
// (`GridLabels`; "the grid ships no English").

export type { SizedColumn } from './columnSizing';
export { BODY_ROW_HEIGHT_PX, EMPTY_VALUE_DASH, ROW_NUMBER_WIDTH } from './constants';
export { DecisionTable, type HeaderCellContext } from './DecisionTable';
export {
  GridCell,
  type GridCellEditorContext,
  type GridCellProps,
  renderRestingCellContent,
} from './GridCell';
export { GridContextMenu, type GridMenuEntry, type GridMenuItem } from './GridMenu';
export {
  commitMoveFor,
  emptyAreaPressHandler,
  isFromTextField,
  isRedoKey,
  isUndoKey,
} from './gridEvents';
export {
  BAND_ADD_COLUMN_CLASS,
  BAND_LABEL_ROW_CLASS,
  BODY_CELL_CLASS,
  CELL_SURFACE_CLASS,
  COLUMN_DRAG_HANDLE_CLASS,
  DELETE_ROW_BUTTON_CLASS,
  DELETE_ROW_CLASS,
  FOOTER_ACTION_CLASS,
  FROZEN_LEFT_EDGE_CLASS,
  GRID_LINE_H_CLASS,
  GROUP_GUTTER_CLASS,
  GROUP_TONE_CLASS,
  HEADER_CELL_CLASS,
  HEADER_LABEL_ROW_CLASS,
  IN_RANGE_CLASS,
  INSERT_ROW_CLASS,
  LIVE_NOTE_CLASS,
  LOCKABLE_ROW_ACTION_BUTTON_CLASS,
  OUTPUT_CELL_TINT_CLASS,
  OUTPUT_HUE_CLASS,
  ROW_DRAG_HANDLE_CLASS,
  ROW_GUTTER_MARK_CLASS,
  ROW_MARK_OVERLAY_CLASS,
  ROW_NUMBER_CELL_CLASS,
  SEPARATOR_BODY_TINTED_CELL_CLASS,
} from './gridStyles';
export * from './gridTypes';
export { MarkGlyph } from './MarkGlyph';
export { EMPTY_MARKS, type Mark, type MarkTone, type RowMark, type TableMarks } from './marks';
export { useDragSelection } from './useDragSelection';
export {
  type EditGesture,
  type GridNavigation,
  type GridPosition,
  type GridRange,
  type GridSelectionHandle,
  type GridSelectionSource,
  normalizedRect,
  useGridNavigation,
} from './useGridNavigation';
