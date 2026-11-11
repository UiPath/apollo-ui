import type { SentenceCellId, SentenceSelection } from './sentenceTypes';

/** A value chip under the pointer and the cell it stands for. */
export interface HoveredToken {
  chip: Element;
  cell: SentenceCellId;
}

/** The value token at `target`, as the cell it stands for. */
export const valueTokenAt = (target: EventTarget | null): HoveredToken | null => {
  const chip =
    target instanceof Element ? target.closest<HTMLElement>('[data-kind="value"]') : null;
  const rowId = chip?.closest<HTMLElement>('[data-row-id]')?.dataset.rowId;
  const columnId = chip?.dataset.columnId;
  return chip && rowId && columnId ? { chip, cell: { rowId, columnId } } : null;
};

/** What a click on `target` selects: the cell of a value token or of a `+N more` count, else the rule of its row. */
export const clickedSelection = (target: EventTarget | null): SentenceSelection | null => {
  const element = target instanceof Element ? target : null;
  const rowId = element?.closest<HTMLElement>('li[data-row-id]')?.dataset.rowId;
  const columnId =
    valueTokenAt(target)?.cell.columnId ??
    element?.closest<HTMLElement>('[data-more-values]')?.dataset.columnId;
  if (rowId === undefined) return null;
  return columnId === undefined ? { rowId } : { rowId, columnId };
};
