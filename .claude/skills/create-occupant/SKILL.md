---
name: create-occupant
description: Use when someone wants to create a new occupant in apollo-vertex (content that goes inside a surface such as a side panel, content area, or page header). Checks whether an existing component or occupant already fits, drafts the neutral view model from what the occupant shows, asks the spec questions in plain language, runs pnpm create:occupant, writes both example adapters and all copy, measures the minimum width, and runs the occupant checks until nothing is left to fill in. Never edits shared layers; writes a proposal instead.
---

# Create an occupant

An occupant is a pattern that goes inside a surface. Its spec says what space
it needs; it never names a template or a domain. The reasoning behind every
step is on **Guidelines > Design architecture > Creating occupants**
(`apps/apollo-vertex/app/guidelines/design-architecture/creating-occupants/page.mdx`). Point the
person there when they want the why.

Work in `apps/apollo-vertex`, on a branch that has `scripts/create-occupant.ts`.

**The goal is nothing left for the person to fill in.** You write the view
model, the copy, the descriptions, and both example adapters from the
conversation. The generator marks anything unknown with a placeholder token,
and `pnpm check:placeholders` must pass before you're done.

Never suggest invoices, claims, loans, or any other business example unless
the person brings one up. Ask about the content, not where it comes from.

## Shared layers are off limits

You change only the new occupant: its `registry/<name>/` folder (examples
included), its `app/patterns/<name>/` page, and the registration the
generator writes for it. Never edit the shared layers:

- the kit (`registry/occupant/`) and the occupant index
- the generator and every other script
- surfaces, composition specs, and templates
- tokens (`registry.json`'s theme, `app/globals.css`, `layout-tokens.ts`)
- tests and checks

If the occupant needs a change there (a field kind the generator lacks, a
token, a kit part, a surface behavior), stop. Write a proposal in
`registry/<name>/PROPOSALS.md`, one section each: what's needed, why this
occupant needs it, what it would change, and what the occupant does until
then. Tell the person it's there. Don't work around it inside the occupant.

CI enforces this: `check:occupant-scope` fails any commit that changes an
occupant together with anything outside it.

## House rules

- **Tokens only.** Every color, space, size, radius, and shadow comes from a
  token: the theme's Tailwind utilities (`bg-muted`, `gap-3`, `rounded-md`,
  `text-xs`) or a CSS variable (`p-(--surface-inset)`). No arbitrary values
  (`[13px]`, `#1f2937`, `rgb(...)`). When the design needs a value with no
  token, use the nearest token and list the missing one in
  `registry/<name>/PROPOSALS.md`: the value, where it's used, and why the
  nearest token isn't enough.
- **Sentence case** for all copy: the label, description, headings, empty
  message, and every other string. Only the first word, proper nouns, and
  acronyms start with a capital ("Key facts", not "Key Facts").
  `pnpm check:sentence-case` checks it, and runs in lint.
- **Build only what the person describes.** When something else would help
  (a filter, a group, an action, another field), don't build it: list it as a
  suggestion when you finish, with a sentence on why.
- **No pixels from the person.** Ask which surfaces it belongs in. The
  minimum width follows the surface, or is measured (step 5).

## 1. Look for one that already exists

Ask: "In a sentence or two, what does it show?" Before anything else, search
for something that already shows it:

- occupants: every item with `"layer": "occupant"` in `registry.json`
- patterns: `app/patterns/*/page.mdx`
- components: `registry/*/` and their items in `registry.json`

Show the person anything close, with a sentence on how it compares, and
ask: "Does one of these fit, or would it with a small change?" If one fits,
stop: they use it. If it would with a change to that one, that's a change to
something shared: write it up as a proposal in the conversation instead of
creating a near duplicate. Only go on when nothing fits.

## 2. Its view model

Ask about the shape of
each item: "What does each one have? A name, a short label, a value, a
note, a time?"

