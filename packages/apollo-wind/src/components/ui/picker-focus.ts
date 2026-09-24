/**
 * Opening the popover moves focus to the day the calendar offers first (the selected day, else
 * today), rather than to its first control. Radix's own open focus lands on the previous-month
 * chevron and overrides DayPicker's, which left keyboard users a tab stop per caption control
 * away from the grid.
 */
export function focusCalendarDay(event: Event) {
  const day = (event.currentTarget as HTMLElement | null)?.querySelector<HTMLElement>(
    '[role="grid"] button[tabindex="0"]'
  );
  if (!day) return;
  event.preventDefault();
  day.focus();
}
