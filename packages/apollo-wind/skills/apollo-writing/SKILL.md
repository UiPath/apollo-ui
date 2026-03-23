---
name: apollo-writing
description: Applies UiPath UX writing guidelines to UI copy — labels, buttons, errors, modals, empty states, and all microcopy. Use when writing or reviewing UI text, copy, or content for UiPath products.
---

# Apollo Writing

Guides AI-assisted UX writing with UiPath's content guidelines. Apply these rules when generating or reviewing any UI copy, labels, microcopy, or content strings.

## Core principles

- **Simple** — Plain, accessible language. Grade 6 reading level.
- **Consistent** — Same rules across all content; same word for same concept.
- **User-centric** — Focus on what the user can do, not what they can't.
- **Conversational** — Friendly, natural tone. Use contractions.
- **Accessible** — Globally understood language. No idioms or cultural references.

## Capitalization

Use **sentence case everywhere** — headings, titles, CTAs, labels, navigation.

- Capitalize: proper nouns, branded standalone products, first word of sentence.
- Do NOT capitalize: feature names, non-branded subfeatures, product-specific features.

```
✓ Build automation
✓ Automation template
✗ Build Automation
✗ Automation Template
```

## Contractions

Use common contractions to keep tone natural: aren't, can't, didn't, doesn't, don't, hasn't, isn't, it's, let's, shouldn't, won't, you'll, you're.

**Exception:** Use sparingly in error messages to maintain a calm, neutral tone.

## Numerals

Always use numerals in UI, even at sentence start:
```
✓ 3 items selected
✓ 48 hours
✗ Three items selected
```

## Punctuation

- **Oxford comma** in series of 3+ items.
- **Periods** only after complete sentences (body text, modal descriptions, helper text).
- **No periods** in: headings, labels, buttons, placeholders, navigation, tooltips (single sentence), radio/checkbox text.
- **No exclamation points** in UI. Exception: greetings only (e.g. "Hi, Satya!"). One per screen max.
- **Ellipsis** only for truncated/overflow text and loading actions. Never truncate labels, buttons, errors, or headings.

## Component-specific rules

### Buttons / CTAs
- Verb + noun format: 2–4 words max.
- Never "Click here" or "Go to somewhere." Use specific actions: "Access in...", "Manage in..."

### Labels
- Short; no punctuation after labels.
- Noun-based, not action phrases.

### Page / section headings
- Noun-based, not action phrases (except modals, where verb-first is OK).
```
✓ Process overview
✓ Configuration details
✗ Learn about processes
✗ Configure the settings
```

### Modals
Structure: **Title** (direct/descriptive) → **Body** (concise, only what's needed to act) → **CTAs** (primary on right).
```
Title: Delete this automation?
Body: This will permanently remove the automation and all associated logs. You can't undo this action.
CTAs: [Cancel] [Delete]
```

### Error messages
Structure: What happened → Why it matters (optional) → What to do next.
- Neutral and calm. No blame ("you forgot…"), no drama ("Oops!", "Uh-oh!").
- Use contractions sparingly.

```
✓ We couldn't save your changes. Check your connection and try again.
✓ You don't have permission to edit.
✗ Oops! Something went wrong.
✗ You did something wrong. Try again.
```

### Empty states
Clear headline + helpful actionable guidance + appropriate CTA.
```
✓ No results match your filters. Try adjusting or clearing your filters.
```

### Tooltips
- Supplementary, nonessential info only. ~2 lines max.
- Never for critical info, errors, or interactive content.
- Don't repeat the parent element's copy.

### Search fields
```
✓ Search by name or keyword
✓ Search projects or automations
✗ Search...
```

### Placeholders
- Additional hint/example only. Never replace a label.
- No period. Don't use for essential information.

## Inclusive writing

- Use "you" to address the user.
- Gender-neutral: use "they/them" for unknown gender.
- Never say "simple" or "easy" for tasks.
- No assumptions about skill level, background, or identity.

## Localization readiness

- No idioms or colloquialisms.
- No compound nouns — use prepositions instead.
- One idea per sentence; keep sentences short.
- Explicit pronouns — avoid ambiguous "it," "this," "that."
- Use single-word verbs over phrasal verbs where possible ("configure" not "set up", "complete" not "fill out"). Exception: established UI conventions ("sign in", "log out").

## Terminology (UiPath-specific)

| Term | Use |
|------|-----|
| **Add** | Adding an existing object to a container. Opposite: Remove. |
| **Build** | Use for agents, automations, apps. NOT Create. |
| **Create** | Creating a new object that didn't exist before. Opposite: Delete. |
| **Run** (verb) | Robot performing automated tasks. Never use as noun — use "job". |
| **Select** | Choosing from UI options. Avoid "Deselect" — use "Clear". |
| **Execute** | Do NOT use in context of automations or jobs. |
| **Try again** | For retry interactions. NOT "retry". |
| **Last updated** | Label for timestamp columns. |

## Validation checklist

Before finalizing any UI copy:

- [ ] Sentence case throughout
- [ ] Contractions used naturally
- [ ] Numbers as numerals
- [ ] No periods on labels/buttons/headings
- [ ] No exclamation points (except greetings)
- [ ] CTAs are 2–4 words, verb + noun
- [ ] No "Learn more" or "Click here" links
- [ ] Gender-neutral language
- [ ] No "simple" or "easy"
- [ ] No idioms or cultural references
- [ ] Correct UiPath terminology (Build vs Create, Run vs Execute, etc.)
