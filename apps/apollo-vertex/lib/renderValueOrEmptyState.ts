import type { DateFormatOptions } from "./constants";
import {
  DEFAULT_DATE_FORMAT_OPTIONS,
  DEFAULT_DATETIME_FORMAT_OPTIONS,
} from "./constants";

const EMPTY_FIELD_VALUE = "—";

export const renderValueOrEmptyState = <T>(
  value: T,
  format?:
    | {
        type: "currency";
        currency: string;
      }
    | {
        type: "date" | "datetime";
        options?: DateFormatOptions;
      }
    | {
        type: "number";
        options?: Intl.NumberFormatOptions;
      },
): string => {
  if (value == null || value === "") {
    return EMPTY_FIELD_VALUE;
  }

  if (format?.type === "currency") {
    return new Intl.NumberFormat(navigator.language, {
      style: "currency",
      currency: format.currency ?? "USD",
    }).format(Number(value));
  }

  if (format?.type === "number") {
    return new Intl.NumberFormat(navigator.language, format.options).format(
      Number(value),
    );
  }

  if (format?.type === "date" || format?.type === "datetime") {
    const defaultOptions =
      format?.type === "date"
        ? DEFAULT_DATE_FORMAT_OPTIONS
        : DEFAULT_DATETIME_FORMAT_OPTIONS;

    const dateValue = value instanceof Date ? value : new Date(String(value));
    return new Intl.DateTimeFormat(
      navigator.language,
      format.options ?? defaultOptions,
    ).format(dateValue);
  }

  return String(value);
};
