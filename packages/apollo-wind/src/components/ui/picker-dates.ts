/**
 * The local midnight of a calendar day. `new Date(year, month, day)` reads years 0 to 99 as 1900
 * to 1999; `setFullYear` takes the year as given. Months and days outside their range roll over,
 * as they do in the constructor.
 */
export function localDate(year: number, month: number, day = 1) {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  return date;
}

/** `Date.UTC` without its reading of years 0 to 99 as 1900 to 1999. */
export function utcTime(year: number, month: number, day = 1, hours = 0, minutes = 0, seconds = 0) {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hours, minutes, seconds, 0);
  return date.getTime();
}
