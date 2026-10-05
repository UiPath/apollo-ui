---
name: create-occupant
description: Use when someone wants to create a new occupant in apollo-vertex (content that goes inside a surface such as a side panel, content area, or page header), or runs /create-occupant. Guides them through it one step at a time on its own branch. It checks whether something already fits, asks what the occupant shows and where it goes in plain language, generates it, writes both example adapters and all copy, checks its own output, measures and tests it, gives workbench links, commits without pushing, and asks for feedback. Never edits shared layers; writes a proposal instead.
argument-hint: "[occupant-name]"
---

# Create an occupant

The occupant's name, if one was given: `$ARGUMENTS`

An occupant is a pattern that goes inside a surface. Its spec says what space
it needs; it never names a template or a domain. The reasoning behind every
step is on **Guidelines > Design architecture > Creating occupants**
(`apps/apollo-vertex/app/guidelines/design-architecture/creating-occupants/page.mdx`).
Point the person there when they want the why.

Work in `apps/apollo-vertex`. New occupants branch from this base:

```text
BASE = poc/design-architecture   (later: main)
```

Run the nine steps below in order, one at a time. Where a step asks
something, ask it and wait for the answer before going on. Don't run ahead
or combine steps.

**The goal is nothing left for the person to fill in.** You write the view
model, the copy, the descriptions, and both example adapters from the
conversation. The generator marks anything unknown with a placeholder
token, and `pnpm check:placeholders` must pass before you're done.

Never suggest invoices, claims, loans, or any other business example unless
the person brings one up. Ask about the content, not where it comes from.

## 1. Start a branch

If `$ARGUMENTS` is empty, first ask: "What's a short name for it, lowercase
with hyphens, like `key-facts`?" Check that `registry/<name>` doesn't exist
and that no branch `occupant/<name>` exists.

Check for uncommitted changes with `git status --porcelain`. Stop if there
are any, and say which files, with one exception: `apps/apollo-vertex/AGENTS.md`
may differ **only** by the block `next dev` writes. Check it with
`git diff -- apps/apollo-vertex/AGENTS.md`. It's the exception only when:

- no line is removed, and
- every added line is a blank line or part of the block from
  `<!-- BEGIN:nextjs-agent-rules -->` to `<!-- END:nextjs-agent-rules -->`.

Anything else in `AGENTS.md` stops the flow like any other change. Never
stage or commit that block.

Then:

```bash
git fetch origin
git switch -c occupant/<name> <BASE>
```

Use `origin/<BASE>` when there's no local branch of that name.

## 2. Look for one that already exists

Ask: "In a sentence or two, what does it show?" Then search for something
that already shows it:

- occupants: every item with `"layer": "occupant"` in `registry.json`
- patterns: `app/patterns/*/page.mdx`
- components: `registry/*/` and their items in `registry.json`

Show the person anything close, with a sentence on how it compares, and
ask: "Does one of these fit, or would it with a small change?"

- **One fits:** stop. Suggest using it.
- **One would, with a change:** stop. That's a change to something shared:
  describe it as a proposal to extend that one, instead of creating a near
  duplicate.
- **Nothing fits:** go on.

When you stop here, switch back to `<BASE>` and delete the empty
`occupant/<name>` branch.

## 3. What it's for

Ask one at a time:

1. **What it shows**, described without domain words: "people and their
   roles", not "the claim's adjusters". If the answer uses domain words,
   restate it neutrally and confirm.
2. **What it's for**: the task it helps someone do.
3. **Scope**: what it must show.
4. **What's left out**: what it deliberately doesn't do. This is what you
   won't build.

Say they can share a design reference (a screenshot, an image, a Figma
link). Use it for layout and hierarchy only. Its colors, spacing, and sizes
still come from tokens, and values with no token become proposals.

