'use client';

import {
  addMonths,
  differenceInCalendarMonths,
  endOfMonth,
  format,
  max,
  min,
  startOfMonth,
} from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar, PlainRoot } from '@/components/ui/calendar';
import { InputGroupPopoverTrigger } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';
import { focusCalendarDay } from './picker-focus';

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
          ? `Selected date: ${format(value, displayFormat)}`
          : placeholder,
    'aria-labelledby': ariaLabelledBy,
    ...validation.aria,
    disabled: disabled || group.disabled,
  } as const;

  return (
    <>
      <Popover data-slot="date-picker" open={open} onOpenChange={setOpen}>
        {grouped ? (
          <InputGroupPopoverTrigger
            ref={ref}
            {...triggerProps}
            className={className}
            placeholder={placeholder}
          >
            {value && <span className="truncate">{format(value, displayFormat)}</span>}
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
                format(value, displayFormat)
              ) : (
                <span className="text-foreground-muted">{placeholder}</span>
              )}
            </Button>
          </PopoverTrigger>
        )}
        <PopoverContent
          align="start"
          aria-label="Choose date"
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
    | 'month'
    | 'onMonthChange'
    | 'numberOfMonths'
    | 'required'
  > & {
    /**
     * @deprecated The range picker opens on the selected range by itself. Pass this to open the
     * left (start) calendar on a month other than the range start; it is not controlled, and the
     * right calendar opens on the month after it unless the range ends later. A controlled
     * `month` takes precedence.
     */
    defaultMonth?: Date;
    /**
     * @deprecated The range picker now shows two independently navigable months. Pass this to
     * control the left (start) month; the right month stays after it and pages on its own. Let
     * the picker open on the selected range instead, or bound it with `startMonth`/`endMonth`.
     */
    month?: Date;
    /**
     * @deprecated Called with the first of the month when the reader moves the left (start)
     * calendar, by paging or through its drilldown caption. The right calendar does not report,
     * and neither does a change to a controlled `month`.
     */
    onMonthChange?: (month: Date) => void;
  };
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
    const computedLabel = value?.from
      ? value.to
        ? `Selected range: ${format(value.from, displayFormat)} to ${format(value.to, displayFormat)}`
        : `Selected date: ${format(value.from, displayFormat)}`
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
                  {format(value.from, displayFormat)}
                  {value.to && ` - ${format(value.to, displayFormat)}`}
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
          )}
          <PopoverContent
            align="start"
            aria-label="Choose date range"
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
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
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
  // Bounds covering a single month leave room for one calendar only.
  if (!roomForTwo) return { left, right: left, single: true };
  if (hi && roomForTwo && differenceInCalendarMonths(hi, left) < 1) left = addMonths(hi, -1);
  const to = value?.to ? clamp(value.to) : undefined;
  const right = to && differenceInCalendarMonths(to, left) > 0 ? to : addMonths(left, 1);
  return { left, right, single: false };
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
  const {
    startMonth,
    endMonth,
    className,
    style,
    classNames,
    styles,
    month: monthProp,
    defaultMonth,
    onMonthChange,
    footer,
    id,
    title,
    role,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    ...rest
  } = calendarProps ?? {};
  // The popover unmounts when closed, so these re-seed from the value on every open: the left
  // month on the start, the right on the end when it falls in a later month. The deprecated
  // `month`, else `defaultMonth`, stands in for the start, as each set the first of the old two
  // months over the value.
  const [fitted, setFitted] = React.useState(() =>
    initialRangeMonths(
      { from: monthProp ?? defaultMonth ?? value?.from, to: value?.to },
      startMonth,
      endMonth
    )
  );
  const [leftState, setLeftState] = React.useState(fitted.left);
  const [rightState, setRight] = React.useState(fitted.right);
  // New bounds while open re-fit the months shown, and switch between one calendar and two, from
  // where the reader is. Unchanged bounds leave their navigation alone.
  const boundsKey = `${startMonth?.getTime()}:${endMonth?.getTime()}`;
  const [fittedBounds, setFittedBounds] = React.useState(boundsKey);
  if (boundsKey !== fittedBounds) {
    const refit = initialRangeMonths({ from: leftState, to: rightState }, startMonth, endMonth);
    setFittedBounds(boundsKey);
    setFitted(refit);
    setLeftState(refit.left);
    setRight(refit.right);
  }
  // A controlled `month` drives the left month, as it drove the first month of the old
  // two-month view. If it moves the left onto or past the right, the right follows it. It stays
  // inside the bounds, short of `endMonth` in a pair so the right month has room after it.
  const leftMax = endMonth && (fitted.single ? endMonth : addMonths(endMonth, -1));
  const left = monthProp
    ? startOfMonth(
        min([max([monthProp, startMonth ?? monthProp]), leftMax ? endOfMonth(leftMax) : monthProp])
      )
    : leftState;
  const right =
    differenceInCalendarMonths(rightState, left) > 0 || fitted.single
      ? rightState
      : addMonths(left, 1);
  const setLeft = (month: Date) => {
    setLeftState(month);
    onMonthChange?.(month);
  };

  // A lone calendar has only the bounds to respect; a pair keeps the left before the right.
  const leftEnd = fitted.single
    ? endMonth
    : endMonth
      ? min([addMonths(right, -1), endMonth])
      : addMonths(right, -1);
  const rightStart = startMonth ? max([addMonths(left, 1), startMonth]) : addMonths(left, 1);

  // A custom `components.Root` renders the pair's root once, rather than one per calendar.
  const { Root = PlainRoot, ...calendarComponents } = rest.components ?? {};
  const Footer = calendarComponents.Footer ?? 'div';
  // Root classes and styles style the pair as a whole, as they styled the one two-month root.
  const { root: rootClassName, ...calendarClassNames } = classNames ?? {};
  const { root: rootStyle, ...calendarStyles } = styles ?? {};

  const shared = {
    captionLayout: 'drilldown' as const,
    // Neighbouring months' days would repeat the other calendar's, range band included.
    showOutsideDays: false,
    ...rest,
    classNames: calendarClassNames,
    styles: calendarStyles,
    components: calendarComponents,
    // One month per calendar: the pair is the two-month view.
    numberOfMonths: 1,
    mode: 'range' as const,
    selected: value,
    onSelect: onValueChange,
    required: false as const,
  };

  return (
    // DayPicker renders these on its root, so passing them to both calendars would repeat the
    // footer (a live region, with any ids inside it), the root's id and name, and the consumer's
    // root component, classes and styles. The pair takes them once instead. A name needs a role
    // to apply, so a named pair is a group.
    <Root
      data-slot="range-calendars"
      className={cn(rootClassName, className)}
      style={{ ...rootStyle, ...style }}
      id={id}
      title={title}
      role={role ?? (ariaLabel || ariaLabelledBy ? 'group' : undefined)}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {/* The pair follows the calendars' direction, so the start month sits on the right in RTL. */}
      <div dir={rest.dir} className="flex flex-col md:flex-row">
        <Calendar
          initialFocus
          {...shared}
          month={left}
          onMonthChange={setLeft}
          startMonth={startMonth}
          endMonth={leftEnd}
        />
        {!fitted.single && (
          <Calendar
            {...shared}
            className="border-border-subtle max-md:border-t md:border-s"
            month={right}
            onMonthChange={setRight}
            startMonth={rightStart}
            endMonth={endMonth}
          />
        )}
      </div>
      {footer && (
        // The same live region DayPicker renders its footer in, through a custom
        // `components.Footer` when one is given.
        <Footer
          data-slot="range-calendars-footer"
          role="status"
          aria-live="polite"
          className={cn('px-4 pb-4 text-sm', classNames?.footer)}
          style={styles?.footer}
        >
          {footer}
        </Footer>
      )}
    </Root>
  );
}
