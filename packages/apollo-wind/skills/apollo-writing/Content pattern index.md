# Content pattern index

A reference guide to all content generation patterns in this library. Each pattern produces production-style UI copy aligned with the UX writing guidelines.

**Foundation:** [UX writing guidelines.md](UX%20writing%20guidelines.md)

---

## Content and messaging

### Error message
**File:** [Error message content pattern.md](Error%20message%20content%20pattern.md)
**Use for:** Inline validation errors, form errors, banner errors, toast errors, upload errors, permissions errors, system errors.
**Output:** Title, Body, CTA — fields vary by component type (inline = body only; toast = body + optional CTA; modal/full-page = all three).
**See also:** Notification copy pattern for success, warning, and info states.

---

### Notification
**File:** [Notification copy content pattern.md](Notification%20copy%20content%20pattern.md)
**Use for:** Success toasts, warning alerts, info banners, inline status messages, action notifications.
**Output:** Title, Body, Primary CTA, Secondary CTA, Link CTA — fields vary by notification type.
**See also:** Error message pattern for detailed error copy guidance.

---

### Empty state
**File:** [Empty state content pattern.md](Empty%20state%20content%20pattern.md)
**Use for:** First-use states, no-results states, filtered empty states, no-data states, post-action empty states.
**Output:** Title, Body, Primary CTA, Secondary CTA, Link — omit fields that don't apply.

---

## Actions and controls

### Button and CTA
**File:** [Button and CTA copy content pattern.md](Button%20and%20CTA%20copy%20content%20pattern.md)
**Use for:** Primary buttons, secondary buttons, menu actions, destructive actions, recovery actions, button sets.
**Output:** Primary CTA, Secondary CTA, Link CTA, Menu action — omit fields that don't apply.
**Key rules:** Build for automations/agents/apps. Create for new objects. Add for existing objects into containers. Try again not Retry. Run is a verb — Job is the noun.

---

### Link
**File:** [Link copy content pattern.md](Link%20copy%20content%20pattern.md)
**Use for:** Inline links, action links, help links, documentation links, navigation links.
**Output:** Link text only.
**Key rules:** No "Learn more" or "Click here". Do not use the word "link" in link text. Consistent text across pages for the same destination.

---

### Toggle and selection
**File:** [Toggle and selection copy content pattern.md](Toggle%20and%20selection%20copy%20content%20pattern.md)
**Use for:** Toggle labels, checkbox labels, radio groups, dropdown labels and options, people picker helper text, selection instructions.
**Output:** Control type, Label, Helper text, Options — omit fields that don't apply.
**Key rules:** Select not Choose. Clear not Deselect. No two options start with the same word or phrase.

---

### Destructive modal
**File:** [Destructive modal copy content pattern.md](Destructive%20modal%20copy%20content%20pattern.md)
**Use for:** Delete confirmations, removal confirmations, unsaved changes dialogs, exit confirmations, access revocation.
**Output:** Title, Body, Secondary CTA, Primary CTA — Secondary CTA is optional.
**Key rules:** Delete for permanent removal. Remove for non-permanent. Revoke access for access revocation. Only say "can't undo" when truly irreversible.

---

## Forms and inputs

### Form field
**File:** [Form field copy content pattern.md](Form%20field%20copy%20content%20pattern.md)
**Use for:** Text input labels, placeholder text, helper text, inline validation errors, checkbox labels, dropdown labels, toggle labels, people picker guidance.
**Output:** Label, Placeholder, Helper text, Error — omit fields that don't apply.
**See also:** Search and filter pattern for search field copy. Error message pattern for complex inline error scenarios.

---

### Search and filter
**File:** [Search and filter copy content pattern.md](Search%20and%20filter%20copy%20content%20pattern.md)
**Use for:** Search field labels and placeholders, filter labels, filter reset actions, no-results states, filtered empty states, result summaries.
**Output:** Search field label, Search field placeholder, Filter label, Helper text, Empty state title, Empty state body, Primary CTA, Secondary CTA — omit fields that don't apply.
**Key rules:** Always include a label for search fields. "Clear all filters" or "Reset filters" — not "Cancel" or "X".

---

## Layout and navigation

### Tabs and navigation
**File:** [Tabs and navigation copy content pattern.md](Tabs%20and%20navigation%20copy%20content%20pattern.md)
**Use for:** Tab labels, page headings, section headings, side navigation labels, breadcrumb labels, menu navigation items.
**Output:** Page heading, Section heading, Tab labels, Navigation items, Breadcrumb label — number of tab and nav fields matches the request.
**Key rules:** Noun-based headings only. First tab = most logical starting view. Related tabs adjacent.

---

### Drawer
**File:** [Drawer copy content pattern.md](Drawer%20copy%20content%20pattern.md)
**Use for:** Drawer and side panel headers, section headings, body copy, Save/Apply/Cancel/Discard CTA sets.
**Output:** Header, Section heading, Body, Primary CTA, Secondary CTA — omit fields that don't apply.
**See also:** Form field pattern for input copy within drawers.

---

### Accordion and disclosure
**File:** [Accordion and disclosure copy content pattern.md](Accordion%20and%20disclosure%20copy%20content%20pattern.md)
**Use for:** Accordion labels, show/hide triggers, advanced settings labels, expandable summaries, section headings.
**Output:** Section heading, Expand label, Collapse label, Summary text, Helper text — omit fields that don't apply.
**Key rules:** Show/Hide, View/Hide, Expand/Collapse — keep pairs parallel. No casual language (Sneak peek, Unlock more).

---

## Data display

### Table and status
**File:** [Table and status copy content pattern.md](Table%20and%20status%20copy%20content%20pattern.md)
**Use for:** Table column labels, status badges, row actions, timestamp labels and formats, duration labels, empty table states.
**Output:** Column label, Status badge, Row action, Timestamp label, Timestamp format, Duration label, Empty state title, Empty state body — omit fields that don't apply.
**See also:** Date, time, and duration pattern for detailed formatting rules.

---

### Tooltip
**File:** [Tooltip copy content pattern.md](Tooltip%20copy%20content%20pattern.md)
**Use for:** Icon button tooltips, truncated value tooltips, timestamp tooltips, inline guidance tooltips, status tooltips.
**Output:** Tooltip text only.
**Key rules:** Supplementary content only — never for critical info, errors, or interactive content. 1–2 lines max (exception: list-style tooltips). Always include timezone in timestamp tooltips.

---

### Date, time, and duration
**File:** [Date time and duration copy content pattern.md](Date%20time%20and%20duration%20copy%20content%20pattern.md)
**Use for:** Timestamp labels, relative and absolute time formatting guidance, duration labels, date picker helper text, time-based table labels.
**Output:** Label, Format guidance, Helper text, Tooltip — omit fields that don't apply.
**Key rules:** Date format: ddd, MMM D, YYYY. Time format: H:MM AM/PM timezone. Duration: exact (2h 15m 30s) or rounded (2.25 hrs) with tooltip. Never mix micro and macro time units.

---

## Cross-references

| If you need… | Use this pattern | And also consider… |
|---|---|---|
| Error copy | Error message | Notification (for error banners/toasts) |
| Success or warning copy | Notification | — |
| Search field copy | Search and filter | Form field (for other input types) |
| Inline validation error | Error message | Form field (for the field label and helper text) |
| Table timestamps or durations | Table and status | Date, time, and duration (for format detail) |
| Drawer form inputs | Drawer | Form field |
| Button on a destructive modal | Destructive modal | Button and CTA |
