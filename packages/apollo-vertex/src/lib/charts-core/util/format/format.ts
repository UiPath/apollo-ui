import { Duration } from "luxon";
import { assert } from "@/lib/asserts/assert";
import { assertBoolean } from "@/lib/asserts/assert-boolean";
import { assertDateTimeOrString } from "@/lib/asserts/assert-date-time-or-string";
import { assertNumber } from "@/lib/asserts/assert-number";
import type { BaseFormatOptions } from "./base-format-options";
import { NULL_STRING } from "./constants";
import { type FormatBooleanOptions, formatBoolean } from "./format-boolean";
import { type FormatCurrencyOptions, formatCurrency } from "./format-currency";
import { formatDate } from "./format-date";
import type { FormatDurationOptions } from "./format-duration";
import { formatDuration } from "./format-duration";
import { formatNumber } from "./format-number";
import { formatPercentage } from "./format-percentage";

type DataModelFieldType =
  | "string"
  | "boolean"
  | "id"
  | "ref"
  | "duration"
  | "numeric"
  | "currency"
  | "datetime"
  | "percentage";

type TypeToFormat = {
  currency: FormatCurrencyOptions;
  duration: FormatDurationOptions;
  percentage: BaseFormatOptions;
  datetime: BaseFormatOptions;
  numeric: BaseFormatOptions;
  boolean: FormatBooleanOptions;
  string: BaseFormatOptions;
  id: BaseFormatOptions;
  ref: BaseFormatOptions;
};

// Generic-narrowing pattern: each case narrows fieldType to a specific
// literal, but TS can't narrow `options: TypeToFormat[TFieldType]` along
// with it, so the `as` casts are mechanical and safe.
export const format = <TFieldType extends DataModelFieldType>(
  locale: Intl.LocalesArgument,
  value: unknown,
  fieldType: TFieldType,
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- generic default value cast, safe
  options: TypeToFormat[TFieldType] = {} as TypeToFormat[TFieldType],
): string => {
  if (value == null) {
    return NULL_STRING;
  }

  switch (fieldType) {
    case "datetime":
      return formatDate(
        locale,
        assertDateTimeOrString(value, "Date time value"),
      );
    case "numeric":
      return formatNumber(
        locale,
        assertNumber(value, "Format numeric value"),
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- generic narrowing
        options as BaseFormatOptions,
      );
    case "currency":
      return formatCurrency(
        locale,
        assertNumber(value, "Format currency value"),
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- generic narrowing
        options as FormatCurrencyOptions,
      );
    case "duration":
      return formatDuration(
        locale,
        Duration.fromMillis(assertNumber(value, "Format duration value")),
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- generic narrowing
        options as FormatDurationOptions,
      );
    case "percentage":
      return formatPercentage(
        locale,
        assertNumber(value, "Format percentage value"),
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- generic narrowing
        options as BaseFormatOptions,
      );
    case "boolean":
      return formatBoolean(
        assertBoolean(value, "Format value"),
        // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- generic narrowing
        options as FormatBooleanOptions,
      );
    case "string":
    case "id":
    case "ref":
      return typeof value === "string" ? value : JSON.stringify(value);
    default:
      assert(false, "Unknown format type");
  }
};
