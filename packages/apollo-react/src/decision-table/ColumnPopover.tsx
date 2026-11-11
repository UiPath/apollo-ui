import { Input, Label } from '@uipath/apollo-wind';
import type React from 'react';
import { useId, useState } from 'react';
import { isComposing, isInList } from './gridEvents';
import { PopoverFooter, type PopoverFooterLabels, type PopoverFooterLink } from './PopoverFooter';
import { PopoverHeader } from './PopoverHeader';
import { PopoverSelect, type PopoverSelectOption } from './PopoverSelect';
import {
  COLUMN_CODE_FIELD_CLASS,
  COLUMN_ERROR_CLASS,
  COLUMN_FIELD_CLASS,
  COLUMN_FIELD_LABEL_CLASS,
  COLUMN_HINT_CLASS,
  COLUMN_REQUIRED_CLASS,
  POPOVER_CLASS,
  POPOVER_FIELD_CLASS,
} from './sentenceStyles';
import type { SentenceBand } from './sentenceTypes';

/** What a band column's popover edits, from the host's column. */
export interface ColumnField {
  kind: 'input' | 'output';
  label: string;
  /** An input's expression, or an output's name. */
  binding: string;
  /** Whether Apply waits for a binding. */
  required: boolean;
  /** The id of the column's type; one the host's types lack is offered as itself. */
  typeRef: string;
  /** The column's allowed values as text; without it the popover offers none. */
  allowedValues?: string;
}

/** The fields Apply changed, trimmed. */
export type ColumnChange = Partial<
  Pick<ColumnField, 'label' | 'binding' | 'typeRef' | 'allowedValues'>
>;

/** A type the popover offers. */
export interface ColumnTypeOption extends PopoverSelectOption {
  /** The allowed values' placeholder while this type is picked, e.g. "e.g. 10, 20". */
  allowedValuesPlaceholder?: string;
}

/** Editing of a band's input or output from its pill. */
export interface ColumnEdit {
  /** What the open pill's popover edits; called only while it is open. */
  field: (columnId: string) => ColumnField;
  types: readonly ColumnTypeOption[];
  /** Apply's changes; not called when nothing changed. */
  onCommit: (columnId: string, change: ColumnChange) => void;
  /** Opens the host's full properties of the column; without it the popover offers none. */
  onMoreProperties?: (columnId: string) => void;
}

/** The popover's strings. */
export interface ColumnPopoverLabels extends PopoverFooterLabels {
  /** The popover's title, e.g. "Input · Score". */
  inputColumn: (name: string) => string;
  outputColumn: (name: string) => string;
  columnLabel: string;
  inputExpression: string;
  outputName: string;
  missingInputExpression: string;
  missingOutputName: string;
  dataType: string;
  allowedValues: string;
  allowedValuesHint: string;
  moreProperties: string;
}

export interface ColumnPopoverProps {
  column: SentenceBand['columns'][number];
  field: ColumnField;
  types: ColumnEdit['types'];
  onApply: (change: ColumnChange) => void;
  onCancel: () => void;
  onMoreProperties: (() => void) | undefined;
  labels: ColumnPopoverLabels;
  /** Derived ids: `-label`, `-binding`, `-type`, `-allowed-values`, `-more` and the footer's. */
  dataTestId: string;
}

/** The popover's title for a column of its kind. */
export const columnTitle = (
  kind: ColumnField['kind'],
  name: string,
  labels: ColumnPopoverLabels
): string => (kind === 'input' ? labels.inputColumn(name) : labels.outputColumn(name));

const FOCUSABLE = 'input:not(:disabled), button:not(:disabled)';

/** The fields a draft changed from the column's, trimmed. */
const changeOf = (field: ColumnField, draft: Required<ColumnChange>): ColumnChange => {
  const change: ColumnChange = {};
  if (draft.label.trim() !== field.label.trim()) change.label = draft.label.trim();
  if (draft.binding.trim() !== field.binding.trim()) change.binding = draft.binding.trim();
  if (draft.typeRef !== field.typeRef) change.typeRef = draft.typeRef;
  if (
    field.allowedValues !== undefined &&
    draft.allowedValues.trim() !== field.allowedValues.trim()
  )
    change.allowedValues = draft.allowedValues.trim();
  return change;
};

