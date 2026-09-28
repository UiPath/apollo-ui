import { DateTime } from "luxon";
import { isDateOnly } from "./is-date-only";

export interface OverrideTimeOptions {
  year?: "numeric";
  month?: "short" | "long";
  day?: "numeric";
  hour?: "numeric" | "2-digit";
  minute?: "numeric" | "2-digit";
  second?: "2-digit";
  hourCycle?: "h23" | "h12";
  timeStyle?: "short";
  weekday?: "long" | "short";
  fractionalSecondDigits?: 3 | undefined;
  hideEmptyTime?: boolean;
}

const commonOptions: OverrideTimeOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  fractionalSecondDigits: 3,
};

const applicationDataOptions: OverrideTimeOptions = {
  ...commonOptions,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
};

export const formatDate = (
  locale: Intl.LocalesArgument,
  value: string | DateTime,
  options?: OverrideTimeOptions,
) => {
  const formatOptions = options ?? applicationDataOptions;

  const date = value instanceof DateTime ? value : DateTime.fromISO(value);

  const hasHiddenTime = options?.hideEmptyTime && isDateOnly(date);

  const hasMs = date.millisecond !== 0;
  const resultingOptions: OverrideTimeOptions = { ...formatOptions };
  if (!hasMs) delete resultingOptions.fractionalSecondDigits;
  if (hasHiddenTime) {
    delete resultingOptions.hour;
    delete resultingOptions.minute;
    delete resultingOptions.second;
  }

  return Intl.DateTimeFormat(locale, {
    ...resultingOptions,
    timeZone: "UTC",
  }).format(date.toJSDate());
};
