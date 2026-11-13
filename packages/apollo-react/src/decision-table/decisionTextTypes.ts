import type { GridMenuEntry } from './GridMenu';
import type { CellCommitMove } from './gridTypes';
import type { RuleCardEditLabels } from './RuleCard';
import type { SentenceCellId, SentenceValueId } from './sentenceTypes';
import type { ValueEditorOverlayProps } from './ValueEditorOverlay';

/** The editing strings; the consumer passes localized values. */
export interface DecisionTextEditLabels extends RuleCardEditLabels {
  /** The editor of a condition the rule does not have yet, e.g. "New income condition, rule 3". */
  newCondition: (column: string, position: number) => string;
}

/** Editing on the cards, the grid's cell-editing contract addressed by value; omit it for a read-only view. */
export interface DecisionTextEdit {
  /** The value whose editor is open, or null, addressed by ids as `selected` is. */
  editing: SentenceValueId | null;
  onStartEdit: (value: SentenceValueId) => void;
  /** Keep `editing` set to refuse the text; the editor stays open with the draft. */
  onCommit: (value: SentenceValueId, text: string, move: CellCommitMove) => void;
  onCancel: () => void;
  /** Swaps the plain input for the host's editor, as `GridCellProps.renderEditor`. */
  renderEditor?: ValueEditorOverlayProps['renderEditor'];
  /** A condition's remove action, or Delete or Backspace on a selected value: the grid's clear, for one cell. */
  onClearCell: (cell: SentenceCellId) => void;
  /** The add-condition menu of a rule; called only to open it and while it is open, which an empty list skips. */
  conditionEntries: (rowId: string) => GridMenuEntry[];
  /** The rule's own menu, as the grid's row menu; called only to open it and while it is open, which an empty list skips. */
  ruleEntries: (rowId: string) => GridMenuEntry[];
  /** The rule card's delete action, as the grid row's delete button; the host selects what follows. */
  onDeleteRule: (rowId: string) => void;
  /** The editing strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextEditLabels;
}
