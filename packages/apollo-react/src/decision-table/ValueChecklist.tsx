import { Button, Checkbox, Input } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
import { useId } from 'react';
import { isComposing } from './gridEvents';
import { MarkGlyph } from './MarkGlyph';
import { keepFocus } from './PopoverFooter';
import {
  ADD_VALUE_BUTTON_CLASS,
  ADD_VALUE_CLASS,
  ALLOWED_VALUE_CLASS,
  ALLOWED_VALUE_LABEL_CLASS,
  ALLOWED_VALUES_CLASS,
  POPOVER_FIELD_CLASS,
  VALUE_POPOVER_CHOICES_CLASS,
} from './sentenceStyles';

export interface ValueChecklistProps {
  /** Every value the list offers, in order. */
  listed: readonly string[];
  checked: readonly string[];
  /** The listed values the column does not allow, marked. */
  notAllowed: readonly string[];
  notAllowedLabel: string;
  onToggle: (value: string, checked: boolean) => void;
  /** Adds a typed value, checked; undefined where the column's allowed values are the only choices. */
  onAdd: ((value: string) => void) | undefined;
  /** The add field's text. */
  adding: string;
  onAddingChange: (text: string) => void;
  addLabel: string;
  /** The value whose checkbox takes focus on mount and back from the operator list; the add field without one. */
  focused: string | undefined;
  focusRef: React.RefCallback<HTMLElement>;
  label: string;
  /** The message of the draft's problem with the list, when it has one. */
  describedBy: string | undefined;
  keyShortcuts: string | undefined;
  /** The popover's testid; derived id: `-add`. */
  dataTestId: string;
}

/** A list's values as checkboxes and, without allowed values, a field that adds one: Enter there adds its text, or applies when it is empty. */
export const ValueChecklist: React.FC<ValueChecklistProps> = ({
  listed,
  checked,
  notAllowed,
  notAllowedLabel,
  onToggle,
  onAdd,
  adding,
  onAddingChange,
  addLabel,
  focused,
  focusRef,
  label,
  describedBy,
  keyShortcuts,
  dataTestId,
}) => {
  const idPrefix = useId();
  const checkedValues = new Set(checked);
  const notAllowedValues = new Set(notAllowed);
  const focusedValue = focused !== undefined && listed.includes(focused) ? focused : undefined;
  const add = () => {
    const value = adding.trim();
    if (onAdd && value) onAdd(value);
  };
  return (
    <div className={VALUE_POPOVER_CHOICES_CLASS}>
      {listed.length > 0 && (
        <fieldset
          aria-label={label}
          aria-describedby={describedBy}
          className={ALLOWED_VALUES_CLASS}
        >
          {listed.map((value, index) => {
            const id = `${idPrefix}-${index}`;
            const marked = notAllowedValues.has(value);
            return (
              <div key={value} className={ALLOWED_VALUE_CLASS}>
                <Checkbox
                  ref={value === focusedValue ? focusRef : undefined}
                  autoFocus={value === focusedValue}
                  id={id}
                  checked={checkedValues.has(value)}
                  aria-keyshortcuts={keyShortcuts}
                  aria-describedby={marked ? `${id}-not-allowed` : undefined}
                  onCheckedChange={(state) => onToggle(value, state === true)}
                />
                <label htmlFor={id} className={ALLOWED_VALUE_LABEL_CLASS}>
                  {value}
                </label>
                {marked && (
                  <>
                    <MarkGlyph tone="error" />
                    <span id={`${id}-not-allowed`} hidden>
                      {notAllowedLabel}
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </fieldset>
      )}
      {onAdd && (
        <div className={ADD_VALUE_CLASS}>
          <Input
            ref={focusedValue === undefined ? focusRef : undefined}
            autoFocus={focusedValue === undefined}
            aria-label={addLabel}
            aria-keyshortcuts={keyShortcuts}
            aria-describedby={listed.length === 0 ? describedBy : undefined}
            placeholder={addLabel}
            className={POPOVER_FIELD_CLASS}
            data-testid={`${dataTestId}-add`}
            value={adding}
            onChange={(event) => onAddingChange(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || isComposing(event) || !adding.trim()) return;
              event.preventDefault();
              event.stopPropagation();
              add();
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            tabIndex={-1}
            aria-label={addLabel}
            className={ADD_VALUE_BUTTON_CLASS}
            disabled={!adding.trim()}
            onMouseDown={keepFocus}
            onClick={add}
          >
            <Plus aria-hidden />
          </Button>
        </div>
      )}
    </div>
  );
};
