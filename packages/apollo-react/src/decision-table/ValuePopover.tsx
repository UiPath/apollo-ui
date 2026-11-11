import { Braces } from 'lucide-react';
import type React from 'react';
import { useRef, useState } from 'react';
import type { GridCellEditorContext } from './GridCell';
import { commitMoveFor, isComposing, isInList } from './gridEvents';
import type { CellCommitMove } from './gridTypes';
import { PopoverFooter, type PopoverFooterLabels, type PopoverFooterLink } from './PopoverFooter';
import { PopoverHeader } from './PopoverHeader';
import { PopoverSelect, type PopoverSelectOption } from './PopoverSelect';
import { POPOVER_CLASS } from './sentenceStyles';
import type { SentenceBand, SentenceValueId } from './sentenceTypes';
import { useShapeDraft } from './useShapeDraft';
import { ValueFields } from './ValueFields';

/** What a host's expression editor receives: the grid's editor contract, and the value it edits. */
export interface SentenceEditorContext extends GridCellEditorContext {
  target: SentenceValueId;
}

/** How many values an operator takes: one, a range's two ends, or a list. */
type ValueShape = 'single' | 'range' | 'list';

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
export interface ValueField extends Pick<SentenceBand['columns'][number], 'icon'> {
  /** A condition's operators; without them the popover shows none. */
  operators?: readonly ValueOperatorOption[];
  /** The id of the operator the condition has, or a new condition starts with. */
  operator?: string;
  /** The column's allowed values, each one literal, offered as radios or a list's checkboxes in place of the text field. */
  allowedValues?: readonly string[];
  /** The condition's values by sentence index, when its operator takes more than one. */
  values?: readonly string[];
  /** A range's ends, when its operator is a range. */
  ends?: RangeEnds;
  /** Whether a range's low end is at most its high end; without it any two ends are. */
  inOrder?: (low: string, high: string) => boolean;
}

/** What a commit carries: the values in sentence order, the picked operator, and a range's ends. */
export interface ValueCommit {
  values: readonly string[];
  operator: string | undefined;
  ends?: RangeEnds;
}

/** The popover's strings. */
export interface ValuePopoverLabels extends PopoverFooterLabels {
  /** The operator select's name. */
  operator: string;
  /** A held value the allowed values leave out, as its mark is read. */
  notAllowed: string;
  editExpression: string;
  clear: string;
  /** A range's two ends, e.g. "From" and "To". */
  rangeLow: string;
  rangeHigh: string;
  /** The checkbox beside each end, e.g. "Included". */
  included: string;
  /** The field and button that add a value to a list, e.g. "Add value". */
  addValue: string;
}

export interface ValuePopoverProps
  extends Pick<SentenceEditorContext, 'target' | 'value' | 'ariaLabel' | 'onCancel'> {
  column: string;
  field: ValueField;
  /** The commit's operator is the picked one of the field's, undefined without operators or from the expression editor; `refocus` when focus was inside the popover, so an in-place commit returns it to the value. */
  onCommit: (commit: ValueCommit, move: CellCommitMove, refocus: boolean) => void;
  /** The operator the select picks, before it commits. */
  onOperatorChange: (id: string) => void;
  /** Empties an outcome; undefined for a condition or an empty outcome. */
  onClear: (() => void) | undefined;
  /** The host's expression editor, which Edit expression swaps in for the value. */
  renderEditor: ((context: SentenceEditorContext) => React.ReactNode) | undefined;
  labels: ValuePopoverLabels;
  /** The text field's testid; derived ids: `-operator`, `-low`, `-high`, `-add`, `-expression`, `-clear` and the footer's. */
  dataTestId: string;
}

/** What last settled the edit: a commit, or a cancel. */
type Settled = ValueCommit | 'cancelled';

const sameCommit = (a: ValueCommit, b: ValueCommit): boolean =>
  a.operator === b.operator &&
  a.values.length === b.values.length &&
  a.values.every((value, index) => value === b.values[index]) &&
  a.ends?.lowInclusive === b.ends?.lowInclusive &&
  a.ends?.highInclusive === b.ends?.highInclusive;

const OPERATOR_SHORTCUTS = 'Alt+ArrowDown Alt+ArrowUp';

const isListKey = (key: string): boolean => key === 'ArrowDown' || key === 'ArrowUp';

/** A range's or list's fields that Tab stops on, so Tab past the last or Shift+Tab before the first applies and moves. */
const FIELD_STOPS = 'input:not([tabindex="-1"]), [role="checkbox"]';

const leavesFields = (event: React.KeyboardEvent<HTMLElement>): boolean => {
  if (event.key === 'Enter') return true;
  if (event.key !== 'Tab') return false;
  const stops = [...event.currentTarget.querySelectorAll<HTMLElement>(FIELD_STOPS)];
  return event.target === (event.shiftKey ? stops[0] : stops.at(-1));
};

