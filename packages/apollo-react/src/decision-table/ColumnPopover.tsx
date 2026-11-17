import { Input, Label } from '@uipath/apollo-wind';
import type React from 'react';
import { useId, useState } from 'react';
import type { ColumnTypeChoice } from './columnTypes';
import { isComposing } from './gridEvents';
import { PopoverFooter, type PopoverFooterLabels, type PopoverFooterLink } from './PopoverFooter';
import { PopoverHeader } from './PopoverHeader';
import { PopoverSelect } from './PopoverSelect';
import {
  COLUMN_CODE_FIELD_CLASS,
  COLUMN_FIELD_CLASS,
  COLUMN_FIELD_LABEL_CLASS,
  COLUMN_HINT_CLASS,
  COLUMN_REQUIRED_CLASS,
  POPOVER_CLASS,
  POPOVER_ERROR_CLASS,
  POPOVER_FIELD_CLASS,
} from './sentenceStyles';
import type { SentenceBand } from './sentenceTypes';

/** What a band column's popover edits, from the host's column: an input's expression, or an output's name and whether it needs one, with the host's type of it. */
export type ColumnFieldData<Type> =
  | { kind: 'input'; label: string; expression: string; type: Type; allowedValues: string }
  | {
      kind: 'output';
      label: string;
      name: string;
      nameRequired: boolean;
      type: Type;
      allowedValues: string;
    };

/** The fields Apply changed, trimmed; a field left out is unchanged. */
export type ColumnChange<Type> =
  | { kind: 'input'; label?: string; expression?: string; type?: Type; allowedValues?: string }
  | { kind: 'output'; label?: string; name?: string; type?: Type; allowedValues?: string };

/** Editing of a band's input or output from its pill, in the host's column types. */
export interface ColumnEdit<Type> {
  /** What the open pill's popover edits, or undefined to close it; called only while it is open. */
  field: (columnId: string) => ColumnFieldData<Type> | undefined;
  /** Apply's changes; not called when nothing changed. */
  onCommit: (columnId: string, change: ColumnChange<Type>) => void;
  /** Opens the host's full properties of the column; without it the popover offers none. */
  onMoreProperties?: (columnId: string) => void;
}

/** The popover's strings. */
export interface ColumnPopoverLabels extends PopoverFooterLabels {
  /** The popover's title, e.g. "Input · Score". */
  inputColumn: (name: string) => string;
  outputColumn: (name: string) => string;
  columnLabel: string;
  /** The error under an empty label, e.g. "Enter a label". */
  missingLabel: string;
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
  /** The column with its type by its place among `types`, -1 when they lack it. */
  field: ColumnFieldData<number>;
  types: readonly ColumnTypeChoice[];
  onApply: (change: ColumnChange<number>) => void;
  onCancel: () => void;
  onMoreProperties: (() => void) | undefined;
  labels: ColumnPopoverLabels;
  /** Derived ids: `-label`, `-binding`, `-type`, `-allowed-values`, `-more` and the footer's. */
  dataTestId: string;
}

/** The popover's title for a column of its kind. */
export const columnTitle = (
  kind: ColumnFieldData<number>['kind'],
  name: string,
  labels: ColumnPopoverLabels
): string => (kind === 'input' ? labels.inputColumn(name) : labels.outputColumn(name));

interface ColumnDraft {
  label: string;
  binding: string;
  type: number;
  allowedValues: string;
}

const bindingOf = (field: ColumnFieldData<number>): string =>
  field.kind === 'input' ? field.expression : field.name;

const changed = (draft: string, held: string): string | undefined =>
  draft.trim() === held.trim() ? undefined : draft.trim();

/** The fields a draft changed from the column's, trimmed; nothing changed when it has only its kind. */
const changeOf = (field: ColumnFieldData<number>, draft: ColumnDraft): ColumnChange<number> => {
  const label = changed(draft.label, field.label);
  const allowedValues = changed(draft.allowedValues, field.allowedValues);
  const common = {
    ...(label === undefined ? {} : { label }),
    ...(draft.type === field.type ? {} : { type: draft.type }),
    ...(allowedValues === undefined ? {} : { allowedValues }),
  };
  const binding = changed(draft.binding, bindingOf(field));
  if (field.kind === 'input')
    return { kind: 'input', ...common, ...(binding === undefined ? {} : { expression: binding }) };
  return { kind: 'output', ...common, ...(binding === undefined ? {} : { name: binding }) };
};

/** A band column's editor: its label, its expression or name, its type and allowed values. Enter in a field applies. */
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
  const [draft, setDraft] = useState<ColumnDraft>({
    label: field.label,
    binding: bindingOf(field),
    type: field.type,
    allowedValues: field.allowedValues,
  });
  const required = field.kind === 'input' || field.nameRequired;
  const missing = required && draft.binding.trim() === '';
  const missingLabel = draft.label.trim() === '';
  const placeholder = types.find((_type, place) => place === draft.type)?.allowedValuesPlaceholder;
  const set = (key: keyof ColumnDraft) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value;
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const apply = () => {
    if (!missing && !missingLabel) onApply(changeOf(field, draft));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (isComposing(event) || event.key !== 'Enter') return;
    if (event.target instanceof HTMLInputElement) {
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
          aria-invalid={missingLabel}
          aria-describedby={missingLabel ? `${id}-missing-label` : undefined}
          value={draft.label}
          onChange={set('label')}
          data-testid={`${dataTestId}-label`}
        />
        {missingLabel && (
          <span id={`${id}-missing-label`} className={POPOVER_ERROR_CLASS}>
            {labels.missingLabel}
          </span>
        )}
      </div>
      <div className={COLUMN_FIELD_CLASS}>
        <Label htmlFor={`${id}-binding`} className={COLUMN_FIELD_LABEL_CLASS}>
          {bindingLabel}
          {required && (
            <span aria-hidden className={COLUMN_REQUIRED_CLASS}>
              {' *'}
            </span>
          )}
        </Label>
        <Input
          id={`${id}-binding`}
          className={COLUMN_CODE_FIELD_CLASS}
          aria-required={required}
          aria-invalid={missing}
          aria-describedby={missing ? `${id}-missing` : undefined}
          value={draft.binding}
          onChange={set('binding')}
          data-testid={`${dataTestId}-binding`}
        />
        {missing && (
          <span id={`${id}-missing`} className={POPOVER_ERROR_CLASS}>
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
          value={String(draft.type)}
          options={types}
          onChange={(id) =>
            setDraft((current) => ({ ...current, type: types.findIndex((type) => type.id === id) }))
          }
          container={root}
          label={labels.dataType}
          dataTestId={`${dataTestId}-type`}
        />
      </div>
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
      <PopoverFooter
        links={links}
        onCancel={onCancel}
        onApply={apply}
        apply={{ kind: 'fields', disabled: missing || missingLabel }}
        labels={labels}
        dataTestId={dataTestId}
      />
    </div>
  );
};
