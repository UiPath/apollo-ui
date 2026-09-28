# Search and filter copy content pattern

---
name: search-and-filter-copy
description: generate product ui search and filter copy following ux writing guidelines. use when drafting or revising search field labels, placeholder text, filter labels, filter helper text, reset actions, no-results states, filtered-empty states, result summaries, or related product ui copy during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for search and filter UI.

Interpret the user's request in natural language. Extract, when available:
- what users are searching for
- what users are filtering
- whether the request is for a search field, filter label, empty state, result summary, or reset action
- whether the state is default, no results, filtered empty, or cleared
- what action the user can take next
- any product-specific terminology that should be used

Return only the fields that apply, omitting any that aren't needed:

Search field label: ...
Search field placeholder: ...
Filter label: ...
Helper text: ...
Empty state title: ...
Empty state body: ...
Primary CTA: ...
Secondary CTA: ...

## Rules
- Use sentence case throughout.
- Keep search and filter copy short, clear, and specific.
- Always include a label for search fields. Do not rely on placeholder text alone — it hides context and creates accessibility issues.
- Use placeholder text to describe what users can search for, not how to type. Avoid vague placeholder text like "Search..." when more specific guidance would help.
- Keep filter labels concise and distinct. Use nouns, not verbs.
- Use helper text only when it adds necessary guidance.
- For no-results states, clearly say that no results matched.
- For filtered-empty states, make it clear that current filters produced no results.
- When helpful, suggest the next action such as changing search terms or clearing filters.
- Use specific CTA labels, not generic labels. Keep CTAs to 2–4 words with a verb + noun structure where possible.
- For filter reset actions: use "Clear all filters" or "Reset filters". Do not use "Cancel" or "X".
- Avoid blame, filler, idioms, exclamation points, jargon, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Search field**
- Always include a label for accessibility.
- Describe what can be searched in the placeholder.
- Do: "Search automations", "Search by name or keyword", "Search users and groups"
- Don't: "Search..."

**Filter label**
- Use a short noun or noun phrase.
- Keep labels parallel across related filters.
- No two filter labels should start with the same word or phrase.

**No-results state**
- Say that no results matched the search.
- Suggest changing search terms when helpful.

**Filtered-empty state**
- Explain that the selected filters returned no results.
- Model: "No results match your filters. Try adjusting or clearing your filters."
- Offer a clear reset action when appropriate.

**Result summary**
- Keep the summary concise and factual.
- Avoid conversational filler.

**Reset action**
- Do: "Clear all filters", "Reset filters"
- Don't: "Cancel", "X"

## Examples of requests this skill should handle
- "Write label and placeholder text for a search field that searches automations and folders"
- "Draft filter labels for status, owner, and last run"
- "I need a no-results state for search"
- "Write copy for when selected filters return no results"
- "Rewrite this search and filter UI to match our design system voice"

## Output example
**Search field label:** Search
**Search field placeholder:** Search automations and folders
**Filter label:** Status
**Empty state title:** No results
**Empty state body:** No results match your search or filters. Try adjusting your search term or clearing your filters.
**Primary CTA:** Clear all filters
