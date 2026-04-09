# Toggle and selection copy content pattern

---
name: toggle-and-selection-copy
description: generate product ui toggle and selection control copy following ux writing guidelines. use when drafting or revising toggle labels, checkbox labels, radio options, dropdown labels, dropdown option names, people picker helper text, selection instructions, or related control copy during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for toggle and selection controls.

Interpret the user's request in natural language. Extract, when available:
- what the control is for
- whether the request is for a toggle, checkbox, radio group, dropdown, people picker, or selection instruction
- what users are selecting, enabling, disabling, or assigning
- whether helper text is needed for task completion
- whether platform-specific terminology should be used

Return only the fields that apply, omitting any that aren't needed. Output as many option fields as the request requires.

Control type: ...
Label: ...
Helper text: ...
Option 1: ...
Option 2: ...
Option 3: ...
Selection instruction: ...

## Rules
- Use sentence case throughout.
- Keep labels short, clear, and specific.
- Do not use punctuation after labels.
- For toggle switches:
  - Always provide a label or surrounding context.
  - Be clear about what the switch turns on or off.
  - Do not phrase the label as a question.
  - Do not change the label when the switch state changes.
  - Put added explanation in helper text, not in the label.
- For checkboxes:
  - Keep labels short and descriptive.
- For radio groups and dropdowns:
  - Make the label clear and purposeful.
  - Use short, distinct option names.
  - No two options should start with the same word or phrase — this causes confusion when scanning and when listening via a screen reader.
- For people pickers:
  - Add helper text when specific input requirements are important to task completion.
- Use Select instead of Choose for clickable choices.
- Use Clear instead of Deselect.
- Avoid filler, idioms, exclamation points, jargon, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Toggle**
- Use a stable label that names the setting or behavior.
- Keep explanatory details in helper text when needed.

**Checkbox**
- Use a short descriptive phrase.
- Avoid long explanatory labels when helper text would be clearer.

**Radio group**
- Use a clear group label.
- Make each option distinct and easy to scan.
- No two options should start with the same word or phrase.

**Dropdown**
- Make the purpose obvious from the label.
- Keep option labels short and unique.
- No two options should start with the same word or phrase.

**People picker**
- Use helper text for requirements such as role, email format, or access scope.

**Selection instruction**
- Use direct action language.
- Prefer Select over Choose.

## Examples of requests this skill should handle
- "Write a toggle label and helper text for email notifications"
- "Draft checkbox copy for accepting workspace terms"
- "I need dropdown labels and options for automation status"
- "Write people picker helper text for adding workspace admins"
- "Rewrite this selection control to match our design system voice"

## Output example
**Control type:** Toggle
**Label:** Email notifications
**Helper text:** Send notifications when a job starts or fails.
