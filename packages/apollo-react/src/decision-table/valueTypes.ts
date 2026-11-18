import type { GridCellEditorContext } from './gridTypes';
import type { SentenceValueId } from './sentenceTypes';

/** What the popover asks of a mounted expression editor. */
export interface ExpressionEditorHandle {
  focus: () => void;
  /** Whether Enter, Escape and Tab are the editor's own right now, as while its completion list is open, preventing the default of each it takes; Shift+Tab always moves focus. */
  ownsKeys?: () => boolean;
}

/** What an expression editor receives: the text it edits, which the popover alone applies or cancels, and the value it opened from. */
export interface ExpressionEditorProps extends Pick<GridCellEditorContext, 'value' | 'ariaLabel'> {
  target: SentenceValueId;
  onChange: (text: string) => void;
  /** Takes the editor's handle once it can take focus, and null once it no longer can. */
  onReady: (handle: ExpressionEditorHandle | null) => void;
}

/** Whether a range includes each end. */
export interface RangeEnds {
  lowInclusive: boolean;
  highInclusive: boolean;
}

/** How many values an operator takes: one, a range's two ends, a list, or none. */
export type ValueShape = 'single' | 'range' | 'list' | 'valueless';

/** An operator the host offers a condition: its id, its words in the operator select, and how many values it takes. */
export interface OperatorOffer<Op> {
  operator: Op;
  label: string;
  shape: ValueShape;
}

/** The values a condition holds, in the shape of its operator. */
export type HeldValues<Op> =
  | { shape: 'single'; operator: Op; value: string }
  | { shape: 'range'; operator: Op; low: string; high: string; ends: RangeEnds }
  | { shape: 'list'; operator: Op; values: readonly string[] }
  | { shape: 'valueless'; operator: Op };

/** What a cell's popover edits: an outcome, a condition only its expression can show, or a condition by operator and values; a condition whose held operator is not among `operators` opens as its expression. */
export type ValueFieldData<Op> =
  | { kind: 'outcome'; allowedValues: readonly string[] }
  | { kind: 'expression'; allowedValues: readonly string[]; expression: string }
  | {
      kind: 'condition';
      allowedValues: readonly string[];
      expression: string;
      operators: readonly OperatorOffer<Op>[];
      held: HeldValues<Op>;
    };

/** What a commit carries: an outcome's value, a condition by its operator's shape, or the expression editor's text for the whole cell. */
export type ValueCommit<Op> =
  | { kind: 'outcome'; value: string }
  | { kind: 'single'; operator: Op; value: string }
  | { kind: 'range'; operator: Op; low: string; high: string; ends: RangeEnds }
  | { kind: 'list'; operator: Op; values: readonly string[] }
  | { kind: 'valueless'; operator: Op }
  | { kind: 'expression'; text: string };

/** The host's refusal of a commit, worded, and which refusal of the open editor it is. */
export interface CommitRefusal {
  message: string;
  attempt: number;
}
