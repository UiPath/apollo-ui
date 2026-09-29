import * as React from 'react';
import { cn } from '@/lib/index';
import { controlValidation, useInputGroup } from './input-group-context';
import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';

export interface BooleanRadioGroupStrings {
  trueLabel: string;
  falseLabel: string;
}

export const DEFAULT_BOOLEAN_RADIO_GROUP_STRINGS: BooleanRadioGroupStrings = {
  trueLabel: 'True',
  falseLabel: 'False',
};

export interface BooleanRadioGroupProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof RadioGroup>,
    'value' | 'defaultValue' | 'onValueChange' | 'children'
  > {
  /**
   * `null` is the unset state, with neither radio checked; `undefined` reads the same. Unset is
   * reported as `null`, the cleared value form libraries such as react-hook-form expect.
   */
  value: boolean | null | undefined;
  onValueChange: (value: boolean | null) => void;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<BooleanRadioGroupStrings>;
}

const OPTIONS = [
  { value: 'true', key: 'trueLabel' },
  { value: 'false', key: 'falseLabel' },
] as const;

/**
 * True / False radios with a third, unset state, for a boolean that may have no value: a switch or
 * checkbox can only show two. Clicking the checked radio clears the value. Inside an `InputGroup`
 * both radios are the group's control, so its focus ring answers to either.
 */
const BooleanRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroup>,
  BooleanRadioGroupProps
>(
  (
    {
      value,
      onValueChange,
      strings,
      disabled: disabledProp,
      className,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
      ...props
    },
    ref
  ) => {
    const text = { ...DEFAULT_BOOLEAN_RADIO_GROUP_STRINGS, ...strings };
    const groupId = React.useId();
    const group = useInputGroup();
    const { inGroup } = group;
    // As Input does: a disabled or invalid group is this control's state too.
    const disabled = disabledProp || group.disabled;
    const aria = controlValidation(group, {
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });
    const checked = typeof value === 'boolean' ? String(value) : '';
    const handleValueChange = React.useCallback(
      (next: string) => onValueChange(next === 'true'),
      [onValueChange]
    );
    // Radix fires no change for a click on the checked item, so clearing rides the click.
    const clearIfChecked = React.useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        if (event.currentTarget.value === checked) onValueChange(null);
      },
      [checked, onValueChange]
    );

    return (
      <RadioGroup
        ref={ref}
        // Radix leaves every item unchecked for a value matching no item, which is the unset state.
        value={checked}
        onValueChange={handleValueChange}
        disabled={disabled}
        className={cn('flex flex-1 items-center gap-4', className)}
        {...props}
        {...aria}
      >
        {OPTIONS.map((option) => {
          const itemId = `${groupId}-${option.value}`;
          return (
            <div key={option.value} className="flex items-center gap-1.5">
              <RadioGroupItem
                id={itemId}
                value={option.value}
                // Undefined would erase the item's own slot, so the override is spread only in a group.
                {...(inGroup && { 'data-slot': 'input-group-control' })}
                onClick={clearIfChecked}
              />
              <Label
                htmlFor={itemId}
                className={cn('font-normal', disabled ? 'cursor-not-allowed' : 'cursor-pointer')}
              >
                {text[option.key]}
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    );
  }
);
BooleanRadioGroup.displayName = 'BooleanRadioGroup';

export { BooleanRadioGroup };
