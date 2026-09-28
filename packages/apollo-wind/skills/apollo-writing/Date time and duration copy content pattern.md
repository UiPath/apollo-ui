# Date, time, and duration copy content pattern

---
name: date-time-and-duration-copy
description: generate product ui date, time, timestamp, and duration copy following ux writing guidelines. use when drafting or revising timestamp labels, relative and absolute time formatting guidance, duration labels, date-picker helper text, time-based table labels, or related temporal product ui copy during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for date, time, timestamp, and duration UI.

Interpret the user's request in natural language. Extract, when available:
- whether the request is for a timestamp label, timestamp format, duration label, date-picker guidance, helper text, tooltip text, or table column label
- whether users need quick recency scanning or precise reference
- whether the time shown is recent, historical, scheduled, or duration-based
- whether the UI is in a table, form, tooltip, detail page, or log view
- any product-specific terminology that should be used

Return only the fields that apply, omitting any that aren't needed:

Label: ...
Format guidance: ...
Helper text: ...
Tooltip: ...

## Rules
- Use sentence case throughout.
- Keep labels short, clear, and specific.
- Use Last updated as the label for update-time columns and fields.
- Use relative time when users need to quickly scan recent activity. Use absolute time when users need precision or exact reference.
- When relative time is shown in a table or list, use a tooltip to show the absolute date and time including the timezone.
- Use consistent date and time formatting within the same experience. In tables, align dates to the left and use a uniform format across all columns.
- Use numerals for all dates, times, and durations.

### Date format
- Format: ddd, MMM D, YYYY (e.g. Mon, Dec 12, 2023)
- No leading zero on the day. Year can be omitted for events in the current year.
- Use the full date in cards and wherever space allows.

### Time format
- Express time as H:MM AM/PM timezone (e.g. 4:12 PM UTC)
- Hour without leading zero; minutes with leading zero.
- Include a space before AM or PM. No periods (AM not A.M.).
- Always include the timezone.
- Noon and midnight may be expressed as "Noon" / "Midnight" or "12 PM" / "12 AM".

### Duration format
- Use Duration (not execution time or throughput time).
- Exact duration: 00x 00y 00z format (e.g. 2h 15m 30s). Always include the unit letter after the number.
- Rounded duration: 00.00 xyz format (e.g. 2.25 hrs). Max two decimal places. Show exact time on hover in a tooltip.
- Display up to three consecutive units starting with the highest (e.g. 1h 00m 30s, not 1h 30s).
- Never mix micro time (h/m/s) with macro time (y/w/d) in the same value.

### Last updated cell values
- Do: "Updated just now", "Updated 5 minutes ago", "Updated 1 hour ago", "Updated May 30, 2025", "Updated May 30, 2025 at 4:12 PM"
- Don't: "Updated recently", "Last modified", "Date of change"
- Use relative time for updates within the last 24 hours. Switch to absolute time after that.

## Patterns

**Update timestamp**
- Use Last updated as the label.
- Use relative time for recent changes when scanning matters.
- Show absolute time including timezone on hover when relative time appears in a table or list.

**Log or audit timestamp**
- Use absolute time when users need exact sequencing or precise reference.
- Show seconds and timezone when required.

**Duration label**
- Use Duration.
- Keep the format consistent within the same table or screen.
- Use exact format for precision; rounded format with tooltip for scannability.

**Date picker helper text**
- Add helper text only when users need input guidance, constraints, or formatting help.

**Scheduled date or time**
- Use explicit labels that describe what the date represents, such as Start date or End time.

**Tooltip**
- Use the tooltip to show the full absolute date and time including timezone when the UI shows relative time.
- Format: Month D, YYYY at H:MM AM/PM timezone (e.g. December 12, 2025 at 4:12 PM UTC)

## Examples of requests this skill should handle
- "Write a label and format rule for a last updated column"
- "Draft helper text for a date picker with a required start date"
- "I need copy for showing relative time in a jobs table"
- "Write a duration label for a run history table"
- "Rewrite this timestamp UI to match our design system voice"

## Output example
**Label:** Last updated
**Format guidance:** Show relative time in the table cell for updates within the last 24 hours. Show the absolute date and time on hover. Use absolute time in logs and detail views where precision matters.
**Tooltip:** December 12, 2025 at 4:12 PM UTC
