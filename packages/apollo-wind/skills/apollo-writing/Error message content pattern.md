# Error message content pattern

---
name: error-message-copy
description: generate product ui error messages following ux writing guidelines. use when drafting or revising inline validation errors, form errors, banner errors, toast errors, empty error states, upload errors, permissions errors, or system errors during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style error message copy for product UI.

Interpret the user's request in natural language. Extract, when available:
- what the user was trying to do
- what went wrong
- whether the problem is caused by validation, permissions, system failure, network issues, or missing information
- what action the user can take next
- whether the message is inline, banner, toast, modal, or full-page

Return only the fields appropriate for the component type:

- Inline validation: Body only (no title, no CTA)
- Toast: Body, and CTA only if a recovery action exists
- Banner: Body, and CTA only if a recovery action exists
- Modal or full-page: Title, Body, and CTA

Use this format, omitting fields that don't apply:
Title: ...
Body: ...
CTA: ...

## Rules
- Use sentence case throughout.
- Be specific about what happened whenever the cause is known.
- Focus on what the user can do next.
- Use calm, neutral language. Use contractions sparingly to maintain that tone.
- Use "we" when the system is the actor ("We couldn't save your changes"). Use "your" when referring to the user's content. Avoid "you" as the subject in error messages — it can feel like blame.
- Avoid blame, filler, idioms, exclamation points, and dramatic language.
- Avoid "Oops", "Uh-oh", and "Something went wrong". If the cause is genuinely unknown and no better explanation exists, "We couldn't complete this action" is preferred over generic dramatic phrases.
- For CTAs, use 2–4 words maximum with a verb + noun structure where possible. Do not use "Retry" — use "Try again".
- Prefer clear actions like Try again, Check your connection, Enter a valid email address, or Contact your admin.
- Keep inline validation errors short and direct.
- For system or page-level errors, use a short title and concise body.
- Do not over-explain technical details unless they help the user recover.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Validation error**
- Explain what needs to be corrected.
- Keep it short.
- Example style: Enter a valid email address.

**Permission error**
- Explain what access is missing.
- Point to the next step when possible.

**System or network error**
- State the problem in plain language.
- Give a recovery action if one exists.

**Destructive or failed action error**
- Explain that the action did not complete.
- Clarify whether anything changed.

## Examples of requests this skill should handle
- "Write an inline error for an invalid workspace name"
- "Draft a banner error for a failed upload"
- "I need a permissions error for someone who can't edit this automation"
- "Rewrite this error state to match our design system voice"

## Output example
**Title:** Upload failed
**Body:** We couldn't upload your file. Check your connection and try again.
**CTA:** Try again
