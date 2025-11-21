"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib";

export interface DatePickerProps {
  value?: Date;
  onValueChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value,
  onValueChange,
  disabled,
  placeholder = "Pick a date",
  className,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={value ? `Selected date: ${format(value, "PPP")}` : placeholder}
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {value ? format(value, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={onValueChange} initialFocus />
      </PopoverContent>
    </Popover>
  );
}

export interface DateRangePickerProps {
  value?: DateRange;
  onValueChange?: (range: DateRange | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  value,
  onValueChange,
  disabled,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-label={
            value?.from
              ? value.to
                ? `Selected range: ${format(value.from, "LLL dd, y")} to ${format(value.to, "LLL dd, y")}`
                : `Selected date: ${format(value.from, "LLL dd, y")}`
              : placeholder
          }
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={disabled}
        >
          <CalendarIcon />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "LLL dd, y")} - {format(value.to, "LLL dd, y")}
              </>
            ) : (
              format(value.from, "LLL dd, y")
            )
          ) : (
            <span>{placeholder}</span>
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
        />
      </PopoverContent>
    </Popover>
  );
}
