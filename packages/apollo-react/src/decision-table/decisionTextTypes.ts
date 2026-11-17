import type { BandLabels } from './bandColumns';
import type { ColumnEdit, ColumnPopoverLabels } from './ColumnPopover';
import type { DiffLabels } from './decisionTextDiff';
import type { CellCommitMove } from './gridTypes';
import type { RuleCardEditLabels } from './RuleCard';
import type { RuleCardLabels } from './ruleCardModel';
import type { RuleMenuActions, RuleMenuLabels } from './ruleMenuEntries';
import type { SentenceCellId, SentenceValueId } from './sentenceTypes';
import type { ValuePopoverLabels, ValuePopoverProps } from './ValuePopover';
import type { ValueCommit } from './valueTypes';

/** The view's own strings, built in from the `decision-table` catalog. */
export interface DecisionTextLabels extends RuleCardLabels, BandLabels, DiffLabels {
  emptyRules: string;
  addRule: string;
}

/** The editing strings, built in from the `decision-table` catalog. */
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

/** Editing on the cards, the grid's cell-editing contract addressed by value, in the host's column types; omit it for a read-only view. */
export interface DecisionTextEdit<Type> extends RuleMenuActions {
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
  column?: ColumnEdit<Type>;
  /** A condition's remove action, or Delete or Backspace on a selected value: the grid's clear, for one cell. */
  onClearCell: (cell: SentenceCellId) => void;
}

/** The host's edit of its cards and rules, without its column edit. */
export type CellEdit = Omit<DecisionTextEdit<unknown>, 'column'>;

/** The host's edit as the view runs it, with which value is open and every string settled. */
export type ViewEdit = Omit<CellEdit, 'labels'> &
  Required<Pick<CellEdit, 'editing' | 'onStartEdit' | 'onCancel'>> & {
    labels: DecisionTextEditLabels;
  };
