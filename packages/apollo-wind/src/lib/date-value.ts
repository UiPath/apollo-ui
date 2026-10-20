import { isValid, parseISO } from 'date-fns';

// JSON Schema's `format: date` and `format: date-time` (RFC 3339), with seconds optional. A
// missing offset is local time. `parseISO` alone also accepts reduced forms such as "26".
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?$/;

/**
 * Reads a date or date-time value from untyped input, such as JSON-sourced form data.
 *
 * Accepts a valid `Date` or an RFC 3339 date / date-time string; a date-only string is a local
 * calendar date. Anything else is no value: the standard parsers disagree on numbers, digit-only
 * and locale strings, so they are not guessed at.
 */
export function toDateValue(value: unknown): Date | undefined {
  if (value instanceof Date) {
    if (isValid(value)) return value;
  } else if (
    typeof value === 'string' &&
    (DATE_PATTERN.test(value) || DATE_TIME_PATTERN.test(value))
  ) {
    const date = parseISO(value);
    if (isValid(date)) return date;
  }
  return undefined;
}
