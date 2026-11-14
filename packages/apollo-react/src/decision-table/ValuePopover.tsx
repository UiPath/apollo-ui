import { Braces } from 'lucide-react';
import type React from 'react';
import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import { activeElementOf, isComposing } from './gridEvents';
import type { CellCommitMove } from './gridTypes';
import { PopoverFooter, type PopoverFooterLabels, type PopoverFooterLink } from './PopoverFooter';
import { PopoverHeader } from './PopoverHeader';
import { PopoverSelect } from './PopoverSelect';
import { POPOVER_CLASS, POPOVER_ERROR_CLASS } from './sentenceStyles';
import { type DraftProblemLabels, useShapeDraft } from './useShapeDraft';
import { ValueFields, type ValueFieldsLabels } from './ValueFields';
import type { SentenceEditorContext, ValueCommit, ValueField } from './valueTypes';

/** The popover's strings. */
export interface ValuePopoverLabels
  extends PopoverFooterLabels,
    ValueFieldsLabels,
    DraftProblemLabels {
  /** The operator select's name. */
  operator: string;
  editExpression: string;
  clear: string;
}

/** What the popover's overlay asks of it. */
export interface ValuePopoverHandle {
  /** Applies the draft in place, as Apply does. */
  apply: () => void;
}

export interface ValuePopoverProps
  extends Pick<SentenceEditorContext, 'target' | 'value' | 'ariaLabel' | 'onCancel'> {
  column: string;
  field: ValueField;
  /** Whether the condition is one the rule does not have yet, which needs a value to apply. */
  adds: boolean;
  /** A values commit's operator is the picked one of the field's, undefined without operators; `refocus` when focus was inside the popover, so an in-place commit returns it to the value. */
  onCommit: (commit: ValueCommit, move: CellCommitMove, refocus: boolean) => void;
  /** The operator the select picks, before it commits. */
  onOperatorChange: (id: string) => void;
  /** Empties an outcome; undefined for a condition or an empty outcome. */
  onClear: (() => void) | undefined;
  /** The host's expression editor, which Edit expression swaps in for the fields on the whole condition. */
  renderEditor: ((context: SentenceEditorContext) => React.ReactNode) | undefined;
  labels: ValuePopoverLabels;
  /** The text field's testid; derived ids: `-operator`, `-low`, `-high`, `-add`, `-expression`, `-clear` and the footer's. */
  dataTestId: string;
}

const sameCommit = (a: ValueCommit, b: ValueCommit): boolean => {
  if (a.kind === 'expression') return b.kind === 'expression' && a.text === b.text;
  if (b.kind === 'expression') return false;
  return (
    a.operator === b.operator &&
    a.values.length === b.values.length &&
    a.values.every((value, index) => value === b.values[index]) &&
    a.ends?.lowInclusive === b.ends?.lowInclusive &&
    a.ends?.highInclusive === b.ends?.highInclusive
  );
};

const OPERATOR_SHORTCUTS = 'Alt+ArrowDown Alt+ArrowUp';

const isListKey = (key: string): boolean => key === 'ArrowDown' || key === 'ArrowUp';

/** Blurs the control focused inside `root`, through open shadow roots, so a host editor hands over its text as it commits on blur. */
const blurFocusIn = (root: HTMLElement) => {
  let focused = activeElementOf(root);
  if (!focused || !root.contains(focused)) return;
  while (focused.shadowRoot?.activeElement) focused = focused.shadowRoot.activeElement;
  if (focused instanceof HTMLElement) focused.blur();
};

