import type { SentenceCellId } from './sentenceTypes';

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
