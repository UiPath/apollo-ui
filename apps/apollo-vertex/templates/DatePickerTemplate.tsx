"use client";
import { useState } from "react";
import { DatePicker } from "@/registry/date-picker/date-picker";
import { LocaleProvider } from "@/registry/shell/shell-locale-provider";

export function DatePickerTemplate() {
  const [date, setDate] = useState<Date>();
  return (
    <LocaleProvider>
      <DatePicker value={date} onValueChanged={setDate} />
    </LocaleProvider>
  );
}
