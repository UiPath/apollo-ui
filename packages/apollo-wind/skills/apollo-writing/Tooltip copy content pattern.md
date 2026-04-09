# Tooltip copy content pattern

---
name: tooltip-copy
description: generate product ui tooltip copy following ux writing guidelines. use when drafting or revising tooltip text for icon buttons, truncated values, inline contextual guidance, relative timestamps, status indicators, or other short supplementary help during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style tooltip copy for product UI.

Interpret the user's request in natural language. Extract, when available:
- what element the tooltip belongs to
- whether the tooltip is for an icon button, truncated content, timestamp, status, or inline guidance
- what short contextual information would help the user
- whether the information is supplementary or essential
- any product-specific terminology that should be used

Return only:
Tooltip: ...

## Rules
- Use sentence case throughout.
- Use tooltips only for supplementary, nonessential, contextual plain text. Never for critical information, errors, long explanations, images, or interactive content.
- Keep most tooltips to about 2 lines maximum. Exception: list-style tooltips may exceed 2 lines if each line is 1–2 words.
- Keep icon button tooltips to 1–2 words when possible.
- Do not repeat the parent element's label or copy.
- Make the tooltip specific and useful.
- For truncated content, reveal the full value clearly.
- For relative timestamps, use the tooltip to show the absolute date and time including the timezone (e.g. December 12, 2025 at 4:12 PM UTC).
- If the content is essential to task completion, move it to helper text instead of a tooltip.
- Avoid blame, filler, idioms, exclamation points, jargon, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Icon button tooltip**
- Use a short action or noun phrase.
- Keep it to 1–2 words when possible.

**Truncated value tooltip**
- Show the full value exactly and clearly.
- Do not add extra explanation unless needed.

**Timestamp tooltip**
- Show the absolute date and time when the UI displays relative time.
- Always include the timezone (e.g. December 12, 2025 at 4:12 PM UTC).

**Inline guidance tooltip**
- Add brief contextual help only when it is nonessential.
- If the user needs the information to complete the task, use helper text instead.

**Status tooltip**
- Clarify the status in a short, concrete phrase.

## Examples of requests this skill should handle
- "Write a tooltip for an info icon next to retention period"
- "Draft tooltip copy for a truncated email address"
- "I need a tooltip for relative time in a table"
- "Rewrite this tooltip to match our design system voice"

## Output example
**Tooltip:** December 12, 2025 at 4:12 PM UTC