/** The footer's links: Edit expression while the popover's own fields show, and an outcome's Clear. */
const footerLinks = (
  editExpression: (() => void) | undefined,
  onClear: (() => void) | undefined,
  labels: ValuePopoverLabels,
  dataTestId: string
): PopoverFooterLink[] => [
  ...(editExpression
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

/** One condition's or outcome's editor: its column, its operator, its value, range or list, and the actions that settle it. Enter applies and moves down, and Apply or a press outside applies in place. An expression applied as it opened applies the popover's draft, unless the fields changed from the condition the host's expression words. */
export const ValuePopover = forwardRef<ValuePopoverHandle, ValuePopoverProps>(
  (
    {
      target,
      value,
      ariaLabel,
      column,
      field,
      adds,
      onCommit,
      onCancel,
      onOperatorChange,
      onClear,
      renderEditor,
      labels,
      dataTestId,
    },
    ref
  ) => {
    const problemId = `${useId()}-problem`;
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    const footerRef = useRef<HTMLDivElement | null>(null);
    const [draft, setDraft] = useState(value);
    const [seed, setSeed] = useState<string | null>(null);
    const [listOpen, setListOpen] = useState(false);
    const focusRef = useRef<HTMLElement | null>(null);
    const draftRef = useRef(value);
    const seedRef = useRef<string | null>(null);
    const shapeDraft = useShapeDraft(field, value, adds);
    const { operators, current, problem } = shapeDraft;
    const [opened] = useState(current);
    const fieldsChanged = field.expression !== undefined && !sameCommit(current, opened);
    const expression = seed !== null;
    const holdFocus = (element: HTMLElement | null) => {
      focusRef.current = element;
    };
    const changeDraft = (next: string) => {
      draftRef.current = next;
      setDraft(next);
    };
    const settling = (): ValueCommit | null => {
      const text = draftRef.current;
      const seed = seedRef.current;
      if (seed !== null && (text !== seed || fieldsChanged)) return { kind: 'expression', text };
      return problem === null ? current : null;
    };

    const focusInside = (): boolean => root?.contains(activeElementOf(root)) ?? false;
    const commit = (next: ValueCommit, move: CellCommitMove, refocus = focusInside()) => {
      onCommit(next, move, refocus);
    };
    const settle = (move: CellCommitMove, refocus?: boolean) => {
      const next = settling();
      if (next) commit(next, move, refocus);
    };
    useImperativeHandle(ref, () => ({
      apply: () => {
        const refocus = focusInside();
        if (expression && root) blurFocusIn(root);
        settle('none', refocus);
      },
    }));
    const pick = (next: string) => {
      shapeDraft.setText(next);
      commit({ kind: 'values', values: [next], operator: shapeDraft.picked }, 'none');
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
      if (isComposing(event) || event.key !== 'Enter') return;
      event.preventDefault();
      settle('down');
    };
    const onValueKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (!openOperators(event)) onFieldKeyDown(event);
    };
    const onFieldsKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
      if (isComposing(event) || openOperators(event) || event.key !== 'Enter') return;
      event.preventDefault();
      settle('down');
    };
    const commitExpression = (next: string, move: CellCommitMove) => {
      changeDraft(next);
      if (move !== 'left' && move !== 'right') {
        if (move !== 'none') settle(move);
        return;
      }
      const actions = [...(footerRef.current?.querySelectorAll('button:not(:disabled)') ?? [])];
      const action = move === 'left' ? actions.at(-1) : actions[0];
      if (action instanceof HTMLElement) action.focus();
    };
    const editExpression =
      renderEditor && (field.expression !== undefined || operators.length === 0)
        ? () => {
            const opened = field.expression ?? shapeDraft.text;
            seedRef.current = opened;
            changeDraft(opened);
            setSeed(opened);
          }
        : undefined;

    return (
      <div ref={setRoot} className={POPOVER_CLASS}>
        <PopoverHeader icon={field.icon} column={column} />
        {expression && renderEditor ? (
          <div>
            {renderEditor({
              target,
              value: draft,
              ariaLabel,
              onCommit: commitExpression,
              onCancel,
              onDraftChange: changeDraft,
            })}
          </div>
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
              describedBy={problem ? problemId : undefined}
              labels={labels}
              dataTestId={dataTestId}
            />
            {problem && (
              <span id={problemId} className={POPOVER_ERROR_CLASS}>
                {labels[problem]}
              </span>
            )}
          </>
        )}
        <PopoverFooter
          ref={footerRef}
          links={footerLinks(expression ? undefined : editExpression, onClear, labels, dataTestId)}
          onCancel={onCancel}
          onApply={() => settle('none')}
          applyDisabled={!expression && problem !== null}
          applyDimmed={expression && draft === seed && !fieldsChanged && problem !== null}
          applyKeepsFocus={!expression}
          labels={labels}
          dataTestId={dataTestId}
        />
      </div>
    );
  }
);

ValuePopover.displayName = 'ValuePopover';
