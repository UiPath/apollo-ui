"use client";

import { DateTime } from "luxon";
import { ChevronDownIcon } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date;
  onValueChanged: (date?: Date) => void;
}

export function DatePicker({ value, onValueChanged }: DatePickerProps) {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className="data-[empty=true]:text-muted-foreground w-[212px] justify-between text-left font-normal"
        >
          {value ? (
            DateTime.fromJSDate(value).toLocaleString(DateTime.DATE_FULL)
          ) : (
            <span>{t("pick_a_date")}</span>
          )}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onValueChanged}
          defaultMonth={value}
        />
      </PopoverContent>
    </Popover>
  );
}
