import { Circle } from 'lucide-react';
import type React from 'react';
import { useId, useRef } from 'react';
import { MarkGlyph } from './MarkGlyph';
import {
  ALLOWED_VALUE_CLASS,
  ALLOWED_VALUE_DOT_CLASS,
  ALLOWED_VALUE_INPUT_CLASS,
  ALLOWED_VALUE_LABEL_CLASS,
  ALLOWED_VALUE_MARK_CLASS,
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
  /** A move to a value by an arrow key, which only changes the draft. */
  onChoose: (value: string) => void;
  /** A click's or Space's pick of a value, which commits it. */
  onPick: (value: string) => void;
  label: string;
  /** The message of the draft's problem with the choice, when it has one. */
  describedBy: string | undefined;
  /** The radio that takes focus on mount and back from the operator list: the checked one, else the first. */
  focusRef: React.Ref<HTMLInputElement>;
  keyShortcuts: string | undefined;
}

/** The column's allowed values as the browser's own radios: a click or Space picks one, arrows only move the choice. */
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
  const spacedRef = useRef<string | null>(null);
  const allowed = [...new Set(values)];
  const listed = [...allowed, ...notAllowed.filter((value) => !allowed.includes(value))];
  const checked = listed.includes(draft) ? draft : '';
  const focused = checked || listed[0];
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={describedBy !== undefined}
      aria-describedby={describedBy}
      className={ALLOWED_VALUES_CLASS}
      onKeyDownCapture={(event) => {
        arrowedRef.current = event.key.startsWith('Arrow') && !event.altKey;
        if (!event.repeat) spacedRef.current = null;
      }}
      onPointerDownCapture={() => {
        arrowedRef.current = false;
      }}
    >
      {listed.map((value, index) => (
        <div key={value} className={ALLOWED_VALUE_CLASS}>
          <input
            ref={value === focused ? focusRef : undefined}
            type="radio"
            name={idPrefix}
            // biome-ignore lint/a11y/noAutofocus: the popover opens on its held value
            autoFocus={value === focused}
            id={`${idPrefix}-${index}`}
            value={value}
            checked={value === checked}
            className={ALLOWED_VALUE_INPUT_CLASS}
            aria-labelledby={`${idPrefix}-${index}-label`}
            aria-keyshortcuts={keyShortcuts}
            aria-describedby={
              index >= allowed.length ? `${idPrefix}-${index}-not-allowed` : undefined
            }
            onChange={() => {
              if (arrowedRef.current) onChoose(value);
            }}
            onClick={() => {
              if (!arrowedRef.current) onPick(value);
            }}
            onKeyDown={(event) => {
              if (event.key !== ' ') return;
              event.preventDefault();
              if (!event.repeat) spacedRef.current = value;
            }}
            onKeyUp={(event) => {
              if (event.key !== ' ' || spacedRef.current !== value) return;
              spacedRef.current = null;
              onPick(value);
            }}
          />
          <label htmlFor={`${idPrefix}-${index}`} className={ALLOWED_VALUE_DOT_CLASS}>
            <Circle aria-hidden className={ALLOWED_VALUE_MARK_CLASS} />
          </label>
          <label
            id={`${idPrefix}-${index}-label`}
            htmlFor={`${idPrefix}-${index}`}
            className={ALLOWED_VALUE_LABEL_CLASS}
          >
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
    </div>
  );
};
