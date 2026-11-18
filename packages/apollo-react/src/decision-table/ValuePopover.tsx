import { Braces } from 'lucide-react';
import type React from 'react';
import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import { ExpressionEditorFrame, type ExpressionEditorFrameProps } from './ExpressionEditorFrame';
import { activeElementOf, isComposing } from './gridEvents';
import type { CellCommitMove, GridCellEditorContext } from './gridTypes';
import { PopoverFooter, type PopoverFooterLabels, type PopoverFooterLink } from './PopoverFooter';
import { PopoverHeader } from './PopoverHeader';
import { PopoverSelect } from './PopoverSelect';
import { POPOVER_CLASS, POPOVER_ERROR_CLASS } from './sentenceStyles';
import { type DraftProblemLabels, useShapeDraft } from './useShapeDraft';
import { ValueFields, type ValueFieldsLabels } from './ValueFields';
import type {
  CommitRefusal,
  ExpressionEditorProps,
  ValueCommit,
  ValueFieldData,
} from './valueTypes';

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
  extends Pick<ExpressionEditorProps, 'target' | 'value' | 'ariaLabel'>,
    Pick<GridCellEditorContext, 'onCancel'> {
  column: string;
  /** The column type's glyph, before its name. */
  icon: React.ReactNode;
  field: ValueFieldData<number>;
  /** Whether the condition is one the rule does not have yet, which needs a value to apply. */
  adds: boolean;
  /** `refocus` when focus was inside the popover, so an in-place commit returns it to the value. */
  onCommit: (commit: ValueCommit<number>, move: CellCommitMove, refocus: boolean) => void;
  /** The place among the host's operators of the one the select picks, before it commits. */
  onOperatorChange: (place: number) => void;
  /** Empties an outcome; undefined for a condition or an empty outcome. */
  onClear: (() => void) | undefined;
  /** The host's expression editor, which Edit expression swaps in for the fields on the whole condition; without it the popover's own text field. */
  renderEditor: ExpressionEditorFrameProps['renderEditor'];
  labels: ValuePopoverLabels;
  /** The host's refusal of the last commit, announced as it shows. */
  refusal: CommitRefusal | null;
  /** The text field's testid; derived ids: `-operator`, `-low`, `-high`, `-add`, `-expression`, `-clear` and the footer's. */
  dataTestId: string;
}

const sameCommit = (a: ValueCommit<number>, b: ValueCommit<number>): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

const OPERATOR_SHORTCUTS = 'Alt+ArrowDown Alt+ArrowUp';

const isListKey = (key: string): boolean => key === 'ArrowDown' || key === 'ArrowUp';

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
      icon,
      field,
      adds,
      onCommit,
      onCancel,
      onOperatorChange,
      onClear,
      renderEditor,
      labels,
      refusal,
      dataTestId,
    },
    ref
  ) => {
    const id = useId();
    const problemId = `${id}-problem`;
    const refusalId = `${id}-refusal`;
    const [root, setRoot] = useState<HTMLDivElement | null>(null);
    const [draft, setDraft] = useState(value);
    const [seed, setSeed] = useState<string | null>(null);
    const [listOpen, setListOpen] = useState(false);
    const focusRef = useRef<HTMLElement | null>(null);
    const draftRef = useRef(value);
    const seedRef = useRef<string | null>(null);
    const shapeDraft = useShapeDraft(field, value, adds);
    const { picker, current, problem } = shapeDraft;
    const [opened] = useState(current);
    const fieldsChanged = field.kind !== 'outcome' && !sameCommit(current, opened);
    const expression = seed !== null;
    const holdFocus = (element: HTMLElement | null) => {
      focusRef.current = element;
    };
    const changeDraft = (next: string) => {
      draftRef.current = next;
      setDraft(next);
    };
    const settling = (): ValueCommit<number> | null => {
      const text = draftRef.current;
      const seed = seedRef.current;
      if (seed !== null && (text !== seed || fieldsChanged)) return { kind: 'expression', text };
      return problem === null ? current : null;
    };

    const focusInside = (): boolean => root?.contains(activeElementOf(root)) ?? false;
    const commit = (next: ValueCommit<number>, move: CellCommitMove, refocus = focusInside()) => {
      onCommit(next, move, refocus);
    };
    const settle = (move: CellCommitMove) => {
      const next = settling();
      if (next) commit(next, move);
    };
    useImperativeHandle(ref, () => ({
      apply: () => settle('none'),
    }));
    const pick = (next: string) => {
      shapeDraft.setText(next);
      commit(shapeDraft.commitOf(next), 'none');
    };
    const changeOperator = (id: string) => {
      const picked = picker?.operators.find((option) => option.id === id);
      if (!picked) return;
      shapeDraft.changeOperator(picked.place);
      onOperatorChange(picked.place);
    };
    const openOperators = (event: React.KeyboardEvent<HTMLElement>): boolean => {
      if (!picker || !event.altKey || !isListKey(event.key)) return false;
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
    const editExpression = () => {
      const opened = field.kind === 'condition' ? field.expression : shapeDraft.text;
      seedRef.current = opened;
      changeDraft(opened);
      setSeed(opened);
    };

    return (
      <div ref={setRoot} className={POPOVER_CLASS}>
        <PopoverHeader icon={icon} column={column} />
        {expression ? (
          <ExpressionEditorFrame
            renderEditor={renderEditor}
            target={target}
            value={draft}
            ariaLabel={ariaLabel}
            onChange={changeDraft}
            onApply={() => settle('down')}
            onCancel={onCancel}
            dataTestId={`${dataTestId}-expression-editor`}
          />
        ) : (
          <>
            {picker && (
              <PopoverSelect
                value={String(picker.operator)}
                options={picker.operators}
                onChange={changeOperator}
                open={listOpen}
                onOpenChange={setListOpen}
                returnFocus={() => focusRef.current}
                container={root}
                label={labels.operator}
                dataTestId={`${dataTestId}-operator`}
              />
            )}
            <ValueFields
              draft={shapeDraft}
              index={target.index}
              column={column}
              ariaLabel={ariaLabel}
              onPick={pick}
              onFieldsKeyDown={onFieldsKeyDown}
              onValueKeyDown={onValueKeyDown}
              focusRef={holdFocus}
              keyShortcuts={picker ? OPERATOR_SHORTCUTS : undefined}
              describedBy={
                [problem && problemId, refusal && refusalId].filter(Boolean).join(' ') || undefined
              }
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
        {refusal && (
          <span key={refusal.attempt} id={refusalId} role="alert" className={POPOVER_ERROR_CLASS}>
            {refusal.message}
          </span>
        )}
        <PopoverFooter
          links={footerLinks(expression ? undefined : editExpression, onClear, labels, dataTestId)}
          onCancel={onCancel}
          onApply={() => settle('none')}
          apply={
            expression
              ? {
                  kind: 'editor',
                  dimmed: draft === seed && !fieldsChanged && problem !== null,
                }
              : { kind: 'fields', disabled: problem !== null }
          }
          labels={labels}
          dataTestId={dataTestId}
        />
      </div>
    );
  }
);

ValuePopover.displayName = 'ValuePopover';
