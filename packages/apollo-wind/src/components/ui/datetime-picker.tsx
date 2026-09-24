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
import { TimeZoneSelect } from './timezone-select';
import {
  dateToZonedWallClock,
  formatOffset,
  localZone,
  type WallClock,
  zonedWallClockToDate,
  zoneOffsetMinutes,
} from './timezones';

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
   * Show a timezone select under the time. The date and time are then read in the chosen zone,
   * so 14:00 in Europe/Bucharest commits the instant 11:00Z in summer, and the trigger names the
   * offset. Changing the zone keeps the date and time on screen and moves the instant.
   */
  showTimeZone?: boolean;
  /** IANA zone the date and time are read in, when the parent tracks it. */
  timeZone?: string;
  /** Initial zone when `timeZone` is not controlled. Defaults to the browser's zone. */
  defaultTimeZone?: string;
  onTimeZoneChange?: (timeZone: string) => void;
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

// A wall clock as a local Date, for the calendar and date-fns. Only its parts are read back, so
// the machine's own offset never enters the arithmetic.
const localDateOf = ({ year, month, day, hours, minutes }: WallClock) =>
  new Date(year, month, day, hours, minutes);

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
      showTimeZone = false,
      timeZone,
      defaultTimeZone,
      onTimeZoneChange,
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

    // Without a zone in play this is the browser's, where the conversions below match plain
    // local Date arithmetic.
    const [ownZone, setOwnZone] = React.useState(() => defaultTimeZone ?? localZone());
    const zone = timeZone ?? ownZone;
    const zoneShown = showTimeZone || timeZone !== undefined;
    const timeZoneLabelId = `${baseId}-timezone-label`;
    const timeZoneTriggerId = `${baseId}-timezone`;

    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
    // The time is held apart from the date so it can be chosen first and applied once a day is
    // picked, and it is the wall-clock time in the zone, not the instant's local reading.
    // A time picked before any day, held until a day is picked. Once there is a date, the time
    // shown is read from it in the zone, so it cannot fall out of step with the value.
    const [pendingTime, setPendingTime] = React.useState<
      { hours: number; minutes: number } | undefined
    >(undefined);

    // Follow the value only when the parent changes it, including clearing it. Keyed on the value
    // alone: a zone change must not reset an uncontrolled picker's own selection.
    const valueTime = value?.getTime();
    React.useEffect(() => {
      setSelectedDate(valueTime === undefined ? undefined : new Date(valueTime));
      if (valueTime === undefined) setPendingTime(undefined);
    }, [valueTime]);

    const wallClock = selectedDate ? dateToZonedWallClock(selectedDate, zone) : undefined;
    const time = wallClock ? { hours: wallClock.hours, minutes: wallClock.minutes } : pendingTime;
    const calendarDate = wallClock
      ? new Date(wallClock.year, wallClock.month, wallClock.day)
      : undefined;

    // Every change is committed through here, so no path stores a time without the zone applied.
    const commitWallClock = (
      day: { year: number; month: number; day: number },
      hours: number,
      minutes: number,
      inZone: string
    ) => {
      const next = zonedWallClockToDate({ ...day, hours, minutes }, inZone);
      setSelectedDate(next);
      onValueChange?.(next);
    };

    // Commits as you go: the popover stays open on a day click because the time below is part
    // of the same value, and dismissing it keeps what was picked. Picking a day keeps the time
    // already chosen, so choosing a date never resets it to midnight.
    const handleDateSelect = (day: Date | undefined) => {
      if (!day) return;
      commitWallClock(
        { year: day.getFullYear(), month: day.getMonth(), day: day.getDate() },
        time?.hours ?? 0,
        time?.minutes ?? 0,
        zone
      );
    };

    const handleTimeChange = (hours: number, minutes: number) => {
      if (wallClock) commitWallClock(wallClock, hours, minutes, zone);
      else setPendingTime({ hours, minutes });
    };

    // The reader said "2pm" and then said which 2pm they meant, so the numbers stay and the
    // instant moves. Re-reading the instant in the new zone would change the time under them.
    const handleTimeZoneChange = (next: string) => {
      if (timeZone === undefined) setOwnZone(next);
      onTimeZoneChange?.(next);
      if (wallClock) commitWallClock(wallClock, wallClock.hours, wallClock.minutes, next);
    };

    const clear = () => {
      setPendingTime(undefined);
      setSelectedDate(undefined);
      onValueChange?.(undefined);
      setOpen(false);
    };

    const defaultFormat = use12Hour ? "PPP 'at' hh:mm a" : "PPP 'at' HH:mm";
    // Without the offset there is no telling which 14:00 is meant.
    const offsetSuffix =
      zoneShown && selectedDate ? ` ${formatOffset(zoneOffsetMinutes(zone, selectedDate))}` : '';
    const formatted = wallClock
      ? `${format(localDateOf(wallClock), displayFormat ?? defaultFormat)}${offsetSuffix}`
      : null;

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
              defaultMonth={calendarDate}
              initialFocus
              {...calendarProps}
              mode="single"
              selected={calendarDate}
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
              {showTimeZone && (
                <div className="mt-3">
                  <span id={timeZoneLabelId} className="mb-2 block text-sm font-medium">
                    Timezone
                  </span>
                  <TimeZoneSelect
                    id={timeZoneTriggerId}
                    aria-labelledby={`${timeZoneLabelId} ${timeZoneTriggerId}`}
                    value={zone}
                    onChange={handleTimeZoneChange}
                    at={selectedDate}
                  />
                </div>
              )}
              <div className="flex justify-end gap-1 pt-3">
                <Button
                  variant="ghost"
                  size="xs"
                  className="h-7"
                  disabled={!selectedDate}
                  onClick={clear}
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
