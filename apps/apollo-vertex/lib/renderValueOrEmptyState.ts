import {
  type BaseFormatOptions,
  formatCurrency,
  formatDate,
  formatNumber,
  type OverrideTimeOptions,
} from "@uipath/data-formatting";
import { assertDateOrString } from "./asserts/assertDateOrString";
import { assertNumber } from "./asserts/assertNumber";
import { assertString } from "./asserts/assertString";
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
        options?: OverrideTimeOptions;
      }
    | {
        type: "number";
        options?: BaseFormatOptions;
      },
): string => {
  if (value == null || value === "") {
    return EMPTY_FIELD_VALUE;
  }

  if (format?.type === "currency") {
    return formatCurrency(
      navigator.language,
      assertNumber(value, "Invalid number value"),
      {
        currency: format.currency ?? "USD",
      },
    );
  }

  if (format?.type === "number") {
    return formatNumber(
      navigator.language,
      assertNumber(value, "Invalid number value"),
      format.options,
    );
  }

  if (format?.type === "date" || format?.type === "datetime") {
    const defaultOptions =
      format?.type === "date"
        ? DEFAULT_DATE_FORMAT_OPTIONS
        : DEFAULT_DATETIME_FORMAT_OPTIONS;

    return formatDate(
      navigator.language,
      assertDateOrString(value, "Invalid date value"),
      format.options ?? defaultOptions,
    );
  }

  return assertString(value.toString(), "Invalid string value");
};
