# Link copy content pattern

---
name: link-copy
description: generate product ui link copy following ux writing guidelines. use when drafting or revising inline links, action links, contextual help links, documentation links, navigation links, or related descriptive link text during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style link copy for product UI.

Interpret the user's request in natural language. Extract, when available:
- what the link points to
- whether the link is inline, action-based, contextual help, documentation, or navigation
- what the user will be able to do or learn after selecting the link
- whether the surrounding UI already provides enough context
- any product-specific terminology that should be used

Return only:
Link text: ...

## Rules
- Use sentence case throughout.
- Keep link text short, clear, and specific.
- Make the destination, action, or outcome obvious.
- Do not use the word "link" in link text — screen readers announce it automatically, making it redundant.
- Do not use vague link text such as Learn more, See more, Click here, or Read more unless the context truly makes it unavoidable.
- Prefer descriptive links such as View automation details, Manage access, Review retention policy, or Open run history.
- Use action-based wording when the link starts a task.
- Use destination-based wording when the link moves the user to a page, panel, or document.
- Use consistent link text across pages when linking to the same destination.
- Keep terminology consistent with the rest of the product UI.
- Avoid filler, idioms, exclamation points, jargon, and dramatic language.
- Do not repeat unnecessary context that is already obvious from the surrounding UI.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Inline help link**
- Make the topic obvious.
- Prefer specific labels such as Review password requirements or View workspace roles.

**Action link**
- Start with a clear verb.
- Make the object or destination explicit when needed.
- Do not use the word "link" in the text.

**Documentation link**
- Name the policy, guide, or topic clearly.
- Avoid generic labels.

**Navigation link**
- Use the destination name or a clear action tied to the destination.

**Contextual follow-up link**
- Tie the link directly to the next logical action after the surrounding message or state.

## Examples of requests this skill should handle
- "Write an inline link for viewing retention policy details"
- "Draft a link CTA for opening run history"
- "I need a descriptive help link for workspace roles"
- "Rewrite this link text to match our design system voice"

## Output example
**Link text:** Review retention policy