/** A band column's editor: its label, its expression or name, its type and allowed values. Enter in a field applies, Escape cancels, and Tab stays inside. */
export const ColumnPopover: React.FC<ColumnPopoverProps> = ({
  column,
  field,
  types,
  onApply,
  onCancel,
  onMoreProperties,
  labels,
  dataTestId,
}) => {
  const id = useId();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<Required<ColumnChange>>({
    label: field.label,
    binding: field.binding,
    typeRef: field.typeRef,
    allowedValues: field.allowedValues ?? '',
  });
  const missing = field.required && draft.binding.trim() === '';
  const options = types.some((type) => type.id === field.typeRef)
    ? types
    : [{ id: field.typeRef, label: field.typeRef }, ...types];
  const placeholder = types.find((type) => type.id === draft.typeRef)?.allowedValuesPlaceholder;
  const set = (key: keyof ColumnChange) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const apply = () => {
    if (!missing) onApply(changeOf(field, draft));
  };

  const trapTab = (event: React.KeyboardEvent<HTMLElement>) => {
    const focusables = [...(root?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
    const edge = event.shiftKey ? focusables[0] : focusables.at(-1);
    const wrapTo = event.shiftKey ? focusables.at(-1) : focusables[0];
    if (event.target !== edge || !wrapTo) return;
    event.preventDefault();
    wrapTo.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (isComposing(event)) return;
    if (event.key === 'Tab') trapTab(event);
    else if (event.key === 'Escape' && !isInList(event.target)) onCancel();
    else if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      apply();
    }
  };

  const input = field.kind === 'input';
  const bindingLabel = input ? labels.inputExpression : labels.outputName;
  const links: PopoverFooterLink[] = onMoreProperties
    ? [
        {
          label: labels.moreProperties,
          onClick: onMoreProperties,
          dataTestId: `${dataTestId}-more`,
        },
      ]
    : [];

  return (
    <div ref={setRoot} className={POPOVER_CLASS} onKeyDown={onKeyDown}>
      <PopoverHeader icon={column.icon} column={columnTitle(field.kind, column.name, labels)} />
      <div className={COLUMN_FIELD_CLASS}>
        <Label htmlFor={`${id}-label`} className={COLUMN_FIELD_LABEL_CLASS}>
          {labels.columnLabel}
        </Label>
        <Input
          id={`${id}-label`}
          className={POPOVER_FIELD_CLASS}
          autoFocus
          value={draft.label}
          onChange={set('label')}
          data-testid={`${dataTestId}-label`}
        />
      </div>
      <div className={COLUMN_FIELD_CLASS}>
        <Label htmlFor={`${id}-binding`} className={COLUMN_FIELD_LABEL_CLASS}>
          {bindingLabel}
          {field.required && (
            <span aria-hidden className={COLUMN_REQUIRED_CLASS}>
              {' *'}
            </span>
          )}
        </Label>
        <Input
          id={`${id}-binding`}
          className={COLUMN_CODE_FIELD_CLASS}
          aria-required={field.required}
          aria-invalid={missing}
          aria-describedby={missing ? `${id}-missing` : undefined}
          value={draft.binding}
          onChange={set('binding')}
          data-testid={`${dataTestId}-binding`}
        />
        {missing && (
          <span id={`${id}-missing`} className={COLUMN_ERROR_CLASS}>
            {input ? labels.missingInputExpression : labels.missingOutputName}
          </span>
        )}
      </div>
      <div className={COLUMN_FIELD_CLASS}>
        <Label htmlFor={`${id}-type`} className={COLUMN_FIELD_LABEL_CLASS}>
          {labels.dataType}
        </Label>
        <PopoverSelect
          id={`${id}-type`}
          value={draft.typeRef}
          options={options}
          onChange={(typeRef) => setDraft((current) => ({ ...current, typeRef }))}
          container={root}
          label={labels.dataType}
          dataTestId={`${dataTestId}-type`}
        />
      </div>
      {field.allowedValues !== undefined && (
        <div className={COLUMN_FIELD_CLASS}>
          <Label htmlFor={`${id}-allowed`} className={COLUMN_FIELD_LABEL_CLASS}>
            {labels.allowedValues}
          </Label>
          <Input
            id={`${id}-allowed`}
            className={COLUMN_CODE_FIELD_CLASS}
            placeholder={placeholder}
            aria-describedby={`${id}-allowed-hint`}
            value={draft.allowedValues}
            onChange={set('allowedValues')}
            data-testid={`${dataTestId}-allowed-values`}
          />
          <span id={`${id}-allowed-hint`} className={COLUMN_HINT_CLASS}>
            {labels.allowedValuesHint}
          </span>
        </div>
      )}
      <PopoverFooter
        links={links}
        onCancel={onCancel}
        onApply={apply}
        applyDisabled={missing}
        labels={labels}
        dataTestId={dataTestId}
      />
    </div>
  );
};
