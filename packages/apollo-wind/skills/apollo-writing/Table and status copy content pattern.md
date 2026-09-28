# Table and status copy content pattern

---
name: table-and-status-copy
description: generate product ui table and status copy following ux writing guidelines. use when drafting or revising table column labels, row actions, status badges, empty table messaging, last updated labels, timestamp formats, duration labels, or related status and table copy during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for a table, list row, or status element.

Interpret the user's request in natural language. Extract, when available:
- what object the table or list contains
- whether the request is for a column label, status badge, row action, timestamp label, duration label, helper text, or empty state
- whether the timestamp should be relative or absolute
- whether users need quick recency or precise reference
- any product-specific terminology that should be used
- whether a CTA or row action is needed

Return only the fields that apply, omitting any that aren't needed:

Column label: ...
Status badge: ...
Row action: ...
Timestamp label: ...
Timestamp format: ...
Duration label: ...
Empty state title: ...
Empty state body: ...

## Rules
- Use sentence case throughout.
- Keep labels short, clear, and specific.
- Use noun-based labels for columns and headings, not action phrases.
- Keep status badges to 1–2 words maximum. Avoid wrapping.
- Use consistent terminology across the table. Use the same date format across the entire table.
- Align dates to the left in table columns for easy scanning.
- Use "Last updated" as the label for update-time columns.
- Use relative timestamps for recent updates within the last 24 hours. Switch to absolute timestamps when the content is older or when users need precision.
- When relative time is shown in a table, show the absolute date and time on hover in a tooltip.
- Use absolute time in tables when users need to reference exact events or compare close timestamps.
- Use numerals for dates, times, and durations.
- Use Duration (not execution time or throughput time) for duration columns.
- For duration formatting:
  - Exact duration: 00x 00y 00z format (e.g. 2h 15m 30s)
  - Rounded duration: 00.00 xyz format (e.g. 2.25 hrs). Show exact time on hover in a tooltip.
  - Display up to three consecutive units, starting with the highest.
  - Never mix micro time (h/m/s) with macro time (y/w/d) in the same value.
- Keep row actions specific and concise. Use Run as a verb only — never as a noun (use Job).
- Use specific action labels, not vague labels.
- Avoid jargon, filler, idioms, exclamation points, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Column label**
- Use a short noun or noun phrase.
- Avoid action-based headings.
- Prefer labels like Status, Owner, Last updated, and Duration.

**Status badge**
- Keep it to 1–2 words.
- Make it scannable and distinct from nearby statuses.
- Avoid wrapping.

**Timestamp label and cell values**
- Use "Last updated" as the column label.
- Do: "Updated just now", "Updated 5 minutes ago", "Updated 1 hour ago", "Updated May 30, 2025", "Updated May 30, 2025 at 4:12 PM"
- Don't: "Updated recently", "Last modified", "Date of change"
- Use relative time for recent changes when quick scanning matters.
- Use absolute time when users need precise reference.

**Timestamp format**
- Relative in cell, absolute on hover for recent activity when appropriate.
- Absolute in cell when precision matters, especially in logs or high-detail tables.

**Duration label**
- Use Duration.
- Keep formatting consistent within the table.
- Exact: 00x 00y 00z (e.g. 2h 15m 30s). Rounded: 00.00 xyz (e.g. 2.25 hrs) with exact time on hover.

**Row action**
- Use clear verbs.
- Use Run as a verb only — never as a noun (use Job).
- Follow system terminology: Build, Create, Add, Remove, Delete, Select, Clear, Try again.

**Empty table state**
- Keep it short and actionable.
- Explain whether the table is empty because nothing exists yet or because filters or search returned no matches.

## Examples of requests this skill should handle
- "Write column labels for a table of automations"
- "Draft status badges for running, failed, and completed jobs"
- "I need a timestamp label and format for an activity log"
- "Rewrite this table UI to match our design system voice"
- "Write row actions for a table of projects"

## Output example
**Column label:** Last updated
**Status badge:** In progress
**Row action:** Manage access
**Timestamp label:** Last updated
**Timestamp format:** Relative in cell, absolute on hover
**Duration label:** Duration
**Empty state title:** No automations yet
**Empty state body:** Build an automation to start running workflows in this workspace.
