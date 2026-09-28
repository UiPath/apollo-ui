# Drawer copy content pattern

---
name: drawer-copy
description: generate product ui drawer copy following ux writing guidelines. use when drafting or revising drawer headers, section headings, helper text, save and cancel actions, side panel body copy, or setup and edit panel content during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for a drawer or side panel.

Interpret the user's request in natural language. Extract, when available:
- what the drawer is for
- whether the drawer is for creating, editing, configuring, reviewing, or selecting something
- whether the request is for a header, section heading, helper text, CTA set, or full drawer copy
- whether the body includes forms, settings, or supporting guidance
- whether the panel needs Save, Apply, Cancel, or Discard actions
- any product-specific terminology that should be used

Return only the fields that apply, omitting any that aren't needed:

Header: ...
Section heading: ...
Body: ...
Primary CTA: ...
Secondary CTA: ...

## Rules
- Use sentence case throughout.
- Make the header clearly state the purpose of the panel. Keep it short, direct, and specific.
- Use noun-based section headings for grouped content. Group related fields under labeled sections to support skimming.
- Use body copy only when it helps the user act or understand the panel. Avoid redundant instructions when the form fields already provide enough guidance.
- For drawers containing form inputs, refer to the form field copy content pattern for label, placeholder, helper text, and inline error guidance.
- Keep body copy to 1–2 short sentences when used.
- Use one clear primary action, typically Save or Apply. Keep CTA labels to 2–4 words with a verb + noun structure where possible.
- Use a secondary action such as Cancel or Discard when needed.
- Use specific CTA labels consistent with system terminology. Avoid vague labels such as Confirm, Submit, or Continue unless the context truly makes them the clearest option.
- Use Build for agents, automations, or apps.
- Use Create for new objects that did not exist before.
- Use Add for adding an existing object to an existing list, group, or container.
- Use Select instead of Choose for clickable UI choices.
- Avoid blame, filler, idioms, exclamation points, jargon, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Edit drawer**
- Use a direct header such as Edit project settings.
- Use Save as the primary CTA when changes are committed.

**Apply/configure drawer**
- Use a header that names the setting or configuration area.
- Use Apply when the action applies filters, settings, or scoped changes.

**Create/setup drawer**
- Use a header that names what is being created or set up.
- Use Create or Build only when the drawer completes the creation action.

**Selection drawer**
- Use a header that tells users what they are selecting.
- Keep section headings noun-based and scannable.
- Use Select, not Choose, for the primary action.

**Discarding changes**
- Use Discard only when changes will be lost.
- Use Cancel when the drawer simply closes without emphasizing loss.

## Examples of requests this skill should handle
- "Write a drawer header and CTA set for editing project settings"
- "Draft section headings for a side panel with automation details"
- "I need copy for a drawer that lets users apply filters"
- "Rewrite this drawer to match our design system voice"

## Output example
**Header:** Edit project settings
**Section heading:** Access and permissions
**Body:** Changes apply to all members of this project.
**Primary CTA:** Save
**Secondary CTA:** Cancel
