"use client";
import { useState } from "react";
import { DatePicker } from "@uipath/apollo-vertex";
import { LocaleProvider } from "@uipath/apollo-vertex/shell";

export function DatePickerTemplate() {
  const [date, setDate] = useState<Date>();
  return (
    <LocaleProvider>
      <DatePicker value={date} onValueChanged={setDate} />
    </LocaleProvider>
  );
}
