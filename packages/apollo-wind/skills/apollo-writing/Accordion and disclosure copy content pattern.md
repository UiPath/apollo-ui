# Accordion and disclosure copy content pattern

---
name: accordion-and-disclosure-copy
description: generate product ui accordion and disclosure copy following ux writing guidelines. use when drafting or revising accordion labels, show or hide triggers, view details links, advanced settings labels, expandable summaries, or disclosure text during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for accordion and disclosure UI.

Interpret the user's request in natural language. Extract, when available:
- what content is being expanded or collapsed
- whether the request is for an accordion label, disclosure trigger, section heading, summary text, or supporting helper copy
- whether the content is advanced, optional, supplementary, or detail-level information
- whether the trigger should reveal or collapse content
- any product-specific terminology that should be used

Return only the fields that apply, omitting any that aren't needed:

Section heading: ...
Expand label: ...
Collapse label: ...
Summary text: ...
Helper text: ...

## Rules
- Use sentence case throughout.
- Keep labels short, clear, and specific.
- Use clear, neutral triggers for expandable content.
- Prefer straightforward labels such as Show advanced settings, View details, or Expand task history.
- Avoid casual, playful, or vague language such as Sneak peek, Unlock more, or See magic.
- Make the expanded content obvious from the label.
- Use noun-based section headings, not action phrases. Headings should describe what the section is, not what the user should do.
- Keep summary text short and scannable.
- Use helper text only when it adds necessary context.
- Avoid blame, filler, idioms, exclamation points, jargon, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Accordion label**
- Name the content being revealed.
- Keep it neutral and descriptive.

**Expand label**
- Use Show, View, or Expand when the action reveals content.
- Be explicit about what appears.

**Collapse label**
- Use Hide when the collapse label pairs with Show (e.g. Show advanced settings → Hide advanced settings).
- For View or Expand triggers, keep the collapse label parallel (e.g. View details → Hide details, Expand task history → Collapse task history).
- Do not use Close or Dismiss as collapse labels.

**Advanced settings**
- Use direct labels such as Show advanced settings.
- Avoid implying mystery, reward, or surprise.

**Section heading**
- Use noun-based headings that describe the section content.
- Do: "Process overview", "Configuration details", "Output parameters"
- Don't: "Learn about processes", "Configure the settings", "View output"

**Summary text**
- Briefly describe what is inside the section when helpful.
- Keep it to 1 short sentence.

## Examples of requests this skill should handle
- "Write accordion labels for advanced settings"
- "Draft expand and collapse labels for task history"
- "I need disclosure copy for viewing process details"
- "Rewrite this accordion UI to match our design system voice"

## Output example
**Section heading:** Configuration details
**Expand label:** Show advanced settings
**Collapse label:** Hide advanced settings
**Summary text:** Review configuration options for this automation.
