# Form field copy content pattern

---
name: form-field-copy
description: generate product ui form field copy following ux writing guidelines. use when drafting or revising labels, placeholder text, helper text, inline validation errors, checkbox labels, dropdown labels, people picker guidance, toggle labels, or input instructions during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for a form field or input control.

Interpret the user's request in natural language. Extract, when available:
- field type
- what information the user needs to enter or select
- whether the request is for a label, placeholder, helper text, inline error, or full field set
- whether the field is required, optional, sensitive, or format-specific
- whether the field is text input, dropdown, checkbox, toggle, or people picker
- any product-specific terminology that should be used

Return only the fields that apply, omitting any that aren't needed:

Label: ...
Placeholder: ...
Helper text: ...
Error: ...

## Rules
- Use sentence case throughout.
- Keep labels short, clear, and specific. Do not use punctuation after labels.
- Never use placeholder text instead of a label. Placeholder text hides context and creates accessibility issues.
- Treat placeholder text as optional supporting guidance only. Do not put essential instructions in placeholder text. Do not use a period in placeholder text.
- Use helper text only when it adds necessary guidance such as examples, syntax, character counts, requirements, or constraints. Keep to 1–2 short sentences maximum.
- Keep inline errors direct and actionable. Keep to 1–2 short sentences maximum. For more complex inline error scenarios, refer to the error message content pattern.
- Avoid blame, filler, idioms, exclamation points, jargon, and dramatic language.
- Avoid casual placeholder text like "Type here" or vague prompts like "Enter value."
- Use platform terminology consistently.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Text input**
- Use a short noun-based label.
- Add placeholder text only if the expected input is not obvious from the label.
- Put examples or formatting help in helper text when needed.

**Search field**
- For search field copy, refer to the search and filter copy content pattern.

**Dropdown**
- Make the label clear and purposeful.
- Keep options short and distinct. No two options should start with the same word or phrase — this causes confusion when scanning and when listening via a screen reader.

**Checkbox**
- Keep the label short and descriptive.

**Toggle**
- Use a clear label that states what the switch controls.
- Do not phrase the label as a question.
- The label should not change when the switch state changes.
- If more context is needed, put it in helper text, not the label.

**People picker**
- Add helper text when input requirements are important to task completion.

**Inline error**
- Say what needs to be corrected.
- Keep it short and direct.
- Place the error next to the field when possible.
- For more complex inline error scenarios, refer to the error message content pattern.

## Examples of requests this skill should handle
- "Write label and helper text for a workspace name field"
- "I need a toggle label and helper text for email notifications"
- "Rewrite this form field to match our design system voice"
- "Write an inline error for an invalid email address"

## Output example
**Label:** Workspace name
**Helper text:** Use a name your team will recognize.
**Error:** Enter a workspace name
