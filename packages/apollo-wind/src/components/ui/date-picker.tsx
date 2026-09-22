'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';

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
  const describedBy = [ariaDescribedBy, error ? validationId : undefined].filter(Boolean).join(' ');

  return (
    <>
      <Popover data-slot="date-picker">
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            id={id}
            variant="outline"
            // A consumer label (htmlFor or aria-labelledby) must name the field; the
            // computed aria-label would override it, so only fall back to it when neither exists.
            aria-label={
              id || ariaLabelledBy
                ? undefined
                : value
                  ? `Selected date: ${format(value, 'PPP')}`
                  : placeholder
            }
            aria-labelledby={ariaLabelledBy}
            aria-describedby={describedBy || undefined}
            aria-errormessage={error ? validationId : ariaErrorMessage}
            aria-invalid={error ? true : ariaInvalid}
            className={cn(
              'w-full justify-start text-left font-normal [&>svg]:text-foreground-muted hover:[&>svg]:text-accent-foreground',
              'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:text-foreground future:hover:bg-surface-hover future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
              className
            )}
            disabled={disabled}
          >
            <CalendarIcon />
            {value ? (
              format(value, 'PPP')
            ) : (
              <span className="text-foreground-muted">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onValueChange}
            initialFocus
            {...calendarProps}
          />
        </PopoverContent>
      </Popover>
      <FormFieldError id={validationId}>{error}</FormFieldError>
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
    const describedBy = [ariaDescribedBy, error ? validationId : undefined]
      .filter(Boolean)
      .join(' ');
    const computedLabel = value?.from
      ? value.to
        ? `Selected range: ${format(value.from, 'LLL dd, y')} to ${format(value.to, 'LLL dd, y')}`
        : `Selected date: ${format(value.from, 'LLL dd, y')}`
      : placeholder;

    return (
      <>
        <Popover data-slot="date-range-picker">
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={id}
              variant="outline"
              aria-label={id || ariaLabelledBy ? undefined : computedLabel}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={describedBy || undefined}
              aria-errormessage={error ? validationId : ariaErrorMessage}
              aria-invalid={error ? true : ariaInvalid}
              className={cn(
                'w-[300px] justify-start text-left font-normal [&>svg]:text-foreground-muted hover:[&>svg]:text-accent-foreground',
                'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:text-foreground future:hover:bg-surface-hover future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
                className
              )}
              disabled={disabled}
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
        <FormFieldError id={validationId}>{error}</FormFieldError>
      </>
    );
  }
);
