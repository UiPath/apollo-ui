import { isValid } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { InputGroupPopoverTrigger } from '@/components/ui/input-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib';
import { type DateLocale, formatDateTime, resolveUse12Hour } from '@/lib/date-locale';
import { FormFieldError } from './form-field';
import { useControlValidation, useInputGroup } from './input-group-context';
import { type DatePickerStrings, useDateLocale, useDatePickerStrings } from './locale-provider';
import { TimeField, type TimeValue } from './time-field';

function timeOf(date: Date | undefined): TimeValue | undefined {
  return date ? { hours: date.getHours(), minutes: date.getMinutes() } : undefined;
}

export interface DateTimePickerProps {
  /** Applied to the trigger button, so a `<label htmlFor>` pointing at it associates correctly. */
  id?: string;
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  /** Called when the picker opens or closes, e.g. to commit the value on close. */
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /**
   * Shows a 12-hour clock with AM/PM. Unset, the clock follows the locale when one is set
   * (here or on a `LocaleProvider`), else 24-hour.
   */
  use12Hour?: boolean;
  /**
   * Language tag or locale for this picker, over the nearest `LocaleProvider`'s.
   * @see LocaleProvider
   */
  locale?: string | DateLocale;
  /** Translations for this picker, over the nearest `LocaleProvider`'s. */
  strings?: Partial<DatePickerStrings>;
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

export const DateTimePicker = React.forwardRef<HTMLButtonElement, DateTimePickerProps>(
  function DateTimePicker(
    {
      value,
      onValueChange,
      onOpenChange,
      disabled,
      placeholder: placeholderProp,
      className,
      use12Hour: use12HourProp,
      locale: localeProp,
      strings: stringsProp,
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
    const [open, setOpenState] = React.useState(false);
    const setOpen = (next: boolean) => {
      setOpenState(next);
      onOpenChange?.(next);
    };
    const generatedId = React.useId();
    const baseId = id ?? `datetime-picker-${generatedId.replace(/:/g, '')}`;
    const validationId = errorId ?? `${baseId}-error`;
    const timeLabelId = `${baseId}-time-label`;
    const locale = useDateLocale(localeProp);
    const strings = useDatePickerStrings(stringsProp);
    const placeholder = placeholderProp ?? strings.pickDateTime;
    // Trusts the `Date` type only as far as not throwing: anything else is no value.
    const date = value instanceof Date && isValid(value) ? value : undefined;
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date);
    // Kept apart from the date so a time entered before any date applies once one is picked.
    const [time, setTime] = React.useState<TimeValue | undefined>(() => timeOf(date));

    // Re-seed when the parent changes the value, compared by time so a fresh Date with the
    // same instant (or our own change echoed back) is not a change.
    const valueTime = date?.getTime();
    const [seededTime, setSeededTime] = React.useState(valueTime);
    if (!Object.is(valueTime, seededTime)) {
      setSeededTime(valueTime);
      setSelectedDate(date);
      setTime(timeOf(date));
    }

    const handleDateSelect = (date: Date | undefined) => {
      if (!date) return;

      // Preserve the time when changing date
      if (selectedDate) {
        date.setHours(selectedDate.getHours());
        date.setMinutes(selectedDate.getMinutes());
        date.setSeconds(selectedDate.getSeconds());
        date.setMilliseconds(selectedDate.getMilliseconds());
      } else if (time) {
        date.setHours(time.hours, time.minutes);
      }

      setSelectedDate(date);
      onValueChange?.(date);
    };

    const handleTimeChange = (next: TimeValue) => {
      setTime(next);

      if (!selectedDate) return;

      const newDate = new Date(selectedDate);
      newDate.setHours(next.hours);
      newDate.setMinutes(next.minutes);

      setSelectedDate(newDate);
      onValueChange?.(newDate);
    };

    const formatDisplayValue = () => {
      // Placeholder is rendered by the caller; this only narrows for formatDateTime().
      if (!selectedDate) return null;
      return formatDateTime(selectedDate, locale, use12HourProp);
    };

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
      'aria-labelledby': ariaLabelledBy,
      ...validation.aria,
      disabled: disabled || group.disabled,
    } as const;

    return (
      <>
        <Popover data-slot="datetime-picker" open={open} onOpenChange={setOpen}>
          {grouped ? (
            <InputGroupPopoverTrigger
              ref={ref}
              {...triggerProps}
              className={className}
              placeholder={placeholder}
            >
              {selectedDate && <span className="truncate">{formatDisplayValue()}</span>}
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
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  formatDisplayValue()
                ) : (
                  <span className="text-foreground-muted">{placeholder}</span>
                )}
              </Button>
            </PopoverTrigger>
          )}
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
                locale={locale}
              />
              <div className="border-t pt-3 space-y-2">
                <div id={timeLabelId} className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  {strings.time}
                </div>
                <TimeField
                  aria-labelledby={timeLabelId}
                  value={time}
                  onValueChange={handleTimeChange}
                  use12Hour={resolveUse12Hour(use12HourProp, locale)}
                  locale={locale}
                  strings={strings}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedDate(undefined);
                    setTime(undefined);
                    onValueChange?.(undefined);
                    setOpen(false);
                  }}
                >
                  {strings.clear}
                </Button>
                <Button className="w-full" onClick={() => setOpen(false)} disabled={!selectedDate}>
                  {strings.done}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* Inside a group, the group renders the message below its box. */}
        {validation.ownMessage && <FormFieldError id={validationId}>{error}</FormFieldError>}
      </>
    );
  }
);
