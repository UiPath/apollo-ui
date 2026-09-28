import type { MetricExpression } from "../../models/expression";
import { getMetricFieldType } from "../get-metric-field-type";
import type { BaseFormatOptions } from "./base-format-options";
import { format } from "./format";

export function formatMetricValue(
  locale: Intl.LocalesArgument,
  value: unknown,
  expression: MetricExpression,
  options?: BaseFormatOptions,
): string {
  const fieldType = getMetricFieldType(expression);

  if (fieldType === "currency" && expression.argument.type === "currency") {
    const fmt = expression.argument.format;
    return format(locale, value, "currency", {
      ...options,
      ...(fmt && { currency: fmt.currency }),
    });
  }

  if (fieldType === "boolean" && expression.argument.type === "boolean") {
    const fmt = expression.argument.format;
    return format(locale, value, "boolean", {
      ...options,
      ...(fmt && {
        trueLabel: fmt.trueDisplay,
        falseLabel: fmt.falseDisplay,
      }),
    });
  }

  return format(locale, value, fieldType, options);
}
