import type { ColumnEdit, ColumnPopoverLabels } from './ColumnPopover';
import type { CellCommitMove } from './gridTypes';
import type { RuleCardEditLabels } from './RuleCard';
import type { RuleMenuActions, RuleMenuLabels } from './ruleMenuEntries';
import type { SentenceCellId, SentenceValueId } from './sentenceTypes';
import type { ValuePopoverLabels, ValuePopoverProps } from './ValuePopover';
import type { ValueCommit } from './valueTypes';

/** The editing strings; the consumer passes localized values. */
export interface DecisionTextEditLabels
  extends RuleCardEditLabels,
    ValuePopoverLabels,
    ColumnPopoverLabels,
    RuleMenuLabels {
  /** The editor of a condition the rule does not have yet, e.g. "New income condition, rule 3". */
  newCondition: (column: string, position: number) => string;
  /** The value of a condition the rule does not have yet, while its editor is open, e.g. "Set a value". */
  setValue: string;
}

/** Editing on the cards, the grid's cell-editing contract addressed by value; omit it for a read-only view. */
export interface DecisionTextEdit extends RuleMenuActions {
  /** The value whose editor is open, or null, addressed by ids as `selected` is; without it the view keeps which one is open. */
  editing?: SentenceValueId | null;
  onStartEdit?: (value: SentenceValueId) => void;
  /** Return a message to refuse the commit: the editor stays open with the draft and shows it until it commits again or closes. A `values` commit's operator is the picked one of the cell's `valueField` operators, and a range's or list's carries all the condition's values; an `expression` commit is the expression editor's text for the whole condition. */
  onCommit: (value: SentenceValueId, commit: ValueCommit, move: CellCommitMove) => string | void;
  /** Also called when a hidden or detached view stops rendering an open editor; a view hidden with visibility or opacity keeps its modal editor open. */
  onCancel?: () => void;
  /** What the open cell's popover offers: its type glyph, operators, allowed values, and a range's or list's values; called only while it is open. */
  valueField?: (cell: SentenceCellId) => ValuePopoverProps['field'];
  /** The host's expression editor, which the popover's Edit expression swaps in for its fields on the whole condition, where `valueField` gives the condition's `expression` or the value is the whole condition; without it the popover's own text field. */
  renderEditor?: ValuePopoverProps['renderEditor'];
  /** Editing of a band's input or output from its pill; without it the pills stay plain. */
  column?: ColumnEdit;
  /** A condition's remove action, or Delete or Backspace on a selected value: the grid's clear, for one cell. */
  onClearCell: (cell: SentenceCellId) => void;
  /** The editing strings; mounted rules re-render when it changes, so memoize it. */
  labels: DecisionTextEditLabels;
}

/** The host's edit as the view runs it, with which value is open settled. */
export type ViewEdit = DecisionTextEdit &
  Required<Pick<DecisionTextEdit, 'editing' | 'onStartEdit' | 'onCancel'>>;
