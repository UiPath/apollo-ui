import { Input } from '@uipath/apollo-wind';
import type React from 'react';
import type { AllowedValueListProps } from './AllowedValueList';
import { AllowedValueList } from './AllowedValueList';
import { type RangeEnd, RangeFields, type RangeFieldsLabels } from './RangeFields';
import { POPOVER_FIELD_CLASS, VALUE_POPOVER_CHOICES_CLASS } from './sentenceStyles';
import type { ShapeDraft } from './useShapeDraft';
import { ValueChecklist } from './ValueChecklist';

export interface ValueFieldsLabels extends RangeFieldsLabels {
  /** A held value the allowed values leave out, as its mark is read. */
  notAllowed: string;
  /** The field and button that add a value to a list, e.g. "Add value". */
  addValue: string;
}

export interface ValueFieldsProps {
  draft: ShapeDraft;
  value: string;
  index: number;
  values: readonly string[] | undefined;
  column: string;
  ariaLabel: string;
  onPick: AllowedValueListProps['onPick'];
  onFieldsKeyDown: React.KeyboardEventHandler<HTMLElement>;
  onValueKeyDown: React.KeyboardEventHandler<HTMLElement>;
  focusRef: React.RefCallback<HTMLElement>;
  keyShortcuts: string | undefined;
  /** The message of the draft's problem, when it has one. */
  describedBy: string | undefined;
  labels: ValueFieldsLabels;
  /** The popover's testid; derived ids: `-low`, `-high`, `-add`. */
  dataTestId: string;
}

/** The range ends the draft's problem is with: an empty one, or the high end of ends out of order. */
const invalidEnds = ({ problem, text, high }: ShapeDraft): Record<RangeEnd, boolean> => {
  const missing = problem === 'missingEnd';
  return {
    low: missing && text.trim() === '',
    high: (missing && high.trim() === '') || problem === 'endsOutOfOrder',
  };
};

/** The value a condition's operator takes: a range's ends, a list's values, an allowed value or a text field. */
export const ValueFields: React.FC<ValueFieldsProps> = ({
  draft,
  value,
  index,
  values,
  column,
  ariaLabel,
  onPick,
  onFieldsKeyDown,
  onValueKeyDown,
  focusRef,
  keyShortcuts,
  labels,
  describedBy,
  dataTestId,
}) => {
  const { shape, text, allowedValues, listed, checked } = draft;
  const choices = allowedValues.length > 0;
  if (shape === 'range') {
    return (
      <div onKeyDown={onFieldsKeyDown}>
        <RangeFields
          low={text}
          high={draft.high}
          ends={draft.ends}
          onChange={draft.setRange}
          focused={index === 1 ? 'high' : 'low'}
          focusRef={focusRef}
          invalid={invalidEnds(draft)}
          describedBy={describedBy}
          labels={labels}
          keyShortcuts={keyShortcuts}
          dataTestId={dataTestId}
        />
      </div>
    );
  }
  if (shape === 'list') {
    const allowed = new Set(allowedValues);
    return (
      <div onKeyDown={onFieldsKeyDown}>
        <ValueChecklist
          listed={listed}
          checked={checked}
          notAllowed={choices ? listed.filter((option) => !allowed.has(option)) : []}
          notAllowedLabel={labels.notAllowed}
          onToggle={draft.toggle}
          onAdd={choices ? undefined : draft.add}
          adding={draft.adding}
          onAddingChange={draft.setAdding}
          addLabel={labels.addValue}
          focused={values?.[index] ?? checked[0] ?? listed[0]}
          focusRef={focusRef}
          label={column}
          describedBy={describedBy}
          keyShortcuts={keyShortcuts}
          dataTestId={dataTestId}
        />
      </div>
    );
  }
  if (choices) {
    return (
      <div className={VALUE_POPOVER_CHOICES_CLASS} onKeyDown={onValueKeyDown}>
        <AllowedValueList
          values={allowedValues}
          notAllowed={value === '' || allowedValues.includes(value) ? undefined : value}
          notAllowedLabel={labels.notAllowed}
          draft={text}
          onChoose={draft.setText}
          onPick={onPick}
          label={column}
          describedBy={describedBy}
          focusRef={focusRef}
          keyShortcuts={keyShortcuts}
        />
      </div>
    );
  }
  return (
    <Input
      ref={focusRef}
      aria-keyshortcuts={keyShortcuts}
      className={POPOVER_FIELD_CLASS}
      aria-label={ariaLabel}
      aria-invalid={describedBy !== undefined}
      aria-describedby={describedBy}
      data-testid={dataTestId}
      autoFocus
      value={text}
      onFocus={(event) => event.currentTarget.select()}
      onChange={(event) => draft.setText(event.currentTarget.value)}
      onKeyDown={onValueKeyDown}
    />
  );
};