Draft the view model as JSON and show it to the person. Field names describe
the content, never a business ("title", "owner", "dueAt", not "invoiceTotal").

```json
{
  "item": "PascalCaseItemName",
  "collection": "camelCaseListName",
  "subject": "What the list is about, for accessible names.",
  "fields": [
    { "name": "name", "kind": "title", "description": "One sentence." },
    { "name": "role", "kind": "detail", "optional": true, "description": "One sentence." }
  ]
}
```

Pick each field's kind from how it should behave, and say why in plain terms:

- `title`: the item's main text; wraps. On a card, it stays on one line and
  truncates, with the full title in a tooltip.
- `label`: a short single line; truncates, with the full text in a title.
- `value`: the value in a label and value pair; shows "Not set" when empty.
- `detail`: secondary text; wraps.
- `meta`: small text, like a time; wraps.
- `figure`: a prominent value, like an amount; at the end of the title's line.
- `status`: a label with a tone (neutral, info, success, warning, error),
  shown as a colored dot, plus a count of any more ("+2").

Three options cover lists people work through. Add one only when the
person's description includes it; if the content suggests one they didn't
mention, save it as a suggestion for the end:

- `"selectable": true`: people pick an item, so it opens somewhere else.
  Items become cards, and a footer steps through them. The page owns the
  current item (`currentId`, `onSelect`).
- `"groups": true`: items are grouped under labels, like "Due today".
- `"filters": true`: tabs filter the list.

A selectable or filtered occupant is vertical only and scrolls itself, so
skip the scrolling question for it: `occupant`.

Mark a field optional when some items won't have it. Every field needs a
one-sentence description: it becomes the view model's doc comment and the
docs page's field table. Confirm the draft, then save it to a file in the
scratchpad (or a temp directory), not in the repo.

## 3. The spec questions

Ask one at a time, with the default in brackets:

1. **Name.** "What's a short name for it, lowercase with hyphens, like
   `key-facts`?" Check that `registry/<name>` doesn't exist.
2. **Label.** "What should people call it in docs and pickers?" In sentence
   case.
3. **Surfaces.** "Which surfaces does it belong in: a side panel, the
   content area, the page header?" [side panel and content area]. From the
   answer:
   - side panel or content area only: `--orientations vertical`
   - page header only: `--orientations horizontal`
   - the page header and either of the others: `--orientations both`. Ask:
     "Does the page header version show the same information, or less?"
     Less means two occupants sharing a view model; build the larger one
     first.
   - `--surfaces`: `none` when it's every surface of those orientations,
     otherwise the list, like `side-panel,page-header`.
   Never ask for a width in pixels. A vertical occupant's minimum follows
   the narrowest surface it belongs in (`--min-width follow`). A horizontal
   one starts from a guess of 160 and is measured in step 6.
4. **Padding.** "Inside the surface's padding, or edge to edge?" (padded or
   flush)
5. **Scrolling.** "When there's more than fits, should the surface scroll it,
   or does it scroll itself, like a table with a sticky header?" (surface,
   occupant, or either)
6. **Icon.** Propose a lucide icon that fits, and check it exists in
   `lucide-react`.

Then draft, from the conversation, and confirm:

All of it in sentence case.

- **Description:** one sentence on what it shows. It becomes the doc
  comment, the registry description, and the docs page's opening.
- **Subject:** a lowercase noun for its messages ("participants").
- **Empty message:** one sentence about what will appear here.
- **Two domains:** ask "Name two quite different places this data could come
  from." If they don't have two, propose two unrelated ones and confirm.

## 4. Generate

Pass every answer, so nothing is asked twice:

```bash
pnpm create:occupant <name> --view-model <file.json> \
  --label "<label>" --description "<sentence>" --icon <Icon> \
  --orientations <vertical|horizontal|both> --min-width <follow|160> \
  --padding <padded|flush> --scroll <surface|occupant|either> \
  --surfaces <none|a comma list of page-header, side-panel, content-area> \
  --subject "<noun>" --empty "<sentence>" \
  --primary-domain "<domain>" --secondary-domain "<domain>"
```

