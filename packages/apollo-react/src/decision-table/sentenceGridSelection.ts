import { hasStop } from './sentenceParts';
import { selectionOf } from './sentenceSelection';
import type { SentenceRule, SentenceSelection } from './sentenceTypes';
import type { GridNavigation } from './useGridNavigation';

/** The grid's column ids by column index; undefined for a column no cell id names, such as the row numbers. */
export type GridColumnIds = readonly (string | undefined)[];

/** The grid's selection as the view selects: a rule, or one of its cells while the rule's sentence has a stop on it. */
export const sentenceSelectionOf = (
  navigation: Pick<GridNavigation, 'axisSelection' | 'focus' | 'singleSelection'>,
  rules: readonly SentenceRule[],
  gridColumnIds: GridColumnIds
): SentenceSelection | null => {
  const position =
    navigation.axisSelection === 'row' ? navigation.focus : navigation.singleSelection;
  const rule = position && rules[position.row];
  if (!position || !rule) return null;
  const columnId = navigation.axisSelection === 'row' ? undefined : gridColumnIds[position.col];
  return selectionOf(
    rule.rowId,
    columnId !== undefined && hasStop(rule, columnId) ? columnId : undefined
  );
};

/** Selects in the grid what the view selected: the cell, the whole rule, or nothing for null or a rule that is gone. */
export const selectSentenceInGrid = (
  navigation: Pick<GridNavigation, 'clear' | 'select' | 'selectRow'>,
  selection: SentenceSelection | null,
  rules: readonly SentenceRule[],
  gridColumnIds: GridColumnIds
): void => {
  const row = selection ? rules.findIndex((rule) => rule.rowId === selection.rowId) : -1;
  if (!selection || row < 0) {
    navigation.clear();
    return;
  }
  const col = selection.kind === 'rule' ? -1 : gridColumnIds.indexOf(selection.columnId);
  if (col < 0) navigation.selectRow(row);
  else navigation.select({ row, col });
};
