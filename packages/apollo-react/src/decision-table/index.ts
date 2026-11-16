// The decision table's virtualized editing surface: banded sticky
// headers, column resize and group-bounded reorder, row drag, windowed rendering, rectangular
// clipboard. Deliberately domain-free — labels, menus and clipboard mappings are the consumer's
// (`GridLabels`). The drag and insert titles are the table's own, from its `decision-table`
// catalog (see `ApI18nProvider`).

export type { AddRuleButtonProps } from './AddRuleButton';
export type { ColumnChange, ColumnEdit, ColumnField, ColumnTypeOption } from './ColumnPopover';
export type { SizedColumn } from './columnSizing';
export { BODY_ROW_HEIGHT_PX, EMPTY_VALUE_DASH, ROW_NUMBER_WIDTH } from './constants';
export { DecisionTable, type DecisionTableProps, type HeaderCellContext } from './DecisionTable';
export { DecisionGraphText, type DecisionGraphTextProps } from './DecisionGraphText';
export type {
  DecisionGraphDecisionNode,
  DecisionGraphNode,
  DecisionGraphReferenceNode,
  DecisionGraphRule,
  DecisionGraphTarget,
} from './decisionGraphTypes';
export { DecisionText, type DecisionTextProps } from './DecisionText';
export type {
  DecisionTextDiff,
  DiffChange,
  DiffColumnChange,
  DiffRemovedColumn,
  DiffRemovedRule,
  DiffRuleChange,
  DiffValueChange,
} from './decisionTextDiff';
export { DragIndicator, type DragIndicatorProps } from './DragIndicator';
export type {
  DecisionTextEdit,
  DecisionTextEditLabels,
  DecisionTextLabels,
} from './decisionTextTypes';
export { EdgeInsertButton, type EdgeInsertButtonProps } from './EdgeInsertButton';
export { GridCell, type GridCellProps, renderRestingCellContent } from './GridCell';
export {
  GridContextMenu,
  type GridContextMenuProps,
  type GridContextMenuState,
  type GridMenuEntry,
  type GridMenuItem,
} from './GridMenu';
export {
  commitMoveFor,
  emptyAreaPressHandler,
  isFromTextField,
  isRedoKey,
  isUndoKey,
} from './gridEvents';
export {
  BAND_BOUNDARY_CLASS,
  BAND_LABEL_ROW_CLASS,
  BODY_CELL_CLASS,
  BREADCRUMB_POINT_STYLE,
  CELL_SURFACE_CLASS,
  DELETE_ROW_BUTTON_CLASS,
  DELETE_ROW_CLASS,
  FOOTER_ACTION_CLASS,
  FROZEN_RIGHT_CELL_CLASS,
  FROZEN_RIGHT_GROUP_CELL_CLASS,
  FROZEN_RIGHT_HEADER_CELL_CLASS,
  GROUP_TONE_CLASS,
  HEADER_CELL_CLASS,
  HEADER_LABEL_ROW_CLASS,
  IN_RANGE_CLASS,
  LIVE_NOTE_CLASS,
  LOCKABLE_ROW_ACTION_BUTTON_CLASS,
  MONO_CELL_TEXT_CLASS,
  OUTPUT_BAND_DOT_CLASS,
  OUTPUT_CELL_TINT_CLASS,
  OUTPUT_HUE_CLASS,
  ROW_GUTTER_MARK_CLASS,
  ROW_MARK_OVERLAY_CLASS,
  ROW_NUMBER_CELL_CLASS,
  SEPARATOR_BODY_CELL_CLASS,
} from './gridStyles';
export * from './gridTypes';
export { MarkGlyph } from './MarkGlyph';
export { EMPTY_MARKS, type Mark, type MarkTone, type RowMark, type TableMarks } from './marks';
export type { PolicyOption } from './PolicyOptionItem';
export type { PolicyGroup, PolicyPickerProps } from './PolicyPicker';
export type { GlyphTone } from './sentenceMarks';
export type {
  SentenceBandColumn,
  SentenceCellId,
  SentenceHeader,
  SentenceLine,
  SentenceNameToken,
  SentencePart,
  SentenceRule,
  SentenceSelection,
  SentenceToken,
  SentenceValueId,
  SentenceValueToken,
  SentenceValueType,
} from './sentenceTypes';
export type { DecisionTextContainerProps } from './useContainerHandlers';
export type { DecisionGraphLabels } from './useDecisionGraphStrings';
export type { DecisionTextScroll } from './useRuleWindow';
export { usePressDrag } from './useDragReorder';
export { useDragSelection } from './useDragSelection';
export {
  type AxisSelection,
  type CellSelectionRange,
  type CellSelectionState,
  type EditGesture,
  type GridNavigation,
  type GridNavigationOptions,
  type GridPosition,
  type GridRange,
  type GridSelectionHandle,
  type GridSelectionSource,
  normalizedRect,
  type SelectionGesture,
  type Updater,
  useGridNavigation,
} from './useGridNavigation';
export type { ValuePopoverProps } from './ValuePopover';
export type {
  ExpressionEditorHandle,
  ExpressionEditorProps,
  RangeEnds,
  ValueCommit,
  ValueField,
  ValueOperatorOption,
  ValueShape,
} from './valueTypes';
