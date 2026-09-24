'use client';

import { addMonths, differenceInCalendarMonths, format, max, min, startOfMonth } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';

/**
 * Opening the popover moves focus to the day the calendar offers first (the selected day, else
 * today), rather than to its first control. Radix's own open focus lands on the previous-month
 * chevron and overrides DayPicker's, which left keyboard users a tab stop per caption control
 * away from the grid.
 */
function focusCalendarDay(event: Event) {
  const day = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>(
    '[role="grid"] button[tabindex="0"]'
  );
  if (!day) return;
  event.preventDefault();
  day.focus();
}

/** Positioning and styling for the calendar popover. */
export type DatePickerPopoverProps = Pick<
  React.ComponentPropsWithoutRef<typeof PopoverContent>,
  'align' | 'alignOffset' | 'side' | 'sideOffset' | 'className' | 'container'
>;

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
  /** Props for the popover holding the calendar. Aligned to the trigger's start by default. */
  popoverProps?: DatePickerPopoverProps;
  /** date-fns format for the selected date. Defaults to `PPP` ("September 24th, 2026"). */
  displayFormat?: string;
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
    popoverProps,
    displayFormat = 'PPP',
    error,
    errorId,
    'aria-labelledby': ariaLabelledBy,
    'aria-invalid': ariaInvalid,
    'aria-describedby': ariaDescribedBy,
    'aria-errormessage': ariaErrorMessage,
  },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const validationId = errorId ?? `${id ?? `date-picker-${generatedId.replace(/:/g, '')}`}-error`;
  const describedBy = [ariaDescribedBy, error ? validationId : undefined].filter(Boolean).join(' ');

  return (
    <>
      <Popover data-slot="date-picker" open={open} onOpenChange={setOpen}>
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
                  ? `Selected date: ${format(value, displayFormat)}`
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
              format(value, displayFormat)
            ) : (
              <span className="text-foreground-muted">{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          onOpenAutoFocus={focusCalendarDay}
          {...popoverProps}
          className={cn('w-auto p-0', popoverProps?.className)}
        >
          {/* The popover unmounts when closed, so it reopens on the selected month. */}
          <Calendar
            captionLayout="drilldown"
            defaultMonth={value}
            initialFocus
            {...calendarProps}
            mode="single"
            selected={value}
            onSelect={(date) => {
              onValueChange?.(date);
              // A single date is the whole answer, so picking one closes the popover.
              if (date) setOpen(false);
            }}
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
    | 'month'
    | 'onMonthChange'
    | 'numberOfMonths'
    | 'required'
  >;
  /** Props for the popover holding the calendar. Aligned to the trigger's start by default. */
  popoverProps?: DatePickerPopoverProps;
  /** date-fns format for each end of the range. Defaults to `LLL dd, y` ("Sep 24, 2026"). */
  displayFormat?: string;
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
      popoverProps,
      displayFormat = 'LLL dd, y',
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
        ? `Selected range: ${format(value.from, displayFormat)} to ${format(value.to, displayFormat)}`
        : `Selected date: ${format(value.from, displayFormat)}`
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
                    {format(value.from, displayFormat)} - {format(value.to, displayFormat)}
                  </>
                ) : (
                  format(value.from, displayFormat)
                )
              ) : (
                <span className="text-foreground-muted">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            onOpenAutoFocus={focusCalendarDay}
            {...popoverProps}
            className={cn('w-auto p-0', popoverProps?.className)}
          >
            <RangeCalendars
              value={value}
              onValueChange={onValueChange}
              calendarProps={calendarProps}
            />
          </PopoverContent>
        </Popover>
        <FormFieldError id={validationId}>{error}</FormFieldError>
      </>
    );
  }
);

/**
 * The months the range calendars open on, inside `startMonth`/`endMonth`: the left on the start,
 * the right on the end when it falls in a later month, else the month after the left. The left
 * stops a month short of `endMonth` so both fit, unless the bounds cover a single month.
 */
function initialRangeMonths(value: DateRange | undefined, startMonth?: Date, endMonth?: Date) {
  const lo = startMonth ? startOfMonth(startMonth) : undefined;
  const hi = endMonth ? startOfMonth(endMonth) : undefined;
  const clamp = (date: Date) => {
    const month = startOfMonth(date);
    if (lo && month < lo) return lo;
    if (hi && month > hi) return hi;
    return month;
  };

  let left = clamp(value?.from ?? new Date());
  const roomForTwo = !(lo && hi) || differenceInCalendarMonths(hi, lo) >= 1;
  if (hi && roomForTwo && differenceInCalendarMonths(hi, left) < 1) left = addMonths(hi, -1);
  const to = value?.to ? clamp(value.to) : undefined;
  const right = to && differenceInCalendarMonths(to, left) > 0 ? to : addMonths(left, 1);
  return { left, right };
}

/**
 * The range picker's two months, each with its own navigation, so the start and the end can be
 * browsed separately rather than as one two-month window. They share one selection, and the
 * right month always stays after the left one.
 */
function RangeCalendars({
  value,
  onValueChange,
  calendarProps,
}: Pick<DateRangePickerProps, 'value' | 'onValueChange' | 'calendarProps'>) {
  // The popover unmounts when closed, so these re-seed from the value on every open: the left
  // month on the start, the right on the end when it falls in a later month.
  const { startMonth, endMonth, className, ...rest } = calendarProps ?? {};
  const [initial] = React.useState(() => initialRangeMonths(value, startMonth, endMonth));
  const [left, setLeft] = React.useState(initial.left);
  const [right, setRight] = React.useState(initial.right);

  const leftEnd = endMonth ? min([addMonths(right, -1), endMonth]) : addMonths(right, -1);
  const rightStart = startMonth ? max([addMonths(left, 1), startMonth]) : addMonths(left, 1);

  const shared = {
    captionLayout: 'drilldown' as const,
    // Neighbouring months' days would repeat the other calendar's, range band included.
    showOutsideDays: false,
    ...rest,
    // One month per calendar: the pair is the two-month view.
    numberOfMonths: 1,
    mode: 'range' as const,
    selected: value,
    onSelect: onValueChange,
    required: false as const,
  };

  return (
    <div data-slot="range-calendars" className="flex flex-col md:flex-row">
      <Calendar
        initialFocus
        {...shared}
        className={className}
        month={left}
        onMonthChange={setLeft}
        startMonth={startMonth}
        endMonth={leftEnd}
      />
      <Calendar
        {...shared}
        className={cn('border-border-subtle max-md:border-t md:border-l', className)}
        month={right}
        onMonthChange={setRight}
        startMonth={rightStart}
        endMonth={endMonth}
      />
    </div>
  );
}
