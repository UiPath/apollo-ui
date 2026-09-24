'use client';

import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import type { DatePickerPopoverProps } from '@/components/ui/date-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib';
import { FormFieldError } from './form-field';
import { focusCalendarDay } from './picker-focus';

export interface DateTimePickerProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  use12Hour?: boolean;
  /** Minutes offered by the minute select. Defaults to 5; use 1 for to-the-minute times. */
  minuteStep?: number;
  /**
   * date-fns format for the selected value. Defaults to `PPP 'at' HH:mm`, or
   * `PPP 'at' hh:mm a` with `use12Hour`.
   */
  displayFormat?: string;
  calendarProps?: Omit<
    React.ComponentProps<typeof Calendar>,
    'mode' | 'selected' | 'onSelect' | 'initialFocus'
  >;
  /** Props for the popover. Aligned to the trigger's start by default. */
  popoverProps?: DatePickerPopoverProps;
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
}

const pad = (n: number) => String(n).padStart(2, '0');

// Picking a day keeps the time already chosen, so choosing a date never resets it to midnight.
const withTime = (day: Date, hours: number, minutes: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes);

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(
  function DateTimePicker(
    {
      value,
      onValueChange,
      disabled,
      placeholder = 'Pick a date and time',
      className,
      use12Hour = false,
      minuteStep = 5,
      displayFormat,
      calendarProps,
      popoverProps,
      id,
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
    const baseId = id ?? `datetime-picker-${generatedId.replace(/:/g, '')}`;
    const validationId = errorId ?? `${baseId}-error`;
    const describedBy = [ariaDescribedBy, error ? validationId : undefined]
      .filter(Boolean)
      .join(' ');

    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
    // Held apart from the date so a time can be chosen first and applied once a day is picked.
    const [time, setTime] = React.useState<{ hours: number; minutes: number } | undefined>(
      value ? { hours: value.getHours(), minutes: value.getMinutes() } : undefined
    );

    // Follow the value when the parent changes it, including clearing it.
    const valueTime = value?.getTime();
    React.useEffect(() => {
      const next = valueTime === undefined ? undefined : new Date(valueTime);
      setSelectedDate(next);
      if (next) setTime({ hours: next.getHours(), minutes: next.getMinutes() });
    }, [valueTime]);

    const commit = (next: Date | undefined) => {
      setSelectedDate(next);
      onValueChange?.(next);
    };

    // Commits as you go: the popover stays open on a day click because the time below is part
    // of the same value, and dismissing it keeps what was picked.
    const handleDateSelect = (day: Date | undefined) => {
      if (!day) return;
      commit(withTime(day, time?.hours ?? 0, time?.minutes ?? 0));
    };

    const handleTimeChange = (hours: number, minutes: number) => {
      setTime({ hours, minutes });
      if (selectedDate) commit(withTime(selectedDate, hours, minutes));
    };

    const defaultFormat = use12Hour ? "PPP 'at' hh:mm a" : "PPP 'at' HH:mm";
    const formatted = selectedDate ? format(selectedDate, displayFormat ?? defaultFormat) : null;

    return (
      <>
        <Popover data-slot="datetime-picker" open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              id={id}
              aria-labelledby={ariaLabelledBy}
              aria-describedby={describedBy || undefined}
              aria-errormessage={error ? validationId : ariaErrorMessage}
              aria-invalid={error ? true : ariaInvalid}
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal [&>svg]:text-foreground-muted hover:[&>svg]:text-accent-foreground',
                'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:px-4 future:gap-4 future:text-foreground future:hover:bg-surface-hover future:focus-visible:ring-offset-2 future:focus-visible:ring-offset-background',
                className
              )}
              disabled={disabled}
            >
              <CalendarIcon />
              {formatted ?? <span className="text-foreground-muted">{placeholder}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            aria-label="Choose date and time"
            onOpenAutoFocus={focusCalendarDay}
            {...popoverProps}
            className={cn('w-auto p-0', popoverProps?.className)}
          >
            {/* The popover unmounts when closed, so it reopens on the selected month. */}
            <Calendar
              captionLayout="drilldown"
              defaultMonth={selectedDate}
              initialFocus
              {...calendarProps}
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
            />
            <div className="border-t border-border-subtle px-4 pt-3 pb-4">
              <fieldset className="m-0 min-w-0 border-0 p-0">
                <legend className="mb-2 p-0 text-sm font-medium">Time</legend>
                <TimeSelect
                  hours={time?.hours}
                  minutes={time?.minutes}
                  use12Hour={use12Hour}
                  minuteStep={minuteStep}
                  onChange={handleTimeChange}
                />
              </fieldset>
              <div className="flex justify-end gap-1 pt-3">
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-7"
                  disabled={!selectedDate}
                  onClick={() => {
                    setTime(undefined);
                    commit(undefined);
                    setOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  size="xs"
                  className="h-7"
                  onClick={() => setOpen(false)}
                  disabled={!selectedDate}
                >
                  Done
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <FormFieldError id={validationId}>{error}</FormFieldError>
      </>
    );
  }
);

interface TimeSelectProps {
  hours?: number;
  minutes?: number;
  use12Hour: boolean;
  minuteStep: number;
  onChange: (hours: number, minutes: number) => void;
}

/**
 * Hour and minute as Apollo Selects rather than a native `<input type="time">`, whose popup is
 * the platform's own unstyled columns and cannot be themed. Picking one part seeds the others at
 * zero, so a time is never half set.
 */
function TimeSelect({ hours, minutes, use12Hour, minuteStep, onChange }: TimeSelectProps) {
  const step = Math.min(Math.max(Math.round(minuteStep), 1), 60);
  const minuteOptions = Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step);
  // A value off the step (14:37 with a 5-minute step) stays selectable rather than showing blank.
  if (minutes !== undefined && !minuteOptions.includes(minutes)) {
    minuteOptions.push(minutes);
    minuteOptions.sort((a, b) => a - b);
  }

  const isPm = hours !== undefined && hours >= 12;
  const hourOptions = use12Hour
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : Array.from({ length: 24 }, (_, i) => i);
  const displayHour = hours === undefined ? undefined : use12Hour ? ((hours + 11) % 12) + 1 : hours;

  const to24 = (hour12: number, pm: boolean) => (hour12 % 12) + (pm ? 12 : 0);

  const contentClass = 'max-h-56';
  const triggerClass = 'flex-1 tabular-nums';

  return (
    <div className="flex items-center gap-2">
      <Select
        value={displayHour === undefined ? undefined : String(displayHour)}
        onValueChange={(next) => {
          const hour = Number(next);
          onChange(use12Hour ? to24(hour, isPm) : hour, minutes ?? 0);
        }}
      >
        <SelectTrigger aria-label="Hour" className={triggerClass}>
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {hourOptions.map((hour) => (
            <SelectItem key={hour} value={String(hour)} className="tabular-nums">
              {pad(hour)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span aria-hidden="true" className="shrink-0 text-sm text-foreground-muted">
        :
      </span>
      <Select
        value={minutes === undefined ? undefined : String(minutes)}
        onValueChange={(next) => onChange(hours ?? 0, Number(next))}
      >
        <SelectTrigger aria-label="Minute" className={triggerClass}>
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent className={contentClass}>
          {minuteOptions.map((minute) => (
            <SelectItem key={minute} value={String(minute)} className="tabular-nums">
              {pad(minute)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {use12Hour && (
        <Select
          value={hours === undefined ? undefined : isPm ? 'PM' : 'AM'}
          onValueChange={(next) => onChange(to24(displayHour ?? 12, next === 'PM'), minutes ?? 0)}
        >
          <SelectTrigger aria-label="AM or PM" className={triggerClass}>
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AM">AM</SelectItem>
            <SelectItem value="PM">PM</SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
