'use client';

import { format } from 'date-fns';
import * as React from 'react';
import { cn } from '@/lib';
import { type DateLocale, localeTimePattern } from '@/lib/date-locale';
import type { DatePickerStrings } from './locale-provider';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

export interface TimeValue {
  /** 0 to 23, whatever the clock shown. */
  hours: number;
  minutes: number;
}

/**
 * Where the day period sits and what separates hours from minutes, read from the locale's short
 * time pattern: Korean and Chinese put the period first ("오후 2:30"), most languages after.
 */
function timeLayout(locale: DateLocale | undefined, use12Hour: boolean) {
  const pattern = localeTimePattern(locale) ?? '';
  const bare = pattern.replace(/'[^']*'/g, '');
  const hourAt = bare.search(/[hHkK]/);
  const periodAt = bare.search(/[aBb]/);
  const separator = /[hHkK]+([^hHkKm]*)m/.exec(pattern)?.[1].replace(/'/g, '').trim() || ':';
  return { periodFirst: use12Hour && periodAt !== -1 && periodAt < hourAt, separator };
}

interface TimeSegmentProps {
  value: number | undefined;
  min: number;
  max: number;
  label: string;
  disabled?: boolean;
  onCommit: (value: number) => void;
  /** Called once no further digit could follow, to move on to the next segment. */
  onFilled?: () => void;
}

/** Two typed digits that also step with the arrow keys, wrapping at either end. */
const TimeSegment = React.forwardRef<HTMLInputElement, TimeSegmentProps>(function TimeSegment(
  { value, min, max, label, disabled, onCommit, onFilled },
  ref
) {
  // Digits typed since the segment took focus; the committed value shows, padded, once it leaves.
  const [draft, setDraft] = React.useState<string | null>(null);
  const text = draft ?? (value === undefined ? '' : String(value).padStart(2, '0'));

  const enter = (digits: string) => {
    setDraft(digits);
    if (!digits) return;
    const typed = Number(digits);
    if (typed >= min && typed <= max) onCommit(typed);
    else if (digits.length === 2) onCommit(Math.min(Math.max(typed, min), max));
    if (digits.length === 2 || typed * 10 > max) onFilled?.();
  };

  const step = (delta: number) => {
    const span = max - min + 1;
    const from = value ?? (delta > 0 ? min - 1 : max + 1);
    setDraft(null);
    onCommit(((((from - min + delta) % span) + span) % span) + min);
  };

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      role="spinbutton"
      autoComplete="off"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      placeholder="--"
      disabled={disabled}
      value={text}
      onBlur={() => setDraft(null)}
      // Keys are read here so a fresh focus always starts over, wherever the caret landed.
      onKeyDown={(e) => {
        if (/^\d$/.test(e.key)) {
          e.preventDefault();
          const next = (draft ?? '') + e.key;
          enter(next.length > 2 ? e.key : next);
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          step(e.key === 'ArrowUp' ? 1 : -1);
        }
      }}
      // Paste, deletion and virtual keyboards that send no key arrive as a change instead.
      onChange={(e) => enter(e.target.value.replace(/\D/g, '').slice(-2))}
      className="w-[2.5ch] rounded-sm bg-transparent text-center tabular-nums caret-transparent outline-none placeholder:text-muted-foreground focus:bg-accent focus:text-accent-foreground disabled:cursor-not-allowed"
    />
  );
});

export interface TimeFieldProps {
  value: TimeValue | undefined;
  onValueChange: (value: TimeValue) => void;
  use12Hour: boolean;
  /** Supplies the AM/PM words and the segment order. English when unset. */
  locale?: DateLocale;
  strings: Pick<DatePickerStrings, 'hours' | 'minutes' | 'dayPeriod'>;
  /** Id of the element naming the whole field. */
  'aria-labelledby'?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Hours and minutes typed as separate segments, with an AM/PM choice on a 12-hour clock. Unlike
 * a native time input it follows the given locale, not the browser's or the OS's settings.
 */
export function TimeField({
  value,
  onValueChange,
  use12Hour,
  locale,
  strings,
  'aria-labelledby': ariaLabelledBy,
  disabled,
  className,
}: TimeFieldProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const { periodFirst, separator } = timeLayout(locale, use12Hour);
  const hours = value?.hours;
  // The period chosen before any hour is typed, applied once one is.
  const [pendingPm, setPendingPm] = React.useState(false);
  const pm = hours === undefined ? pendingPm : hours >= 12;

  const commit = (next: Partial<TimeValue>) =>
    onValueChange({
      hours: next.hours ?? hours ?? (use12Hour && pm ? 12 : 0),
      minutes: next.minutes ?? value?.minutes ?? 0,
    });

  const setPm = (nextPm: boolean) => {
    setPendingPm(nextPm);
    if (hours !== undefined) commit({ hours: (hours % 12) + (nextPm ? 12 : 0) });
  };

  const period = use12Hour && (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      aria-label={strings.dayPeriod}
      value={pm ? 'pm' : 'am'}
      onValueChange={(next) => next && setPm(next === 'pm')}
      disabled={disabled}
    >
      <ToggleGroupItem value="am" className="future:h-10">
        {format(new Date(2000, 0, 1, 9), 'a', { locale })}
      </ToggleGroupItem>
      <ToggleGroupItem value="pm" className="future:h-10">
        {format(new Date(2000, 0, 1, 21), 'a', { locale })}
      </ToggleGroupItem>
    </ToggleGroup>
  );

  return (
    <fieldset
      aria-labelledby={ariaLabelledBy}
      data-slot="time-field"
      className={cn('m-0 flex min-w-0 items-center gap-2 border-0 p-0', className)}
    >
      {periodFirst && period}
      <div
        className={cn(
          'flex h-9 flex-1 items-center gap-0.5 rounded-md border border-input bg-transparent px-3 text-base transition-colors focus-within:ring-2 focus-within:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50 md:text-sm',
          'future:h-10 future:rounded-xl future:border-0 future:bg-surface-overlay future:text-sm future:focus-within:ring-primary future:focus-within:ring-offset-2 future:focus-within:ring-offset-background'
        )}
      >
        {use12Hour ? (
          <TimeSegment
            label={strings.hours}
            value={hours === undefined ? undefined : hours % 12 || 12}
            min={1}
            max={12}
            disabled={disabled}
            onCommit={(shown) => commit({ hours: (shown % 12) + (pm ? 12 : 0) })}
            onFilled={() => minuteRef.current?.focus()}
          />
        ) : (
          <TimeSegment
            label={strings.hours}
            value={hours}
            min={0}
            max={23}
            disabled={disabled}
            onCommit={(next) => commit({ hours: next })}
            onFilled={() => minuteRef.current?.focus()}
          />
        )}
        <span aria-hidden="true" className="text-muted-foreground">
          {separator}
        </span>
        <TimeSegment
          ref={minuteRef}
          label={strings.minutes}
          value={value?.minutes}
          min={0}
          max={59}
          disabled={disabled}
          onCommit={(minutes) => commit({ minutes })}
        />
      </div>
      {!periodFirst && period}
    </fieldset>
  );
}
