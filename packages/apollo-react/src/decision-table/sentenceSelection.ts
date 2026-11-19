import type { SentenceCellId, SentenceSelection } from './sentenceTypes';

/** The rule `rowId`. */
export const ruleSelection = (rowId: string): SentenceSelection => ({ kind: 'rule', rowId });

/** The cell `columnId` of rule `rowId`, or the rule itself for no column. */
export const selectionOf = (rowId: string, columnId: string | undefined): SentenceSelection =>
  columnId === undefined ? ruleSelection(rowId) : { kind: 'cell', rowId, columnId };

/** The cell `cell` addresses. */
export const cellSelection = ({ rowId, columnId }: SentenceCellId): SentenceSelection => ({
  kind: 'cell',
  rowId,
  columnId,
});

/** The selected cell's column, or undefined for a rule or no selection. */
export const selectedColumnOf = (
  selection: SentenceSelection | null | undefined
): string | undefined => (selection?.kind === 'cell' ? selection.columnId : undefined);

/** Whether two selections stop on the same rule and column. */
export const sameSelection = (
  left: SentenceSelection | null,
  right: SentenceSelection | null
): boolean => left?.rowId === right?.rowId && selectedColumnOf(left) === selectedColumnOf(right);
