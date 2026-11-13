import type { GridCellEditorContext } from './gridTypes';
import type { PopoverSelectOption } from './PopoverSelect';
import type { SentenceBandColumn, SentenceValueId } from './sentenceTypes';

/** What a host's expression editor receives: the grid's editor contract on the condition's expression, and the value it opened from. */
export interface SentenceEditorContext extends GridCellEditorContext {
  target: SentenceValueId;
}

/** How many values an operator takes: one, a range's two ends, or a list. */
export type ValueShape = 'single' | 'range' | 'list';

/** An operator a condition can switch to, and how many values it takes; one when unset. */
export interface ValueOperatorOption extends PopoverSelectOption {
  shape?: ValueShape;
}

/** Whether a range includes each end. */
export interface RangeEnds {
  lowInclusive: boolean;
  highInclusive: boolean;
}

/** What a cell's popover offers, from the host's column. */
export interface ValueField extends Pick<SentenceBandColumn, 'icon'> {
  /** A condition's operators; without them the popover shows none. */
  operators?: readonly ValueOperatorOption[];
  /** The id of the operator the condition has, or a new condition starts with; without it, the first of `operators`. */
  operator?: string;
  /** The column's allowed values, each one literal, offered as radios or a list's checkboxes in place of the text field. */
  allowedValues?: readonly string[];
  /** The condition's values by sentence index, when its operator takes more than one. */
  values?: readonly string[];
  /** A range's ends, when its operator is a range. */
  ends?: RangeEnds;
  /** Whether a range's low end is at most its high end; without it any two ends are. */
  inOrder?: (low: string, high: string) => boolean;
  /** The whole condition as the host's expression editor edits it; without it Edit expression is offered only where the value is the whole condition. */
  expression?: string;
}

/** What a commit carries: the values in sentence order, the picked operator and a range's ends, or the expression editor's text, which is the whole condition. */
export type ValueCommit =
  | { kind: 'values'; values: readonly string[]; operator: string | undefined; ends?: RangeEnds }
  | { kind: 'expression'; text: string };
