# Button and CTA copy content pattern

---
name: button-and-cta-copy
description: generate product ui button labels and call-to-action copy following ux writing guidelines. use when drafting or revising primary buttons, secondary buttons, link ctas, menu actions, destructive actions, retry actions, or button sets during product design, prototyping, storybook work, and design system content creation.
---

Generate production-style button and CTA copy for product UI.

Interpret the user's request in natural language. Extract, when available:
- what action the user is taking
- what object the action applies to
- whether the action is primary, secondary, destructive, recovery, navigation, or menu-based
- whether the object already exists or is being created
- whether platform-specific terminology should be applied
- whether a paired button set is needed

Return only the fields that apply, omitting any that aren't needed:

Primary CTA: ...
Secondary CTA: ...
Link CTA: ...
Menu action: ...

## Rules
- Use sentence case throughout.
- Keep CTAs short, clear, and specific. Keep labels to 2–4 words maximum when possible.
- Prefer verb + noun when the object is not obvious from context.
- Do not use vague labels such as "Click here", "Learn more", "Go", "Submit", "Confirm", or "Continue" unless the context truly makes them the clearest option.
- Use specific destination or action language for links. Do not use the word "link" in link text — screen readers announce it automatically. Use consistent link text across pages when linking to the same destination.
- Use Build for agents, automations, or apps.
- Use Create for creating a new object that did not exist before.
- Use Add for adding an existing object to an existing list, group, view, or container.
- Use "Create new" or "Build new" only when a button triggers a dropdown for users to select from multiple object types — in this case "new" acts as the object. Do not use New as a standalone verb or in place of Create or Add.
- Use Select instead of Choose for clickable UI choices.
- Use Try again instead of Retry.
- Use Delete for permanent removal.
- Use Remove for taking something out of a list, group, or container without deleting it.
- Do not use Execute in the context of automations or jobs.
- Use Run as a verb only (e.g. "Run automation"). Never use Run as a noun — use Job instead.
- Avoid jargon, filler, idioms, exclamation points, and dramatic language.
- Do not add commentary, rationale, or multiple options unless the user explicitly asks.

## Patterns

**Primary CTA**
- Use the clearest action for the next step.
- Prefer specific action labels over generic progression labels.

**Secondary CTA**
- Use a safe supporting action such as Cancel, Back, Discard, or Clear when appropriate.

**Link CTA**
- Make the destination or outcome obvious.
- Do not use "Learn more" or "Click here".
- Do not include the word "link" in the text.

**Recovery CTA**
- Use Try again when an action failed and the user should repeat it.
- Make sure the surrounding copy explains what happened.

**Create vs Build vs Add**
- Use Build for agents, automations, or apps.
- Use Create for new objects such as projects, users, templates, or datasets.
- Use Add for existing objects being placed into an existing container.
- Use "Create new" or "Build new" only when triggering a multi-type dropdown.

**Destructive CTA**
- Use Delete for permanent removal.
- Use Remove when the object remains elsewhere.

## Examples of requests this skill should handle
- "Write a primary button for creating a project"
- "Draft CTA labels for building an automation"
- "I need a retry button for a failed upload"
- "Rewrite these actions to match our design system voice"
- "Write a primary and secondary button set for removing a user from a workspace"

## Output example
**Primary CTA:** Build automation
**Secondary CTA:** Cancel
**Link CTA:** Manage access
