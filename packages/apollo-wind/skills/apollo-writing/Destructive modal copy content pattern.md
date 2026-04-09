# Destructive modal copy content pattern

---
name: destructive-modal-copy
description: generate copy for destructive or confirmation modals following ux writing guidelines. use when drafting or revising modal title, body, and cta text for actions like delete, remove, discard, leave, revoke, or other high-risk confirmation flows during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style copy for a destructive confirmation modal.

Interpret the user's request in natural language. Extract, when available:
- action
- object
- consequence
- whether the action is permanent or reversible
- any important context such as access loss, data removal, or unsaved changes

Return only the fields that apply. Secondary CTA is optional — omit it if the modal only requires a single action.

Title: ...
Body: ...
Secondary CTA: ...
Primary CTA: ...

## Rules
- Use sentence case throughout.
- Write a direct, descriptive title, usually as a question.
- Keep body copy to 1–2 short sentences.
- State what will happen.
- If there is a meaningful consequence, include it.
- Only say the action cannot be undone when it is truly irreversible.
- Use Delete for permanent removal.
- Use Remove for taking something out of a list, group, or container without deleting it.
- Use specific CTA labels, not generic labels. Keep CTAs to 2–4 words with a verb + noun structure where possible.
- Default secondary CTA to Cancel unless the user's context clearly calls for a different safe option.
- Avoid blame, filler, idioms, exclamation points, and dramatic language.
- Use contractions sparingly.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Examples of requests this skill should handle
- "Write copy for a modal to delete an automation"
- "I need a confirmation dialog for removing a user from a workspace"
- "Draft title/body/button text for discarding unsaved changes"
- "Rewrite this delete modal to match our design system voice"

## Modal patterns

**Permanent deletion**
- Title should clearly name the action and object.
- Body should explain what will be removed and whether it can be undone.
- Primary CTA should be Delete + object when helpful.

**Non-destructive removal**
- Use Remove, not Delete.
- Explain what access, association, or placement is changing.
- Do not imply permanent loss unless true.

**Unsaved changes or exit confirmation**
- Be explicit about losing edits or leaving the current flow.
- Prefer concise, plain-language consequences.

**Access revocation**
- State whose access is being revoked and to what.
- Clarify whether the person can be re-added or access restored.
- Use Revoke access as the primary CTA, not Delete or Remove.

## Output example
**Title:** Delete this automation?
**Body:** This will permanently delete the automation and all associated logs. You can't undo this action.
**Secondary CTA:** Cancel
**Primary CTA:** Delete automation
