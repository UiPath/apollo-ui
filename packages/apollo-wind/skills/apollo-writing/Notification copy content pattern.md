# Notification copy content pattern

---
name: notification-copy
description: generate product ui notification copy following ux writing guidelines. use when drafting or revising toast messages, inline status messages, banners, alerts, success messages, warning messages, info messages, or action notifications during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for a product UI notification.

Interpret the user's request in natural language. Extract, when available:
- notification type
- what happened
- whether the message is success, warning, info, or error
- whether the user needs to take action
- whether the notification is a toast, banner, inline status, or persistent alert
- whether a CTA or link is needed
- any product-specific terminology that should be used

Return only the fields appropriate for the notification type:

- Toast: Body only, and CTA only if there is a strong next step
- Inline status: Body only, no CTA
- Banner or alert: Title is optional; include Body, and CTA or Link CTA only if a recovery or next action exists

Use this format, omitting fields that don't apply:
Title: ...
Body: ...
Primary CTA: ...
Secondary CTA: ...
Link CTA: ...

## Rules
- Use sentence case throughout.
- Keep notifications short, clear, and specific.
- Focus on what happened and what the user can do next.
- Use calm, neutral language. Use contractions sparingly to maintain that tone.
- Avoid blame, filler, idioms, exclamation points, and dramatic language. This includes success messages — do not use exclamation points even to celebrate a completed action.
- Do not use phrases like "Oops" or "Uh-oh."
- For success messages, confirm the outcome without over-celebrating.
- For warnings, explain the risk or consequence clearly.
- For info messages, keep the message factual and useful.
- For error notifications, use clear recovery language and avoid vague fallback copy when the cause is known. For detailed error copy guidance, refer to the error message content pattern.
- Do not repeat the same error or status message across multiple surfaces.
- Use specific CTA labels, not generic labels. Keep CTA labels to 2–4 words when possible.
- Use Try again instead of Retry.
- For automation-related notifications, use Run as a verb only. Use Job as the noun (e.g. "The job completed", not "The run completed").
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Success toast**
- Confirm that the action completed.
- Keep it brief.
- Usually no CTA unless there is a strong next step.
- No exclamation points.

**Error banner**
- State what failed.
- Give the clearest next action.
- Add a CTA only if the recovery action is useful in place.
- For detailed error copy guidance, refer to the error message content pattern.

**Warning alert**
- Explain the risk, limit, or upcoming consequence.
- Keep the message direct and non-alarmist.

**Info banner**
- Share status, policy, or system information clearly.
- Use a link CTA only when the destination is specific and helpful.

**Inline status**
- Keep it extremely short.
- Match the surrounding task context.
- No CTA.

## Examples of requests this skill should handle
- "Write a success toast for creating a project"
- "Draft a warning banner for storage nearing its limit"
- "I need an error banner for a failed sync"
- "Rewrite this alert to match our design system voice"
- "Write a notification for an automation that finished running"

## Output example
**Title:** Sync failed
**Body:** We couldn't sync your changes. Check your connection and try again.
**Primary CTA:** Try again