Then ask about each item: "What does each one have? A name, a short label,
a value, a note, a time?" Draft the view model and show it (see
[The view model](#the-view-model)). Confirm it, then save it to a file in
the scratchpad (or a temp directory), not in the repo.

## 4. Where it goes

Ask one at a time, with the explanation and the default in brackets. Use
these words; they're the Creating occupants page's.

1. **Surfaces.** "Which surfaces does it belong in? The page header is a
   wide, short band across the top. Side panels and the content area are
   columns that grow downward." [side panel and content area]
2. **Orientation.** It follows from the surfaces: the page header is
   horizontal, side panels and the content area vertical. Say which one
   that makes it. If it's both, ask: "Does the page header version show the
   same information, or less?" The same means one occupant with both
   orientations. Less means a separate occupant sharing this view model:
   build the larger one now, and note the smaller one for later.
3. **Padding.** "Should it sit inside the surface's padding, or run edge to
   edge, like a list whose rows reach the sides?" (padded or flush)
4. **Sizing.** "In a side panel, does it grow with its content, so it can
   share a tab with other occupants, or take the whole tab and scroll
   itself, like a document viewer?" (flow or fill) [flow]. Fill is vertical
   only, and a fill occupant scrolls itself, so skip the next question.
5. **Scrolling.** "When there's more than fits, should the surface scroll
   it, or does it scroll itself, like a table with a sticky header?"
   (surface, occupant, or either). Skip this for a selectable or filtered
   occupant: it scrolls itself.
6. **Two domains.** "Name two places this data could come from, in quite
   different lines of business." They must be from different verticals
   (not two kinds of insurance). If they don't have two, propose two
   unrelated ones and confirm.

**No pixel question.** Never ask for a width. A vertical occupant's minimum
follows the narrowest surface it belongs in. A horizontal one starts at 160
and is measured in step 6. It's raised only when the person gives a reason
(it's hard to read at the minimum), and the reason is written in the spec.

Then draft, from the conversation, and confirm, all in sentence case:

- **Label:** what people call it in docs and pickers ("Key facts"). It is
  also its title in a panel's tab or stack heading, as `<name>_title`.
- **Icon:** a lucide icon that fits. Check it exists in `lucide-react`.
- **Description:** one sentence on what it shows. It becomes the doc
  comment, the registry description, and the docs page's opening.
- **Subject:** a lowercase noun for its messages ("participants").
- **Empty message:** one sentence about what will appear here.

## 5. Generate, then check your own output

Pass every answer, so nothing is asked twice:

```bash
pnpm create:occupant <name> --view-model <file.json> \
  --label "<label>" --description "<sentence>" --icon <Icon> \
  --surfaces <a comma list of page-header, side-panel, content-area> \
  --padding <padded|flush> --sizing <flow|fill> \
  --scroll <surface|occupant|either> \
  --subject "<noun>" --empty "<sentence>" \
  --primary-domain "<domain>" --secondary-domain "<domain>" < /dev/null
```

It lists anything still to fill in. With every flag given, that's only the
two example adapters: write them (see [Example adapters](#example-adapters)).

Then review everything you wrote against this list, and fix what fails
before going on:

- [ ] **Scope only.** It shows what step 3 scoped, and nothing from
      "what's left out". Anything else that would help is a suggestion for
      the end, not code.
- [ ] **Tokens only.** No arbitrary values (`[13px]`, `#1f2937`, `rgb(...)`).
      Each value with no token uses the nearest token, and the missing one
      is listed in `registry/<name>/PROPOSALS.md`: the value, where it's
      used, and why the nearest token isn't enough.
- [ ] **Existing components.** It uses the kit (`registry/occupant/`) and
      the registry's components rather than rebuilding them.
- [ ] **Sentence case** in every string: only the first word, proper nouns,
      and acronyms start with a capital.
- [ ] **Only its own files.** `git status` shows changes only in
      `registry/<name>/` (examples included), `app/patterns/<name>/`, and
      the registration lines the generator wrote (its `registry.json` item,
      path alias, Patterns nav entry, `locales/en.json` keys, and the
      occupant index). Anything else needed goes in
      `registry/<name>/PROPOSALS.md` instead (see
      [Shared layers are off limits](#shared-layers-are-off-limits)).

Tell the person what you checked and what you changed.

## 6. Measure and check

```bash
pnpm measure:occupant <name>
```

It reports the floor for each example in each surface: the narrowest width
where nothing clips.

- **It follows the surface (the default):** the floor must be at or below
  the surface's minimum. If it isn't, fix the layout (wrap or truncate what
  clips) rather than raising the minimum.
- **It doesn't (a horizontal occupant):** set it to the floor with
  `pnpm measure:occupant <name> --apply`.
- **Raised on purpose:** only when the person says it's hard to read at its
  minimum: `--set <px> --reason "<why>"`. The reason goes in the spec.

Then run the occupant checks:

```bash
pnpm lint && pnpm lint:deps && npx tsc --noEmit -p .
npx vitest run
pnpm exec playwright test --project=core occupants docs workbench -g "<name>"
pnpm exec playwright test --project=full occupants -g "<name>"
```

Fix failures inside the occupant's own files only, and run again (see
[When a check fails](#when-a-check-fails)). When a fix would need a shared
file, don't make it: explain the failure in plain language, say what would
fix it, and add it to `PROPOSALS.md`.

## 7. Try it in the workbench

Check the dev server:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/preview/occupants
```

If it isn't running, tell the person to start it in `apps/apollo-vertex`
with `pnpm dev`, and wait. Don't start or restart a dev server they started
without asking. A new page may 500 until the dev server rebuilds its page
list: stop it, run `rm -rf .next/dev`, and start it again.

Then give the full links:

- Surface view: `http://localhost:3000/preview/occupants?occupant=<name>`
- Template view: `http://localhost:3000/preview/occupants?occupant=<name>&view=template`
- Patterns page: `http://localhost:3000/patterns/<name>`

In the workbench they can try every surface it claims, each sample, state,
and theme, and every width. Ask them to look, and make any changes they ask
for inside the occupant, re-running step 6 after each.

## 8. Commit

Stage only the occupant's files and its registration lines, never
`AGENTS.md`. Commit on `occupant/<name>` with a conventional commit:

```text
feat(apollo-vertex): add the <name> occupant
```

Check the commit, and don't push:

```bash
pnpm check:occupant-scope --range <BASE>..HEAD
git show --stat HEAD
```

List every changed file for the person.

## 9. Feedback

Ask: "Was anything unclear?" Wait for the answer. Then print a short
summary for them to paste into the team's feedback doc:

```text
Occupant: <name> (<label>)
Branch: occupant/<name>, commit <short hash>, not pushed
Decisions:
- Surfaces: <surfaces>, <orientation>, <padding>, scroll: <scroll>
- Minimum: <follows the side panel / measured at N px / raised to N px because ...>
- Domains: <primary>, <secondary>
- Left out: <what's left out>
Suggestions: <anything that would help but wasn't built, or none>
Proposals: <each item in PROPOSALS.md, or none>
Unclear: <what they said, or nothing>
```

---

## Reference

### Shared layers are off limits

You change only the new occupant: its `registry/<name>/` folder (examples
included), its `app/patterns/<name>/` page, and the registration the
generator writes for it. Never edit the shared layers:

- the kit (`registry/occupant/`) and the occupant index, beyond its own entry
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

### The view model

Field names describe the content, never a business ("title", "owner",
"dueAt", not "invoiceTotal").

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
- `label`: a short single line; truncates, with the full text in a tooltip.
- `value`: the value in a label and value pair; shows "Not set" when empty.
- `detail`: secondary text; wraps.
- `meta`: small text, like a time; wraps.
- `figure`: a prominent value, like an amount; at the end of the title's line.
- `status`: a label with a tone (neutral, info, success, warning, error),
  shown as a colored dot, plus a count of any more ("+2").

Three options cover lists people work through. Add one only when the
person's scope includes it; if the content suggests one they didn't
mention, save it as a suggestion for the end:

- `"selectable": true`: people pick an item, so it opens somewhere else.
  Items become cards, and a footer steps through them. The page owns the
  current item (`currentId`, `onSelect`).
- `"groups": true`: items are grouped under labels, like "Due today".
- `"filters": true`: tabs filter the list.

A selectable or filtered occupant is vertical only and scrolls itself.

Mark a field optional when some items won't have it. Every field needs a
one-sentence description: it becomes the view model's doc comment and the
docs page's field table.

### Example adapters

Replace `registry/<name>/examples/primary.example-adapter.ts` and
`secondary.example-adapter.ts`. Each one, for its domain:

- An item type shaped the way that domain would store it: its own field
  names and types, not the view model's.
- A function that maps the item to the view model, formatting values
  (dates, money, units) for display and leaving optional fields out when the
  item has none.
- Realistic sample data: three to six items, with at least one optional
  field missing.
- With groups or filters: group labels the domain would use, and filters
  from the item's own states, with every item in one.
- A header comment: "EXAMPLE ADAPTER (primary|secondary). Not shipped: it
  shows how a solution (<domain>) maps its own data into the <label> view
  model. Adapters belong to solutions."
- Export the mapped view model as `PRIMARY` or `SECONDARY`.

Leave `stress.example-adapter.ts` and `examples/index.ts` as generated.

### When a check fails

Explain failures in plain language, fix them inside the occupant, and run
again:

- **"Unfilled placeholders":** something wasn't written. Fill it in from the
  conversation.
- **"Sentence case":** a word after the first starts with a capital. Make it
  lowercase, unless it's a proper noun or an acronym.
- **"clipped" or "outside" at a width:** something doesn't fit at that
  width. Wrap or truncate that element.
- **"truncated without a title":** a truncated element needs its full text
  in a tooltip (`OccupantTruncatedText`) or a `title`.
- **An axe violation:** name the rule (for example `color-contrast`), the
  element, and the fix.
- **The registry dependency check:** the item's `registryDependencies` or
  `dependencies` don't match its imports. Add or remove the listed ones.
- **The spec unit test:** the orientations and scroll rule out every
  surface, or an example role is missing.
- **Stale occupant index:** run `pnpm generate:occupants`.
- **A dependency rule:** occupant code imported from `examples/`,
  `templates/`, or `app/`.
- **Occupant scope:** the commit changes something outside the occupant.
  Move that change out, as a proposal.