/** One condition's or outcome's editor: its column, its operator, its value, range or list, and the actions that settle it. Enter applies and moves down; Tab and Shift+Tab apply and move from its last and first field; Escape cancels; focus leaving the popover applies in place. */
export const ValuePopover: React.FC<ValuePopoverProps> = ({
  target,
  value,
  ariaLabel,
  column,
  field,
  onCommit,
  onCancel,
  onOperatorChange,
  onClear,
  renderEditor,
  labels,
  dataTestId,
}) => {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState(value);
  const [expression, setExpression] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const focusRef = useRef<HTMLElement | null>(null);
  const expressionRef = useRef(false);
  const settledRef = useRef<Settled | null>(null);
  const shapeDraft = useShapeDraft(field, value, expression);
  const { operators, current, complete } = shapeDraft;
  const holdFocus = (element: HTMLElement | null) => {
    focusRef.current = element;
  };

  const commit = (next: ValueCommit, move: CellCommitMove) => {
    settledRef.current = next;
    onCommit(next, move, root?.contains(document.activeElement) ?? false);
  };
  const cancel = () => {
    if (settledRef.current === 'cancelled') return;
    settledRef.current = 'cancelled';
    onCancel();
  };
  const pick = (next: string) => {
    shapeDraft.setText(next);
    commit({ values: [next], operator: shapeDraft.picked }, 'none');
  };
  const changeOperator = (id: string) => {
    shapeDraft.changeOperator(id);
    onOperatorChange(id);
  };
  const openOperators = (event: React.KeyboardEvent<HTMLElement>): boolean => {
    if (operators.length === 0 || !event.altKey || !isListKey(event.key)) return false;
    event.preventDefault();
    setListOpen(true);
    return true;
  };

  const onFieldKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (isComposing(event) || (event.key !== 'Enter' && event.key !== 'Tab')) return;
    event.preventDefault();
    commit(current, commitMoveFor(event));
  };
  const onValueKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (!openOperators(event)) onFieldKeyDown(event);
  };
  const onFieldsKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (isComposing(event) || openOperators(event) || !leavesFields(event)) return;
    if (event.key === 'Enter' || complete) event.preventDefault();
    if (complete) commit(current, commitMoveFor(event));
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && !isComposing(event) && !isInList(event.target)) cancel();
  };
  const onBlur = (event: React.FocusEvent<HTMLElement>) => {
    const to = event.relatedTarget;
    if (expressionRef.current || (to instanceof Node && event.currentTarget.contains(to))) return;
    const settled = settledRef.current;
    if (settled === 'cancelled' || !complete) return;
    if (settled && sameCommit(settled, current)) return;
    commit(current, 'none');
  };
  const editExpression = renderEditor
    ? () => {
        expressionRef.current = true;
        setDraft(
          shapeDraft.shape === 'single'
            ? shapeDraft.text
            : (shapeDraft.values[target.index] ?? shapeDraft.text)
        );
        setExpression(true);
      }
    : undefined;

  const links: PopoverFooterLink[] = [
    ...(editExpression && !expression
      ? [
          {
            label: labels.editExpression,
            icon: <Braces aria-hidden />,
            onClick: editExpression,
            dataTestId: `${dataTestId}-expression`,
          },
        ]
      : []),
    ...(onClear
      ? [{ label: labels.clear, onClick: onClear, dataTestId: `${dataTestId}-clear` }]
      : []),
  ];

  return (
    <div ref={setRoot} className={POPOVER_CLASS} onKeyDown={onKeyDown} onBlur={onBlur}>
      <PopoverHeader icon={field.icon} column={column} />
      {expression && renderEditor ? (
        renderEditor({
          target,
          value: draft,
          ariaLabel,
          onCommit: (next, move) => commit({ values: [next], operator: undefined }, move),
          onCancel: cancel,
          onDraftChange: setDraft,
        })
      ) : (
        <>
          {operators.length > 0 && (
            <PopoverSelect
              value={shapeDraft.operator ?? ''}
              options={operators}
              onChange={changeOperator}
              open={listOpen}
              onOpenChange={setListOpen}
              returnFocus={() => focusRef.current?.focus()}
              container={root}
              label={labels.operator}
              dataTestId={`${dataTestId}-operator`}
            />
          )}
          <ValueFields
            draft={shapeDraft}
            value={value}
            index={target.index}
            values={field.values}
            column={column}
            ariaLabel={ariaLabel}
            onPick={pick}
            onFieldsKeyDown={onFieldsKeyDown}
            onValueKeyDown={onValueKeyDown}
            focusRef={holdFocus}
            keyShortcuts={operators.length > 0 ? OPERATOR_SHORTCUTS : undefined}
            labels={labels}
            dataTestId={dataTestId}
          />
        </>
      )}
      <PopoverFooter
        links={links}
        onCancel={cancel}
        onApply={() =>
          commit(expression ? { values: [draft], operator: undefined } : current, 'none')
        }
        applyDisabled={!expression && !complete}
        labels={labels}
        dataTestId={dataTestId}
      />
    </div>
  );
};
