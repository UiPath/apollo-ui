import * as React from 'react';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueModeStrings,
} from '@/components/ui/field-addons/value-mode-strings';
import { InputGroupPopoverTrigger } from '@/components/ui/input-group';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { VariablePickerContent, type VariablePickerItem } from '@/components/ui/variable-picker';
import { composeRefs } from '@/lib';

export interface VariableValueControlProps {
  id?: string;
  name?: string;
  /** The bound reference, such as `$vars.orderId`. */
  value?: string;
  onChange: (reference: string) => void;
  /** Called when the trigger loses focus, as a form library marks a field touched. */
  onBlur?: () => void;
  /** Also gets the trigger, as a form library's field ref does to focus an invalid field. */
  inputRef?: React.Ref<HTMLButtonElement>;
  /**
   * The variables to pick from, rendered as supplied. A function is called each time the picker
   * opens, never during render.
   */
  variables: VariablePickerItem[] | (() => VariablePickerItem[]);
  disabled?: boolean;
  /** Shown while no variable is bound. Defaults to `strings.variablePlaceholder`. */
  placeholder?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ValueModeStrings>;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/**
 * A value bound to a variable, for an `InputGroup`: the whole control is a picker whose trigger
 * shows the bound reference, and picking a variable replaces it. The panel opens at the box's
 * width, as a grouped combobox's does. Props are picked, not spread: as a registered value-mode
 * control it is handed every `ValueModeControlProps` member.
 */
const VariableValueControl = React.forwardRef<HTMLButtonElement, VariableValueControlProps>(
  (
    {
      id,
      value,
      onChange,
      onBlur,
      inputRef,
      variables,
      disabled,
      placeholder,
      strings,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const text = { ...DEFAULT_VALUE_MODE_STRINGS, ...strings };
    const [open, setOpen] = React.useState(false);
    const [items, setItems] = React.useState<VariablePickerItem[]>(
      typeof variables === 'function' ? [] : variables
    );
    const reference = typeof value === 'string' ? value : '';
    const setRef = React.useMemo(() => composeRefs(ref, inputRef), [ref, inputRef]);

    const changeOpen = (next: boolean) => {
      if (next) setItems(typeof variables === 'function' ? variables() : variables);
      setOpen(next);
    };

    return (
      <Popover open={open} onOpenChange={changeOpen}>
        <InputGroupPopoverTrigger
          ref={setRef}
          id={id}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder ?? text.variablePlaceholder}
          className={className}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
        >
          {reference && <span className="truncate font-mono text-sm">{reference}</span>}
        </InputGroupPopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <VariablePickerContent
            items={items}
            onSelect={(item) => {
              if (item.value) onChange(item.value);
              setOpen(false);
            }}
            placeholder={text.variableSearchPlaceholder}
            emptyText={text.variableEmpty}
          />
        </PopoverContent>
      </Popover>
    );
  }
);
VariableValueControl.displayName = 'VariableValueControl';

export { VariableValueControl };
