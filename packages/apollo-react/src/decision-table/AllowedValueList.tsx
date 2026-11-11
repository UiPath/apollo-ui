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
  /** The value the cell holds when it is not one of `values`, listed after them and marked. */
  notAllowed: string | undefined;
  /** The not-allowed value's mark, as read aloud. */
  notAllowedLabel: string;
  /** The value the draft holds, checked when it is listed. */
  draft: string;
  /** A move to a value by focus or an arrow key, which only changes the draft. */
  onChoose: (value: string) => void;
  /** A click's or Space's pick of a value, which commits it. */
  onPick: (value: string) => void;
  label: string;
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
  focusRef,
  keyShortcuts,
}) => {
  const idPrefix = useId();
  const arrowedRef = useRef(false);
  const listed = notAllowed === undefined ? values : [...values, notAllowed];
  const checked = listed.includes(draft) ? draft : '';
  const focused = checked || listed[0];
  return (
    <RadioGroup
      aria-label={label}
      value={checked}
      className={ALLOWED_VALUES_CLASS}
      onKeyDownCapture={(event) => {
        arrowedRef.current = event.key.startsWith('Arrow') && !event.altKey;
      }}
      onPointerDownCapture={() => {
        arrowedRef.current = false;
      }}
      onValueChange={(value) => {
        const arrowed = arrowedRef.current;
        arrowedRef.current = false;
        if (arrowed) onChoose(value);
        else onPick(value);
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
            aria-describedby={value === notAllowed ? `${idPrefix}-not-allowed` : undefined}
            onFocus={() => {
              if (arrowedRef.current) onChoose(value);
            }}
          />
          <label htmlFor={`${idPrefix}-${index}`} className={ALLOWED_VALUE_LABEL_CLASS}>
            {value}
          </label>
          {value === notAllowed && (
            <>
              <MarkGlyph tone="error" />
              <span id={`${idPrefix}-not-allowed`} hidden>
                {notAllowedLabel}
              </span>
            </>
          )}
        </div>
      ))}
    </RadioGroup>
  );
};
