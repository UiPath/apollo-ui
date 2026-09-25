'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { InputGroupPopoverTrigger } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';

export interface DatePickerProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /**
   * Field-specific feedback rendered immediately below the trigger.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
  /** Id of the element naming this control, forwarded to the trigger button. */
  'aria-labelledby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect' | 'initialFocus'
  >;
}

export const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(function DatePicker(
  {
    id,
    value,
    onValueChange,
    disabled,
    placeholder = 'Pick a date',
    className,
    calendarProps,
    error,
    errorId,
    'aria-labelledby': ariaLabelledBy,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
  },
  ref
) {
  const generatedId = React.useId();
  const validationId = errorId ?? `${id ?? `date-picker-${generatedId.replace(/:/g, '')}`}-error`;

  // Inside an InputGroup the trigger is the group's control: the group draws the box, and the
  // panel anchors to it.
  const group = useInputGroup();
  const grouped = group.inGroup;
  const validation = useControlValidation(group, {
    error,
    errorId: validationId,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
  });
  const triggerProps = {
    id,
    // A consumer label (htmlFor or aria-labelledby) must name the field; the
    // computed aria-label would override it, so only fall back to it when neither exists.
    'aria-label':
      id || ariaLabelledBy
        ? undefined
        : value
          ? `Selected date: ${format(value, 'PPP')}`
          : placeholder,
    'aria-labelledby': ariaLabelledBy,
    ...validation.aria,
    disabled: disabled || group.disabled,
  } as const;

  return (
    <>
      <Popover data-slot="date-picker">
        {grouped ? (
          <InputGroupPopoverTrigger
            ref={ref}
            {...triggerProps}
            className={className}
            placeholder={placeholder}
          >
            {value && <span className="truncate">{format(value, 'PPP')}</span>}
          </InputGroupPopoverTrigger>
        ) : (
          <PopoverTrigger asChild>
            <Button
              {...triggerProps}
              ref={ref}
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal [&>svg]:text-foreground-muted hover:[&>svg]:text-accent-foreground',
                'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:text-foreground future:hover:bg-surface-hover future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
                className
              )}
            >
              <CalendarIcon />
              {value ? (
                format(value, 'PPP')
              ) : (
                <span className="text-foreground-muted">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
        )}
        <PopoverContent className="w-auto p-0" align={grouped ? 'start' : undefined}>
          <Calendar
            mode="single"
            selected={value}
            onSelect={onValueChange}
            initialFocus
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
      {/* Inside a group, the group renders the message below its box. */}
      {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
    </>
  );
});

export interface DateRangePickerProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  value?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /**
   * Field-specific feedback rendered immediately below the trigger.
   * Keep the message focused on what went wrong and how to resolve it.
   */
  error?: React.ReactNode;
  /** Optional id for the inline validation message. */
  errorId?: string;
  /** Id of the element naming this control, forwarded to the trigger button. */
  'aria-labelledby'?: string;
  'aria-invalid'?: React.AriaAttributes['aria-invalid'];
  'aria-describedby'?: string;
  'aria-errormessage'?: string;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    | 'mode'
    | 'selected'
    | 'onSelect'
    | 'initialFocus'
    | 'defaultMonth'
    | 'numberOfMonths'
    | 'required'
  >;
}

export const DateRangePicker = React.forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(
    {
      id,
      value,
      onValueChange,
      disabled,
      placeholder = 'Pick a date range',
      className,
      calendarProps,
      error,
      errorId,
      'aria-labelledby': ariaLabelledBy,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    },
    ref
  ) {
    const generatedId = React.useId();
    const validationId =
      errorId ?? `${id ?? `date-range-picker-${generatedId.replace(/:/g, '')}`}-error`;
    const computedLabel = value?.from
      ? value.to
        ? `Selected range: ${format(value.from, 'LLL dd, y')} to ${format(value.to, 'LLL dd, y')}`
        : `Selected date: ${format(value.from, 'LLL dd, y')}`
      : placeholder;

    // Inside an InputGroup the trigger is the group's control: the group draws the box, and the
    // panel anchors to it.
    const group = useInputGroup();
    const grouped = group.inGroup;
    const validation = useControlValidation(group, {
      error,
      errorId: validationId,
      'aria-invalid': ariaInvalid,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': ariaErrorMessage,
    });
    const triggerProps = {
      id,
      'aria-label': id || ariaLabelledBy ? undefined : computedLabel,
      'aria-labelledby': ariaLabelledBy,
      ...validation.aria,
      disabled: disabled || group.disabled,
    } as const;

    return (
      <>
        <Popover data-slot="date-range-picker">
          {grouped ? (
            <InputGroupPopoverTrigger
              ref={ref}
              {...triggerProps}
              className={className}
              placeholder={placeholder}
            >
              {value?.from && (
                <span className="truncate">
                  {format(value.from, 'LLL dd, y')}
                  {value.to && ` - ${format(value.to, 'LLL dd, y')}`}
                </span>
              )}
            </InputGroupPopoverTrigger>
          ) : (
            <PopoverTrigger asChild>
              <Button
                {...triggerProps}
                ref={ref}
                variant="outline"
                className={cn(
                  'w-[300px] justify-start text-left font-normal [&>svg]:text-foreground-muted hover:[&>svg]:text-accent-foreground',
                  'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:text-foreground future:hover:bg-surface-hover future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
                  className
                )}
              >
                <CalendarIcon />
                {value?.from ? (
                  value.to ? (
                    <>
                      {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(value.from, 'LLL dd, y')
                  )
                ) : (
                  <span className="text-foreground-muted">{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
          )}
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from}
              selected={value}
              onSelect={onValueChange}
              numberOfMonths={2}
              required={false}
              {...calendarProps}
            />
          </PopoverContent>
        </Popover>
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </>
    );
  }
);
