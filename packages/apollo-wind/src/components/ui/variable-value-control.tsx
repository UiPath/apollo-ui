import { Variable } from 'lucide-react';
import * as React from 'react';
import { joinIds } from '@/components/forms/aria-ids';
import {
  DEFAULT_VALUE_MODE_STRINGS,
  type ValueModeStrings,
} from '@/components/ui/field-addons/value-mode-strings';
import { InputGroupPopoverTrigger } from '@/components/ui/input-group';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { ReferenceChip } from '@/components/ui/reference-chip';
import {
  type RenderVariablePicker,
  VariablePickerContent,
  type VariablePickerItem,
} from '@/components/ui/variable-picker';
import { VariablePickerSlot } from '@/components/ui/variable-picker/variable-picker';
import { composeRefs } from '@/lib';

// Shared, so an omitted `variables` keeps the callbacks that read it stable.
const NO_VARIABLES: VariablePickerItem[] = [];

/** How a bound reference is shown: the host's display name and type icon for it. */
export interface VariableReferenceDescription {
  label: React.ReactNode;
  /** Defaults to the generic variable icon. */
  icon?: React.ReactNode;
}

interface VariableValueControlBaseProps {
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
   * Describes the bound reference for its chip and the trigger's text. Returning nothing shows the
   * reference as it is stored.
   */
  describeReference?: (reference: string) => VariableReferenceDescription | undefined;
  disabled?: boolean;
  /** Shown while no variable is bound. Defaults to `strings.variablePlaceholder`. */
  placeholder?: string;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ValueModeStrings>;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** The value-mode wiring; its `aria-describedby` joins the control's own. */
  controlProps?: { 'aria-describedby'?: string };
}

export type VariableValueControlProps = VariableValueControlBaseProps &
  (
    | {
        /**
         * The variables to pick from, rendered as supplied. A function is called each time the
         * picker opens, never during render.
         */
        variables: VariablePickerItem[] | (() => VariablePickerItem[]);
        renderPicker?: undefined;
      }
    | {
        /** Ignored while `renderPicker` is set. */
        variables?: VariablePickerItem[] | (() => VariablePickerItem[]);
        /**
         * The host's own picker, rendered in the panel in place of the built-in one and handed the
         * bound reference as `value`.
         */
        renderPicker: RenderVariablePicker;
      }
  );

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
      variables = NO_VARIABLES,
      renderPicker,
      describeReference,
      disabled,
      placeholder,
      strings,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      controlProps,
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

    const described = React.useMemo(
      () => (reference && describeReference ? describeReference(reference) : undefined),
      [reference, describeReference]
    );

    const changeOpen = React.useCallback(
      (next: boolean) => {
        if (next && !renderPicker) {
          setItems(typeof variables === 'function' ? variables() : variables);
        }
        setOpen(next);
      },
      [renderPicker, variables]
    );
    const close = React.useCallback(() => setOpen(false), []);
    const commit = React.useCallback(
      (next: string) => {
        if (next) onChange(next);
        setOpen(false);
      },
      [onChange]
    );
    const select = React.useCallback(
      (item: VariablePickerItem) => commit(item.value ?? ''),
      [commit]
    );

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
          aria-describedby={joinIds(ariaDescribedBy, controlProps?.['aria-describedby'])}
        >
          {reference && (
            <ReferenceChip
              label={described?.label ?? reference}
              icon={described?.icon ?? <Variable />}
            />
          )}
        </InputGroupPopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          {renderPicker ? (
            <VariablePickerSlot
              render={renderPicker}
              value={reference || undefined}
              onSelect={commit}
              close={close}
            />
          ) : (
            <VariablePickerContent
              items={items}
              onSelect={select}
              placeholder={text.variableSearchPlaceholder}
              emptyText={text.variableEmpty}
            />
          )}
        </PopoverContent>
      </Popover>
    );
  }
);
VariableValueControl.displayName = 'VariableValueControl';

export { VariableValueControl };
