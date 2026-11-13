import { RadioGroup, RadioGroupItem } from '@uipath/apollo-wind';
import type React from 'react';
import { useId, useRef } from 'react';
import { MarkGlyph } from './MarkGlyph';
import {
  ALLOWED_VALUE_CLASS,
  ALLOWED_VALUE_LABEL_CLASS,
  ALLOWED_VALUES_CLASS,
} from './sentenceStyles';

export interface AllowedValueListProps {
  values: readonly string[];
  /** The held and drafted values that are not among `values`, listed after them and marked. */
  notAllowed: readonly string[];
  /** A not-allowed value's mark, as read aloud. */
  notAllowedLabel: string;
  /** The value the draft holds, checked when it is listed. */
  draft: string;
  /** A move to a value by focus or an arrow key, which only changes the draft. */
  onChoose: (value: string) => void;
  /** A click's or Space's pick of a value, which commits it. */
  onPick: (value: string) => void;
  label: string;
  /** The message of the draft's problem with the choice, when it has one. */
  describedBy: string | undefined;
  /** The radio that takes focus on mount and back from the operator list: the checked one, else the first. */
  focusRef: React.Ref<HTMLButtonElement>;
  keyShortcuts: string | undefined;
}

/** The column's allowed values as radios: a click or Space picks one, arrows only move the choice. */
export const AllowedValueList: React.FC<AllowedValueListProps> = ({
  values,
  notAllowed,
  notAllowedLabel,
  draft,
  onChoose,
  onPick,
  label,
  describedBy,
  focusRef,
  keyShortcuts,
}) => {
  const idPrefix = useId();
  const arrowedRef = useRef(false);
  const allowed = [...new Set(values)];
  const listed = [...allowed, ...notAllowed.filter((value) => !allowed.includes(value))];
  const checked = listed.includes(draft) ? draft : '';
  const focused = checked || listed[0];
  return (
    <RadioGroup
      aria-label={label}
      aria-invalid={describedBy !== undefined}
      aria-describedby={describedBy}
      value={checked}
      className={ALLOWED_VALUES_CLASS}
      onKeyDownCapture={(event) => {
        arrowedRef.current = event.key.startsWith('Arrow') && !event.altKey;
      }}
      onPointerDownCapture={() => {
        arrowedRef.current = false;
      }}
      onValueChange={(value) => {
        if (arrowedRef.current) onChoose(value);
        arrowedRef.current = false;
      }}
    >
      {listed.map((value, index) => (
        <div key={value} className={ALLOWED_VALUE_CLASS}>
          <RadioGroupItem
            ref={value === focused ? focusRef : undefined}
            autoFocus={value === focused}
            id={`${idPrefix}-${index}`}
            value={value}
            aria-keyshortcuts={keyShortcuts}
            aria-describedby={
              index >= allowed.length ? `${idPrefix}-${index}-not-allowed` : undefined
            }
            onFocus={() => {
              if (arrowedRef.current) onChoose(value);
            }}
            onClick={() => {
              if (!arrowedRef.current) onPick(value);
            }}
          />
          <label htmlFor={`${idPrefix}-${index}`} className={ALLOWED_VALUE_LABEL_CLASS}>
            {value}
          </label>
          {index >= allowed.length && (
            <>
              <MarkGlyph tone="error" />
              <span id={`${idPrefix}-${index}-not-allowed`} hidden>
                {notAllowedLabel}
              </span>
            </>
          )}
        </div>
      ))}
    </RadioGroup>
  );
};
