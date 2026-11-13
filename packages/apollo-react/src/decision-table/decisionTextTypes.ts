import type { ColumnEdit, ColumnPopoverLabels } from './ColumnPopover';
import type { GridMenuEntry } from './GridMenu';
import type { CellCommitMove } from './gridTypes';
import type { RuleCardEditLabels } from './RuleCard';
import type { SentenceCellId, SentenceValueId } from './sentenceTypes';
import type { ValuePopoverLabels, ValuePopoverProps } from './ValuePopover';
import type { ValueCommit } from './valueTypes';

/** The editing strings; the consumer passes localized values. */
export interface DecisionTextEditLabels
  extends RuleCardEditLabels,
    ValuePopoverLabels,
    ColumnPopoverLabels {
  /** The editor of a condition the rule does not have yet, e.g. "New income condition, rule 3". */
  newCondition: (column: string, position: number) => string;
  /** The value of a condition the rule does not have yet, while its editor is open, e.g. "Set a value". */
  setValue: string;
}

/** Editing on the cards, the grid's cell-editing contract addressed by value; omit it for a read-only view. */
export interface DecisionTextEdit {
  /** The value whose editor is open, or null: the grid's `editing`, addressed by ids as `selected` is. */
  editing: SentenceValueId | null;
  onStartEdit: (value: SentenceValueId) => void;
  /** Keep `editing` set to refuse the commit; the editor stays open with the draft. Its operator is the picked one of the cell's `valueField` operators, and a range's or list's commit carries all the condition's values. */
  onCommit: (value: SentenceValueId, commit: ValueCommit, move: CellCommitMove) => void;
  onCancel: () => void;
  /** What the open cell's popover offers: its type glyph, operators, allowed values, and a range's or list's values; called only while it is open. */
  valueField?: (cell: SentenceCellId) => ValuePopoverProps['field'];
  /** The host's expression editor, which the popover's Edit expression swaps in for the value; without it the popover offers none. */
  renderEditor?: ValuePopoverProps['renderEditor'];
  /** Editing of a band's input or output from its pill; without it the pills stay plain. */
  column?: ColumnEdit;
  /** A condition's remove action, or Delete on a selected value: the grid's clear, for one cell. */
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
