# Empty state content pattern

---
name: empty-state-copy
description: generate product ui empty state copy following ux writing guidelines. use when drafting or revising empty state title, body, and cta text for tables, lists, dashboards, search results, filters, first-use experiences, or no-data states during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for an empty state.

Interpret the user's request in natural language. Extract, when available:
- what content or object is missing
- whether this is first use, no results, filtered results, or a cleared/removed state
- what the user was trying to do
- what action the user can take next
- whether a primary CTA, secondary CTA, or link is needed

Return only the fields that apply, omitting any that aren't needed:

Title: ...
Body: ...
Primary CTA: ...
Secondary CTA: ...
Link: ...

## Rules
- Use sentence case throughout.
- Write a clear, direct title.
- Keep body copy to 1–2 short sentences.
- Explain why the state is empty when helpful.
- Focus on the next useful action.
- Use specific CTA labels, not generic labels. Keep CTAs to 2–4 words with a verb + noun structure where possible.
- Use Build (not Create) for automations, agents, and apps. Use Create for other objects.
- For links, use descriptive text that explains the destination. Do not use "Learn more" or "Click here".
- Avoid blame, filler, idioms, exclamation points, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**First-use empty state**
- Explain what this area is for.
- Help the user get started.
- Prefer a clear creation CTA. Use Build for automations, agents, and apps.

**No results**
- Say that no results matched.
- Suggest changing search terms or filters.

**Filtered empty state**
- Explain that the current filters return no results.
- Model: "No results match your filters. Try adjusting or clearing your filters."
- Offer a reset or clear-filters action when appropriate.

**No-data state**
- Briefly explain why nothing appears yet.
- Point to the most relevant next step.

**Post-action empty state**
- Explain that the item list or area is now empty.
- Only include a CTA if there is a meaningful next action.

## Examples of requests this skill should handle
- "Write an empty state for a new automations table"
- "I need a no-results state for search"
- "Draft copy for when filters return no results"
- "Rewrite this dashboard empty state to match our design system voice"

## Output example
**Title:** No automations yet
**Body:** Build an automation to start running workflows in this workspace.
**Primary CTA:** Build automation