It lists anything still to fill in. With every flag given, that's only the
two example adapters.

## 5. Write both example adapters

Replace `registry/<name>/examples/primary.example-adapter.ts` and
`secondary.example-adapter.ts`. Each one, for its domain:

- A record type shaped the way that domain would store it: its own field
  names and types, not the view model's.
- A function that maps the record to the view model, formatting values
  (dates, money, units) for display and leaving optional fields out when the
  record has none.
- Realistic sample data: three to six items, with at least one optional
  field missing.
- With groups or filters: group labels the domain would use, and filters
  from the record's own states, with every item in one.
- A header comment: "EXAMPLE ADAPTER (primary|secondary). Not shipped: it
  shows how a solution (<domain>) maps its own data into the <label> view
  model. Adapters belong to solutions."
- Export the mapped view model as `PRIMARY` or `SECONDARY`.

Leave `stress.example-adapter.ts` and `examples/index.ts` as generated.

## 6. Measure the minimum width

```bash
pnpm measure:occupant <name>
```

It reports the floor for each example in each surface: the narrowest width
where nothing clips.

- **It follows the surface:** the floor must be at or below the surface's
  minimum. If it isn't, fix the layout (wrap or truncate what clips); don't
  raise the minimum.
- **It doesn't (a horizontal occupant):** set it to the floor with
  `pnpm measure:occupant <name> --apply`. Raise it only when the person,
  looking at the workbench, says it's hard to read there; then use `--set`
  with a width you choose and `--reason` saying why.

Both update the spec and the comment above `requires`. Point the person to
the workbench, `/preview/occupants?occupant=<name>`, to try it in every
surface, sample, state, and theme.

## 7. Run the checks

```bash
pnpm check:placeholders
pnpm check:sentence-case
pnpm generate:occupants --check
npx vitest run
pnpm exec playwright test --project=core occupants docs workbench -g "<name>"
pnpm exec playwright test --project=full occupants -g "<name>"
pnpm lint && pnpm lint:deps && npx tsc --noEmit -p .
```

Explain failures in plain language, fix them, and run again:

- **"Unfilled placeholders":** something wasn't written. Fill it in from the
  conversation.
- **"Sentence case":** a word after the first starts with a capital. Make it
  lowercase, unless it's a proper noun or an acronym.
- **"clipped" or "outside" at a width:** something doesn't fit at that width.
  Wrap or truncate that element, or raise the minimum to the measured floor.
- **"truncated without a title":** a truncated element needs its full text in
  a `title`.
- **An axe violation:** name the rule (for example `color-contrast`), the
  element, and the fix.
- **The registry dependency check:** the item's `registryDependencies` or
  `dependencies` don't match its imports. Add or remove the listed ones.
- **The spec unit test:** the orientations and scroll rule out every surface,
  or an example role is missing.
- **Stale occupant index:** run `pnpm generate:occupants`.
- **A dependency rule:** occupant code imported from `examples/`,
  `templates/`, or `app/`.
- **Occupant scope, in CI:** the commit changes something outside the
  occupant. Move that change out, as a proposal.

Commit the occupant on its own: its folder, its Patterns page, and the
registration the generator wrote, nothing else.

## 8. Done

Done means every check passes, including `pnpm check:placeholders`, with
nothing left for the person to write. Then tell them:

- what you built, and the workbench link to try it
- your suggestions: anything that would help but that they didn't describe
- any proposals in `registry/<name>/PROPOSALS.md`: tokens or shared changes
  it needs

A new docs page won't
show until the dev server rebuilds its page list, so they should stop it, run
`rm -rf .next/dev`, and start it again, before opening `/patterns/<name>`.
Don't restart a dev server the person started without asking.
