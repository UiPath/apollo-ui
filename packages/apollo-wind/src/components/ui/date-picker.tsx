'use client';

import { isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { InputGroupPopoverTrigger } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { type DateLocale, formatLongDate, formatMediumDate } from '@/lib/date-locale';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';
import { type DatePickerStrings, useDateLocale, useDatePickerStrings } from './locale-provider';

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
  /**
   * Language tag or locale for this picker, over the nearest `LocaleProvider`'s.
   * @see LocaleProvider
   */
  locale?: string | DateLocale;
  /** Translations for this picker, over the nearest `LocaleProvider`'s. */
  strings?: Partial<DatePickerStrings>;
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
    placeholder: placeholderProp,
    className,
    locale: localeProp,
    strings: stringsProp,
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
  // Trusts the `Date` type only as far as not throwing: anything else is no value.
  const date = value instanceof Date && isValid(value) ? value : undefined;
  const locale = useDateLocale(localeProp);
  const strings = useDatePickerStrings(stringsProp);
  const placeholder = placeholderProp ?? strings.pickDate;
  const displayValue = date ? formatLongDate(date, locale) : undefined;

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
        : displayValue
          ? strings.selectedDate(displayValue)
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
            {displayValue && <span className="truncate">{displayValue}</span>}
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
              {displayValue ?? <span className="text-foreground-muted">{placeholder}</span>}
            </Button>
          </PopoverTrigger>
        )}
        <PopoverContent className="w-auto p-0" align={grouped ? 'start' : undefined}>
          <Calendar
            mode="single"
            selected={date}
            onSelect={onValueChange}
            initialFocus
            locale={locale}
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
  /**
   * Language tag or locale for this picker, over the nearest `LocaleProvider`'s.
   * @see LocaleProvider
   */
  locale?: string | DateLocale;
  /** Translations for this picker, over the nearest `LocaleProvider`'s. */
  strings?: Partial<DatePickerStrings>;
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
      placeholder: placeholderProp,
      className,
      locale: localeProp,
      strings: stringsProp,
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
    const locale = useDateLocale(localeProp);
    const strings = useDatePickerStrings(stringsProp);
    const placeholder = placeholderProp ?? strings.pickDateRange;
    const from = value?.from ? formatMediumDate(value.from, locale) : undefined;
    const to = value?.to ? formatMediumDate(value.to, locale) : undefined;
    const computedLabel = from
      ? to
        ? strings.selectedRange(from, to)
        : strings.selectedDate(from)
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
              {from && (
                <span className="truncate">
                  {from}
                  {to && ` - ${to}`}
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
                {from ? (
                  to ? (
                    <>
                      {from} - {to}
                    </>
                  ) : (
                    from
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
              locale={locale}
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
