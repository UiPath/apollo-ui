import type { BandLabels } from './bandColumns';
import type { ColumnEdit, ColumnPopoverLabels } from './ColumnPopover';
import type { DiffLabels } from './decisionTextDiff';
import type { CellCommitMove } from './gridTypes';
import type { RefusalContext } from './hostValues';
import type { RuleCardEditLabels } from './RuleCard';
import type { RuleCardLabels } from './ruleCardModel';
import type { RuleMenuActions, RuleMenuLabels } from './ruleMenuEntries';
import type { SentenceCellId, SentenceValueId } from './sentenceTypes';
import type { ValuePopoverLabels, ValuePopoverProps } from './ValuePopover';
import type { ValueCommit, ValueFieldData } from './valueTypes';

/** The view's own strings, from the `decision-table` catalog. */
export interface DecisionTextLabels extends RuleCardLabels, BandLabels, DiffLabels {
  emptyRules: string;
  addRule: string;
}

/** The editing strings, from the `decision-table` catalog. */
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

/** Editing on the cards, the grid's cell-editing contract addressed by value, in the host's operators, column types and refusals. */
export interface DecisionTextEdit<Op, Type, Refusal> extends RuleMenuActions {
  /** Return a refusal to keep the editor open with the draft and show it worded, until it commits again or closes. */
  onCommit: (
    value: SentenceValueId,
    commit: ValueCommit<Op>,
    move: CellCommitMove
  ) => Refusal | void;
  /** A condition's remove action, or Delete or Backspace on a selected value: the grid's clear, for one cell; a refusal is announced. */
  onClearCell: (cell: SentenceCellId) => Refusal | void;
  /** A refusal's words, given the refused cell's column name and the values it refused. */
  wordRefusal: (refusal: Refusal, context: RefusalContext) => string;
  /** Also called when a hidden or detached view stops rendering an open editor; a view hidden with visibility or opacity keeps its modal editor open. */
  onCancel: () => void;
  /** What the open cell's popover edits; called only while it is open. */
  valueField: (cell: SentenceCellId) => ValueFieldData<Op>;
  /** The host's expression editor, which the popover's Edit expression swaps in for its fields; without it the popover's own text field. */
  renderEditor?: ValuePopoverProps['renderEditor'];
  /** Editing of a band's input or output from its pill; without it the pills stay plain. */
  column?: ColumnEdit<Type>;
  /** Which value's editor is open, kept by the host; without it the view keeps it. */
  editing?: DecisionTextEditing;
}

/** The value whose editor is open, or null, addressed by ids as `selected` is, and where the view asks to open another; the host closes it from `onCommit` and `onCancel`. */
export interface DecisionTextEditing {
  value: SentenceValueId | null;
  onStart: (value: SentenceValueId) => void;
}

/** The host's edit with each operator and column type by its place among the host's, and each refusal worded. */
export type WordedEdit = Omit<DecisionTextEdit<number, number, string>, 'wordRefusal'>;

/** The host's edit as the view runs it, with which value is open and every string settled. */
export type ViewEdit = Omit<WordedEdit, 'onCommit' | 'onClearCell' | 'editing'> & {
  editing: DecisionTextEditing['value'];
  onStartEdit: DecisionTextEditing['onStart'];
  onCommit: (value: SentenceValueId, commit: ValueCommit<number>, move: CellCommitMove) => void;
  onClearCell: (cell: SentenceCellId) => void;
  inputIds: readonly string[];
  labels: DecisionTextEditLabels;
};
