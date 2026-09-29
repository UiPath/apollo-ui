---
name: create-occupant
description: Use when someone wants to create a new occupant in apollo-vertex (content that goes inside a surface such as a side panel, content area, or page header). Walks them through the occupant spec in plain language, runs pnpm create:occupant, then runs the occupant checks and explains any failures.
---

# Create an occupant

An occupant is a pattern that goes inside a surface. Its spec says what space
it needs; it never names a template or a domain. The reasoning behind every
question below is on the docs page **Guidelines > Creating occupants**
(`apps/apollo-vertex/app/guidelines/creating-occupants/page.mdx`). Point the
person there when they want the why.

Work in `apps/apollo-vertex`, on a branch that has `scripts/create-occupant.ts`.

## 1. Ask the spec questions

Ask these one at a time, in plain language. Don't assume a domain: never
suggest invoices, claims, loans, or any other business example unless the
person brings one up. Offer the default in brackets.

1. **Name.** "What's a short name for it, lowercase with hyphens, like
   `key-facts`?" It must be new: check that `registry/<name>` doesn't exist.
2. **Label.** "What should people call it in docs and pickers?"
3. **What it shows.** "In a sentence, what does it show?" You'll use this for
   the docs page and to shape the view model. Ask for the shape of the
   content (a list, pairs of labels and values, a sequence of steps), not
   where the data comes from.
4. **Shape of space.** "Does it work in a column that grows downward, like a
   side panel (vertical), in a wide, short band, like a page header
   (horizontal), or both?" If they want both, check: "Does the smaller
   version show the same information, or less?" If less, that's two
   occupants that share a view model; suggest creating the larger one first.
5. **Narrowest width.** "What's the narrowest width, in pixels, where this
   still works?" It's a first guess: the checks measure the real floor.
6. **Padding.** "Should it sit inside the surface's padding, or run edge to
   edge?" (padded or flush)
7. **Scrolling.** "When there's more content than fits, should the surface
   scroll it, or does it scroll itself, like a table with a sticky header?"
   (surface, occupant, or either)
8. **Built from a surface's parts.** "Is it built from one surface's own
   parts, so it only works there?" Usually no.
9. **Icon.** "Which lucide icon stands for it?" Check the name exists in
   `lucide-react`.

Summarize the answers back and confirm before running anything.

## 2. Run the generator

```bash
pnpm create:occupant <name> --label "<label>" --icon <Icon> \
  --orientations <vertical|horizontal|both> --min-width <px> \
  --padding <padded|flush> --scroll <surface|occupant|either> \
  --surfaces <none|page-header|side-panel|content-area>
```

Passing every answer as a flag keeps it non-interactive. Tell the person what
it wrote and registered (its output lists both).

## 3. Shape it

The generator writes stubs. With the person:

- Replace the view model stub in `registry/<name>/<name>.view-model.ts` with
  the real shape of the content. Keep it neutral: field names describe the
  content, not a business.
- Update `registry/<name>/<name>.tsx` to render it. Registry components can't
  have literal text: put copy in `locales/en.json` (English only, keys in
  alphabetical order) and use `t()`.
- Update both adapters in `examples/`. Add a second example adapter from a
  different domain. Keep the stress adapter hard: very long values, long
  unbroken tokens, many items, and missing or empty optional values.
- Truncate single-line labels (with the full text in `title`) and wrap
  everything else, so the minimum width holds for any data.
- Fill in `app/patterns/<name>/page.mdx`.

## 4. Run the checks

```bash
pnpm generate:occupants --check
npx vitest run tests/unit/occupant-specs.test.ts
pnpm exec playwright test --project=core occupants -g "<name>"
pnpm exec playwright test --project=full occupants -g "<name>"
pnpm lint && pnpm lint:deps && npx tsc --noEmit -p .
```

Explain failures in plain language:

- **"clipped" or "outside" at a width:** something doesn't fit at that width.
  Either the occupant needs to truncate or wrap that element, or the
  minimum width is too small. Find the narrowest width where it passes for
  every example: that's the measured floor. Set `minWidth` at or above it.
- **"truncated without a title":** a truncated element needs its full text in
  a `title` attribute.
- **An axe violation:** name the rule (for example `color-contrast` or
  `scrollable-region-focusable`), which element, and the fix.
- **"claims at least one surface" or the spec unit test:** the orientations
  and scroll rule out every surface, or the spec is missing a label, a
  stress example, or a whole-number minimum width.
- **Stale occupant index:** run `pnpm generate:occupants`.
- **Dependency rule:** occupant code imported from `examples/`, `templates/`,
  or `app/`. Occupants never depend on those.

## 5. See it

A new docs page won't show until the dev server rebuilds its page list: stop
the dev server, run `rm -rf .next/dev`, and start it again. Then open
`/patterns/<name>`. Don't restart a dev server the person started without
asking.
