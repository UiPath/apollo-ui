import * as React from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib';

export interface DateTimePickerProps {
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  use12Hour?: boolean;
}

export function DateTimePicker({
  value,
  onValueChange,
  disabled,
  placeholder = 'Pick a date and time',
  className,
  use12Hour = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value);
  const [timeValue, setTimeValue] = React.useState<string>(
    value ? format(value, use12Hour ? 'hh:mm a' : 'HH:mm') : ''
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Preserve the time when changing date
    if (selectedDate) {
      date.setHours(selectedDate.getHours());
      date.setMinutes(selectedDate.getMinutes());
      date.setSeconds(selectedDate.getSeconds());
    }

    setSelectedDate(date);
    onValueChange?.(date);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTimeValue(time);

    if (!selectedDate) return;

    const [hours, minutes] = time.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);

    setSelectedDate(newDate);
    onValueChange?.(newDate);
  };

  const formatDisplayValue = () => {
    if (!selectedDate) return placeholder;
    const datePart = format(selectedDate, 'PPP');
    const timePart = format(selectedDate, use12Hour ? 'hh:mm a' : 'HH:mm');
    return `${datePart} at ${timePart}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDisplayValue()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-t pt-3 space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </Label>
            <Input type="time" value={timeValue} onChange={handleTimeChange} className="w-full" />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedDate(undefined);
                setTimeValue('');
                onValueChange?.(undefined);
                setOpen(false);
              }}
            >
              Clear
            </Button>
            <Button className="w-full" onClick={() => setOpen(false)} disabled={!selectedDate}>
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
