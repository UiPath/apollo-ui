import type { GridCellEditorContext } from './gridTypes';
import type { SentenceValueId } from './sentenceTypes';

/** What a host's value editor receives: the grid's editor contract, and the value it edits. */
export interface SentenceEditorContext extends GridCellEditorContext {
  target: SentenceValueId;
}
