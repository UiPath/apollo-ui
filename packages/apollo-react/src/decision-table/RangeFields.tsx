import { Checkbox, Input } from '@uipath/apollo-wind';
import type React from 'react';
import { useId } from 'react';
import {
  RANGE_END_CLASS,
  RANGE_END_FIELD_CLASS,
  RANGE_FIELDS_CLASS,
  RANGE_INCLUDED_CLASS,
} from './sentenceStyles';
import type { RangeEnds } from './valueTypes';

export type RangeEnd = 'low' | 'high';

export interface RangeFieldsLabels {
  /** A range's two ends, e.g. "From" and "To". */
  rangeLow: string;
  rangeHigh: string;
  /** The checkbox beside each end, e.g. "Included". */
  included: string;
}

export interface RangeFieldsProps {
  low: string;
  high: string;
  ends: RangeEnds;
  onChange: (low: string, high: string, ends: RangeEnds) => void;
  /** The end whose field takes focus on mount and back from the operator list. */
  focused: RangeEnd;
  focusRef: React.RefCallback<HTMLElement>;
  /** The ends the draft's problem is with, described by `describedBy`. */
  invalid: Readonly<Record<RangeEnd, boolean>>;
  describedBy: string | undefined;
  labels: RangeFieldsLabels;
  keyShortcuts: string | undefined;
  /** The popover's testid; derived ids: `-low`, `-high`. */
  dataTestId: string;
}

/** A range's two ends, From over To, each with whether it is included. */
export const RangeFields: React.FC<RangeFieldsProps> = ({
  low,
  high,
  ends,
  onChange,
  focused,
  focusRef,
  invalid,
  describedBy,
  labels,
  keyShortcuts,
  dataTestId,
}) => {
  const idPrefix = useId();
  const endOf = (end: RangeEnd) => {
    const isLow = end === 'low';
    const name = isLow ? labels.rangeLow : labels.rangeHigh;
    const checkboxId = `${idPrefix}-${end}`;
    return (
      <fieldset aria-label={name} className={RANGE_END_CLASS}>
        <Input
          ref={end === focused ? focusRef : undefined}
          autoFocus={end === focused}
          aria-label={name}
          aria-keyshortcuts={keyShortcuts}
          aria-invalid={invalid[end]}
          aria-describedby={invalid[end] ? describedBy : undefined}
          className={RANGE_END_FIELD_CLASS}
          data-testid={`${dataTestId}-${end}`}
          value={isLow ? low : high}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => {
            const text = event.currentTarget.value;
            onChange(isLow ? text : low, isLow ? high : text, ends);
          }}
        />
        <Checkbox
          id={checkboxId}
          aria-keyshortcuts={keyShortcuts}
          checked={isLow ? ends.lowInclusive : ends.highInclusive}
          onCheckedChange={(checked) =>
            onChange(
              low,
              high,
              isLow
                ? { ...ends, lowInclusive: checked === true }
                : { ...ends, highInclusive: checked === true }
            )
          }
        />
        <label htmlFor={checkboxId} className={RANGE_INCLUDED_CLASS}>
          {labels.included}
        </label>
      </fieldset>
    );
  };
  return (
    <div className={RANGE_FIELDS_CLASS}>
      {endOf('low')}
      {endOf('high')}
    </div>
  );
};
