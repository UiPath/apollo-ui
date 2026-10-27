// The virtualized editing grid underneath UiPath's decision-table experiences: banded sticky
// headers, column resize and group-bounded reorder, row drag, windowed rendering, rectangular
// clipboard. Deliberately domain-free — labels, menus and clipboard mappings are the consumer's
// (`GridLabels`; "the grid ships no English").
export { Grid, type HeaderCellContext } from './Grid';
export {
  GridCell,
  type GridCellEditorContext,
  type GridCellProps,
  renderRestingCellContent,
} from './GridCell';
export { GridContextMenu, type GridMenuEntry, type GridMenuItem } from './GridMenu';
export * from './gridTypes';
export { EMPTY_MARKS, type Mark, type MarkTone, type RowMark, type TableMarks } from './marks';
export { MarkGlyph } from './MarkGlyph';
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
export {
  commitMoveFor,
  emptyAreaPressHandler,
  isFromTextField,
  isRedoKey,
  isUndoKey,
} from './gridEvents';
export { useGridClipboard } from './useGridClipboard';
