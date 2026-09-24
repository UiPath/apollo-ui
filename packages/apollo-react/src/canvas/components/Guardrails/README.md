# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Lives in apollo-react next to canvas — MUI-free, built
entirely on `@uipath/apollo-wind` primitives and its `forms/` engine, strings on lingui —
and is exported through the narrow `@uipath/apollo-react/canvas/guardrails` subpath (also
re-exported from `./canvas`). Members: the definitions layer (wire types, parser, canonical
copy and `useGuardrailDefinitions`), `GuardrailList` (the applied-guardrails section),
`GuardrailPalette` (the add-guardrail picker), `GuardrailRemoveDialog` (the removal
confirmation), `GuardrailBuilder` (the whole Add/Edit screen), `GuardrailFormLayout` (the
screen shell), `GuardrailValidatorForm` (the validator parameter section, also rendered
inside the builder), `GuardrailActionSection` + `EscalateActionFields` (the builder's action
and escalation half), and `CentralizedGuardrailsSection` + `CentralizedGuardrailDetails` (the
read-only governance guardrails a policy enforces), plus the leaves the sections compose:
`GuardrailStatusChip`, `GuardrailStatusBanner` and `MixedScopesBanner`.
`GuardrailScopeSelector`, the builder's scope and tool targeting field, is exported on its own
too.

## Hover and focus, family-wide

Hover is never a prop. No wind primitive takes one, and neither does anything here: a component
derives it from the interaction it offers, so a host that wires up callbacks gets the right
affordances without styling anything. What differs between members is the element's role, and
that decides the treatment:

- **The element is itself a control** (the palette item, the centralized row, the guardrail
  list's activatable row body): gate the hover on being enabled, and pair it with `cursor-pointer`
  and an explicit `focus-visible` ring, the way wind's `Button` and `DropdownMenuItem` do.
- **The element is a row that contains controls** (the guardrail list row, with its drag handle
  and its actions): highlight unconditionally, the way wind's `TableRow` does, with no cursor
  change. Focus belongs to the controls inside it.

Use `accent` for the hover surface. Apollo maps `--accent` to `--surface-hover`, while `--muted`
is `--surface-overlay`, the raised panel these sections usually sit on: hovering with `muted`
paints a row the colour of its own background and barely reads.

## Definitions layer

Turns the `GET /api/execution/guardrails/definitions` payload into the
`GuardrailDefinition`s the builder renders. Three pure steps and one hook over them:

```
unknown payload → parseGuardrailDefinitions → enrichGuardrailDefinitions → GuardrailBuilder
                       (zod, private)          (canonical copy on lingui)
                                    useGuardrailDefinitions composes all three
```

```tsx
import { useGuardrailDefinitions } from '@uipath/apollo-react/canvas/guardrails';

const { definitions, invalid, loading, error, refetch } = useGuardrailDefinitions({
  baseUrl: `/${orgName}/${tenantName}/agents_`, // omit for same-origin
  tenantId,
});
```

Three host shapes, all supported:

| Host | Call |
| --- | --- |
| Owns no transport | `useGuardrailDefinitions({ baseUrl, tenantId })` |
| Already has SWR or React Query | `useGuardrailDefinitions(null, { definitions: data })` |
| Never fetches (Flow's vsix, over postMessage) | `useGuardrailDefinitions(null, { definitions: fromMessage })` |

Keep the context `null` in the last two rows. A host that passes a live context *and* an
asynchronous `definitions` has a window where its own payload is still `undefined`, which the
hook would otherwise read as its cue to fetch; `enabled: !isLoading` closes that window when
the context has to stay live.

`options.definitions` wins over the context: when it is present no request is made at all, and
the value is parsed and enriched instead. That is the seam that lets a product keep its own
cache rather than adopting a second one, and it is why the hook stays a `useState` plus
`fetch` plus `AbortController` (the `useDiscoveryModels` idiom) instead of a query library.

### Contract

- **The parser never throws.** `parseGuardrailDefinitions(unknown)` returns
  `{ definitions, invalid, inputError? }`. A payload that is not an array sets `inputError`;
  an individual definition that fails validation is dropped whole and listed in `invalid`,
  which is what both products already do entry by entry. Unknown keys are stripped. Surface
  `invalid` as a status banner, never as an error page: the other definitions are fine.
- **Transport errors and data errors are different channels.** `error` is a failed request.
  A malformed payload arrives through `invalid` / `inputError` with `error` still `null`.
- **zod does not cross the boundary.** The schema is private to `definitions-parse.ts`;
  `GuardrailDefinitionWire` is hand-written, and the two are pinned to each other by a
  compile-time assignability check in `toWireDefinition` plus two tests (a key-set assertion
  and a source-level import guard), so the emitted `.d.ts` for this folder carries no schema
  types and consumers take no zod dependency.
- **Enrichment is pure and exported.** `enrichGuardrailDefinitions(wire, { copy, hiddenValidators })`
  is React-free, so non-React and bridge callers use it directly.
  `EnrichedGuardrailDefinition extends GuardrailDefinition`, so its output feeds
  `GuardrailBuilder` with no mapping.
- **Context and `hiddenValidators` are compared by content, not identity**, so a host can
  build them inline. (`useDiscoveryModels` compares the context by identity; an inline object
  there refetches on every render and never settles.) `options.definitions` is the exception,
  compared by identity because hashing a whole payload every render would cost more than it
  saves: pass a stable reference (an SWR or react-query result already is).
- **`loading` starts `true` when the hook is about to fetch**, so a host rendering
  `loading ? <Spinner/> : <Empty/>` does not flash the empty state on first paint. It starts
  `false` when the hook is disabled (`null` context, or `options.definitions` supplied), and
  `refetch()` is a no-op in that state.
- **A failed request keeps the previous results.** `error` is set and `definitions` still hold
  the last good payload, so a transient 503 on a `refetch` does not empty a list the user is
  looking at. Render on `error` first if you want it to replace the data. Disabling the hook
  does clear the fetched state.
- **`hiddenValidators` hides nothing by default** and never hides a BYO definition. Which
  validators a product exposes is an entitlement decision, so it stays with the caller: Flow
  passes `['prompt_injection']`, Agents passes nothing.
- **BYO folder placement stays host-side.** Resolving it needs each product's connections API
  (Agents pages `fetchResources`, Flow calls `getConnectionById`), so the hook does not reach
  for it. Stamp the result on afterwards:

  ```ts
  const withFolders = withGuardrailFolderMetadata(definitions, (id) => connections.get(id));
  ```

### Canonical copy

The display copy for the six built-in validators lives here, as lingui messages in the shared
canvas catalog, rather than in each product's own table. Both products get the same wording,
and the strings enter the real localization pipeline instead of a host-side constant.

**English only, like every other string in this package.** The other thirteen catalogs get
these ids from `chore(l10n): sync from Localization`, which appends new keys every week or
two. Until it runs, `useSafeLingui` renders the English default, so nothing is missing on
screen. Do not hand-write translations here.

This narrows, deliberately, the rule the family shipped with in #1138: that domain copy never
ships in this package. The rule still holds for copy this package cannot know, which is why
wire copy wins at parameter level and a BYO definition takes no curated copy at all. What
moved is the six validators both products had already transcribed by hand, where keeping two
copies in sync is what produced `finNationalId` in one product and `fiNationalId` in the
other. The components are unchanged: they still resolve nothing and render what they are
handed, so a host that would rather keep its own table simply does not call
`enrichGuardrailDefinitions`.

Message ids use the raw wire values, never a transcribed slug:

```
guardrails.definitions.<validator>.display-name | .description | .usage-note
guardrails.definitions.<validator>.param.<paramId>.label | .tooltip
guardrails.definitions.<validator>.option.<paramId>.<RawWireValue>
```

Transcribing is exactly how the two products ended up keying the same Finland entity as
`finNationalId` and `fiNationalId`; `USSocialSecurityNumber` is the value we persist, so it is
also the id.

Copy precedence, unchanged from what both products already do:

| level | non-BYO | BYO |
| --- | --- | --- |
| display name | curated, wire, `validator` | wire, `validator` |
| description | curated, wire, `''` | wire, `''` |
| usage note | curated only | none |
| parameter label | **wire**, curated, humanized id | wire, humanized id |
| parameter tooltip | **wire**, curated | wire |
| option labels | curated merged under wire | wire only |

Curated wins at definition level because that table is what product and localization review;
wire wins at parameter level because a BYO manifest and a newly shipped backend parameter
describe themselves. A BYO definition takes no curated copy at any level, even when its
validator id collides with a UiPath one.

Where the two products' English differed, the choice is declared with a reason in
`definitions-parity.test.ts` (17 entries) and asserted against both products' transcribed
copy in `__fixtures__/host-copy-baselines.ts`. That suite fails on an undeclared difference,
a stale declaration, or a third wording we invented, so the table cannot quietly drift from
the products it is meant to replace.

`GUARDRAIL_COPY_EN` is the English table the pure layer defaults to;
`GUARDRAIL_COPY_EN_MESSAGES` is the same copy flattened to id-to-English, exported so hosts
can diff their remaining local tables against it in CI while they migrate off them.

> `src/canvas` uses no lingui macros, so `lingui extract` does not feed this catalog: its
> English entries are hand-authored. Two tests do what extraction would: every message reaches
> `src/canvas/locales/en.json` with the same English, and no catalog keeps a
> `guardrails.definitions.*` id the source has dropped. The second scans all fourteen files,
> so a rename cannot leave the sync's translations behind as dead entries.

## GuardrailList

The guardrails applied to an agent or a tool: an ordered list of rows with add, edit, remove
and reorder affordances, the two bring-your-own configuration notices, and optional status
chips. A row highlights on hover, the way the legacy entries and the centralized section's rows
do, whether or not clicking it opens the editor: it is the target for the drag handle and the
row actions either way.

```tsx
import { GuardrailList } from '@uipath/apollo-react/canvas/guardrails';

<GuardrailList
  guardrails={visibleGuardrails}   // already filtered by the host
  definitions={definitions}        // already filtered by the host
  disabled={isReadOnly}
  onAdd={openPalette}
  onEdit={openBuilder}
  onRemove={confirmRemoval}
  onReorder={(reordered, move) => persist(spliceBack(reordered, move))}
/>;
```

### Contract

- **The host filters, the list renders.** Feature flags, entitlements and scope filtering
  never cross this boundary: both products decide what a user may see, then pass the
  survivors as `guardrails` and `definitions`. The list renders every row it is given, even
  one whose definition never arrived.
- **Callbacks are intents.** `onRemove` reports the request; the confirmation dialog, the
  scoped-removal unwind and the write stay host-side, because the two products confirm with
  different copy and unwind tool-scoped guardrails differently. Same for `onAdd` and
  `onEdit`. No telemetry ships in the package: hosts wrap their own callbacks.
- **`onReorder` reports the visible array plus the move** (`{ from, to, id }`), so a host
  rendering a filtered view (Flow's per-tool view over an agent-level list) can splice the
  result back without this component knowing a fuller list exists.
- **`definitions` is read for three things only**: the provider line, the two BYO notices and
  the status chip. Rows resolve by validator id, and a BYO row by its validator name alone,
  which is the rule both products already ship (the name is unique per tenant, so an admin
  rebinding a configuration to another connection still resolves).
  `resolveGuardrailListItemState` is exported for hosts needing the same answer outside a row.
  The type is the minimum the list reads, so `useGuardrailDefinitions`' output feeds it
  unchanged, and so does a product's own definition type.
- **The BYO notices keep the "definitions have loaded" guard.** While the array is empty no
  row claims its configuration is gone, which is what both products already do; without it
  every BYO row flashes the notice for as long as the catalog takes to load.
- **Every addition is opt-in**, so adopting the list behind a flag renders what the host
  renders today and the new UI arrives deliberately:

  | prop | default | why |
  | --- | --- | --- |
  | `statusChips` | `false` | Neither product chips definition status or administration today. The two BYO notices are *not* gated: both products already show those, and a guardrail that cannot run is not an opt-in detail. |
  | `previewChip` | `false` | Product lifecycle, not a package concern. Both hosts pass it today and drop it at GA without a release here. |
  | `byoChip` | `false` | Whether a bring-your-own row is badged as such. Agents shows it, Flow does not, so it cannot be inferred from `state.isByo`. Rendered before `previewChip`, since a BYO row is also a built-in validator: provenance first, then lifecycle. |
  | `reorderDisabled` | `disabled` | Agents stops reordering in a read-only list and Flow does not, so one flag could not express both. Flow passes `false`. |
  | `unstyled` | `false` | Agents renders inside its own section accordion, where the card border and padding are extra chrome. |
  | `hideHeader` | `false` | Agents owns the section title and its add affordance. |
  | `footer` | none | Agents' add affordance sits *below* the rows and swaps itself for an entitlement line, which the header-only `addSlot` cannot express. |
  | `emptyState` | the default line | Agents renders nothing when empty: pass `null`. An explicit `null` is honoured, so the check is for an absent prop, not a falsy value. |
  | `rowActivatesEdit` | `false` | Agents opens the editor by clicking the row body. The body becomes a `role="button"`, whose children ARIA treats as presentational, so the status and administration chips, the BYO notices and the description are named in its `aria-describedby`, in that reading order. The chips are state that changes what activating the row does. The lifecycle `Preview` chip, the provider line, the action badge and the scopes stay presentational: a host that needs those announced should render them outside the activatable body. |
  | `renderItemActions` | inline buttons | Agents' actions are an overflow menu. The slot receives `defaultActions`, so it can add to them instead of replacing them. |
  | `renderRowTooltip` | none | Agents hovers a combined description, provider and scopes tooltip over the row body. A tooltipped body that is not activatable gets `tabIndex={0}`, so the content opens on focus as well as hover. On an activatable row the body's own `aria-describedby` wins over the open tooltip's, because Radix `Slot` lets the child's non-handler props override the slot's; that is the intended precedence, since the tooltip only repeats row metadata the row already announces. |
  | `formatScopes` / `formatAction` | raw values | Scope and action wording is product copy; return `null` to hide either line. |
  | `getItemId` | `id ?? name` | Flow keys rows by `id`, Agents by `name`. |
  | `getItemAdministration` | `'local'` | Governance-managed guardrails come from a different endpoint, so nothing on the record identifies them. |

  So Flow passes `previewChip` and `reorderDisabled={false}`; Agents passes `previewChip`,
  `byoChip`, `unstyled`, `hideHeader`, `emptyState={null}`, `footer`, `rowActivatesEdit`,
  `formatAction={() => null}`, `formatScopes`, `renderItemActions` and `renderRowTooltip`.

- **Reorder is real dnd-kit, and keyboard operable.** Pointer and keyboard sensors, vertical
  and parent-bound modifiers, and a drag handle that is a real button: Agents' handle today is
  an `aria-hidden` icon carrying the listeners, so it cannot be reached from the keyboard.
  That is a fix, not a regression. With reorder off, or with a single row, no drag machinery
  is mounted at all: the sensors are hooks, so they live in a `SortableRows` component
  alongside the `DndContext` rather than in `GuardrailList`, where they would run for every
  non-reorderable list.
- `renderRowTooltip` brings its own `TooltipProvider`, because a row renders where none is
  guaranteed. The body it anchors to is focusable either way (`role="button"` when the row
  activates edit, `tabIndex={0}` when it does not), so the tooltip is reachable by keyboard
  and not pointer-only.
- **Every row action names its row.** The Edit and Remove buttons are the same two icons on
  every row, so a generic "Edit guardrail" leaves a screen-reader user tabbing the actions
  column unable to tell which row they are on. Both take a `{{name}}` template (`editRow`,
  `removeRow`), and the generic labels (`editItem`, `removeItem`) stay as the fallback for a
  row with no name, where the template would announce "Edit ".
- **Error text is `text-error`, not `text-destructive`.** The two resolve differently in
  several `tailwind.consumer.css` theme blocks and wind's `FormFieldError` settled on
  `text-error`. The BYO notices keep `role="alert"` rather than the family banner's
  `role="status"`: Flow announces them on mount today and the shared row keeps that parity.

### Chips and notices

`GuardrailStatusChip` is a `<span>` carrying wind's exported `badgeVariants` plus the chip
family's pill geometry. Composed from the variants rather than the `Badge` component because
`Badge` renders a `<div>`, and the palette entry places these chips inside its `<button>`,
where flow content is invalid. It is deliberately **not** `GuardrailChip`, which wraps a Radix
`Toggle`: these are read-only labels, and rendering them as toggles would put fake buttons in
the tab order and misreport them to screen readers.

`getGuardrailListChips` is the mapping, exported and pure. An `Available`, locally
administered row chips nothing, which is the common case and keeps the list quiet.
`FeatureDisabled` and `Unauthorised` chip as warnings; `Disabled` and the synthetic
`Unavailable` (a BYO row whose definition stopped resolving) chip as errors.

The administration axis is deliberately **not** called "origin": both products already use
that word for BYO versus UiPath-managed validators (`GuardrailOriginChip`,
`CentralizedGuardrailOriginBadge`), which is a different axis and travels on
`byoValidatorName`. Governance-managed guardrails still render in each product's separate
centralized section; this ships the chip and the seam, so either layout stays possible.

`GuardrailStatusBanner` and `MixedScopesBanner` are exported for hosts composing their own
chrome. The list itself takes one `statusBanner` slot above the rows (a definitions load
failure, say) rather than a typed banner prop: the mixed-scopes banner ends in a "Save as
new" hint, which is builder copy, and both products render it inside a builder rather than
over a list.

### Localization

Chrome strings resolve through `useGuardrailListLabels` (lingui, `guardrails.list.*` ids in
the shared canvas catalog); `labels` overrides any of them and wins over the catalog. Twelve
of the seventeen take their English from Flow's canvas catalog, so the wording is what the
product already ships; the other five have no host equivalent and are newly written here:
`edit-row`, `status-feature-disabled`, `status-disabled`, `status-unavailable`,
`administration-governance`.

**English only**, like the canonical copy above: the other thirteen catalogs get these ids
from `chore(l10n): sync from Localization`, and until it runs `useSafeLingui` renders the
English default, so nothing is missing on screen. The five newly written ids are the ones that
need a real loc pass rather than a lookup.

## GuardrailPalette

The add-guardrail picker: the definitions a user may add, grouped, with an optional
create-custom entry.

```tsx
import { GuardrailPalette } from '@uipath/apollo-react/canvas/guardrails';

const { definitions, loading, error } = useGuardrailDefinitions({ baseUrl, tenantId });

<GuardrailPalette
  ootbDefinitions={addable}          // already filtered by the host
  isLoading={loading}
  error={error}
  previewChip
  onSelectOotb={openBuilderFor}
  onCreateCustom={scope === 'Tool' ? openCustomBuilder : undefined}
/>;
```

### Contract

- **The host filters, the palette offers.** Feature flags, entitlements, `FeatureDisabled` /
  `Disabled` removal and Tool-scope filtering never cross this boundary: both products
  already filter before rendering, and both do it differently (Agents gates five per-validator
  flags, Flow one `canvas.guardrails` flag plus a hidden-validator list). The palette offers
  every definition it is given.
- **Both callbacks are intents.** `onSelectOotb` reports the choice; the builder that opens
  next, the unique default name it starts with and the telemetry stay host-side. No telemetry
  ships in the package: the two products' event taxonomies do not overlap
  (`guardrails.create_ootb_clicked` versus `GUARDRAILS_CREATE_OUT_OF_THE_BOX_CLICKED`) and
  wrapping the callbacks is what both adapters do anyway.
- **`onCreateCustom` is opt-in by presence, not by a boolean.** Flow offers custom guardrails
  only for `scope === 'Tool'`, so it passes the prop conditionally. Agents keeps the affordance
  in its own palette header, so it omits the prop and the picker renders no second one.
- **Grouping is the rule both products already ship** (`groupGuardrailsForPalette`, exported
  and pure): with no bring-your-own definitions, one unheaded group in payload order;
  otherwise one group per BYO `folderPath ?? byoConnectorName`, sorted by that key, then a
  trailing UiPath group, with display-name sorting inside every group. One deliberate
  difference: an empty catalog produces **no** groups rather than one empty group, which is
  what makes the empty line reachable. Flow's own empty state is guarded on
  `groups.length === 0` and its implementation can never return that.
- **Entry identity is `validator`, or `byoValidatorName:byoGuardrailConnectionId`**
  (`getGuardrailPaletteItemId`). A BYO validator name is unique per *connection*, so two
  connections can expose the same name; Flow keys BYO entries by name alone today and collides
  in exactly that case. This is not the same question as `matchesGuardrailListDefinition`,
  which resolves a *saved* guardrail and matches BYO on the name alone on purpose.
- **`Unauthorised` is offered, chipped and not choosable.** It is the only non-`Available`
  status that reaches a correctly filtered palette, and it is how a tenant discovers a
  validator it is not entitled to. The entry is `aria-disabled`, not `disabled`, so it keeps
  its place in the roving focus order and a keyboard user reaches the chip that says why. Agents
  today lets that entry through to the builder, which then refuses to save; Flow disables it in
  the select, and that is the behaviour this ships.
- **The palette is one tab stop, and Arrow/Home/End move inside it.** Roving `tabIndex`: exactly
  one entry is tabbable, Tab enters the palette and Tab leaves it, ArrowDown / ArrowUp step
  between entries across group boundaries, Home and End jump to the first and last, and the tab
  stop follows focus so leaving and re-entering comes back where the user was. Movement is
  clamped at the ends rather than wrapped. The create-custom entry is the first in that order,
  and `aria-disabled` entries are *included*: reaching the `Unauthorised` chip is the point.
  This is also why the picker is a list of real `<button>`s rather than wind's `Command`, whose
  cmdk navigation skips `aria-disabled` items by construction, and why it is not a `Select`:
  palette entries are one-shot actions, not a selection.
- **`previewChip` defaults to `false`**, the same call as the list: product lifecycle is not a
  package concern. Both hosts hardcode the chip today and both pass the prop, then drop it at
  GA without a release here.
- **`isLoading` renders a polite loading line and `error` a `GuardrailStatusBanner`.** The
  loading line is an `<output>`, for its implicit `role="status"`: a polite live region, and the
  one native element that carries it without bringing styling of its own. Any definitions that
  did arrive stay pickable under the banner, which is what a host with a stale cache and a
  failed revalidation wants. `error` is shaped like `useGuardrailDefinitions`' own `error`, so
  the hook's result destructures straight in.
- **Definitions are generic.** `GuardrailPaletteDefinition` is the eight fields the palette
  reads; `EnrichedGuardrailDefinition` satisfies it, and so does a product's own definition
  type. The component is generic over it, so `onSelectOotb` hands back the object the host
  passed in, `parameters` and all, and there is nothing to look up again.

- **Entry styling is the family-wide control treatment** (see "Hover and focus,
  family-wide"), not this family's chip idiom: wind's interactive-item classes with the
  leading icon on `text-muted-foreground`, like the rest of the family.

### What the palette is not

Only the picker ships. The shell is host orchestration, because the two products disagree and
both are right for their surface: Flow opens a 500px dialog, or an inline properties-panel
overlay that renders the chosen builder underneath the picker; Agents takes over the whole
sidebar with a back button and its own create affordance. Both are a handful of lines around
this component (see the `InADialog` and `InAHostSidebar` stories), and a wrapper modelling
both would be a worse contract than no wrapper. `existingGuardrails` is likewise not a palette
concern: it exists so the *builder* can propose a unique default name.

### Localization

Chrome strings resolve through `useGuardrailPaletteLabels` (lingui, `guardrails.palette.*` ids
in the shared canvas catalog); `labels` overrides any of them and wins over the catalog.
Definition copy is not localized here: display names, descriptions and connector or folder
names arrive resolved on the definitions, from the canonical copy table or the wire.

All nine strings are harvested from the two products' own catalogs (eight from Flow's
`addGuardrailPalette_*` i18next keys, `list-aria-label` from Agents' `guardrails.palette.*`
lingui id), so the English is the wording both products already ship rather than something
this package invented.

**English only**, like the canonical copy above: the other thirteen catalogs get these ids
from `chore(l10n): sync from Localization`, and until it runs `useSafeLingui` renders the
English default, so nothing is missing on screen. One item for that loc pass comes with the
harvest: the two products translate the word itself differently in German, "Leitplanke" in
Flow against "Leitlinien" in Agents.

## GuardrailRemoveDialog

The confirmation step before a guardrail is removed, with the impact of the removal spelled
out.

```tsx
import { GuardrailRemoveDialog } from '@uipath/apollo-react/canvas/guardrails';

<GuardrailRemoveDialog
  open={pending !== null}
  guardrailName={pending?.name ?? ''}
  toolName={currentToolName}          // the tool the removal was requested from
  remainingToolNames={remainingTools} // what survives a scoped removal
  remainingScopes={remainingScopes}
  formatScope={scopeLabel}            // 'Llm' -> 'LLM calls'
  onConfirm={applyRemoval}
  onCancel={() => setPending(null)}
/>;
```

### Contract

- **The impact is structured props, not a slot.** There are exactly two situations and both
  products already describe both: `affectedToolNames` / `affectedScopes` are what a **full**
  removal also takes the guardrail off ("This guardrail is also applicable to:"), and
  `remainingToolNames` / `remainingScopes` are what survives a **tool-scoped** removal ("It
  will still be applicable to:"). Flow computes them from one guardrail plus an
  `isToolOnAgent` flag; that branch converges here by filling one pair or the other. Pass
  neither pair and the dialog is the question on its own. All four default to empty.
- **Deciding which removal is happening stays host-side**, along with the unwind. The two
  products disagree about it in ways that are theirs to keep: Agents strips the tool from
  `matchNames`, then drops the `Tool` scope, then deletes; Flow calls
  `removeToolFromGuardrail`. The component only renders the description of the outcome.
- **`toolName` names the tool in the scoped-removal line**, and only alongside something
  remaining: with nothing left the guardrail is gone everywhere, and naming one tool would
  misdescribe it. Both products already behave that way.
- **`onConfirm` and `onCancel` are intents.** Neither closes the dialog: `open` is controlled,
  so the write, the telemetry event and the close all stay with the host. `onCancel` covers the
  Cancel button, Escape and the corner close button when it is on, and fires **once** per
  dismissal. Confirming
  never also reports a cancel, which is why the confirm button is a plain wind `Button` and not a
  `DialogClose`: a close would drive `onOpenChange(false)` on top of the click. Flow's dialog
  reports both today, because it uses `AlertDialogAction`.
- **Built on wind's `Dialog`, not `AlertDialog`.** `AlertDialog` carries `role="alertdialog"` and
  focuses its cancel control for free, but it has no corner close button and no way to add
  backdrop dismissal: Radix prevents outside interaction *after* spreading consumer props, so
  neither is reachable, so offering a close button at all would have meant a hand-rolled one
  against the grain of the primitive. `GuardrailFormLayout` is already a wind `Dialog` with one.
  What the switch costs is made back explicitly: `onOpenAutoFocus` puts initial focus on Cancel,
  and the description still carries the whole impact through `aria-describedby`.
- **`showCloseButton` is opt-in**, and renders the corner close button wired through the same
  `onCancel` path as Escape. Off by default so adopting the dialog never adds a control a product
  did not have: Agents asks for it, Flow leaves it off. Wind's own built-in one is always
  suppressed, because its accessible name is a hardcoded English "Close" and every other string
  here is localized. Ours is last in the DOM, so a keyboard user reaches the decision before the
  escape hatch.
- **`closeOnBackdropClick` defaults to `false`.** A confirmation is a decision and a stray click
  should not discard it; Escape and Cancel always dismiss. Wind's prop of the same name only
  applies to `variant="takeover"`, so the guard here is `onPointerDownOutside`.
- **The confirm button takes the default accent variant, not `destructive`.** Both products
  colour this action with the accent today and both read a red Remove as a regression when
  they tested the shared dialog; the dialog carries the weight of the action through its title
  and impact lines instead. A test pins the variant.
- **Scopes arrive raw and localize through `formatScope`**, the same idiom as
  `GuardrailList`'s `formatScopes`. Scope vocabulary is product-owned; both products already
  hold the mapping, and an adapter that omits the callback renders `Llm` instead of
  `LLM calls`. Pass only the scopes worth listing: both products drop `Tool` when the
  remaining tools are listed by name.
- **The whole impact is the accessible description**, not just the first sentence, so the dialog
  announces what the removal costs rather than only its question. Focus opens on Cancel, the least
  destructive control, and Tab is trapped inside.
- **`container` picks the portal target**: omit it to inherit the nearest wind
  `PortalContainerProvider`, pass an element to portal into it, or `'body'` to force
  `document.body` even under a provider. Agents' dialog deliberately escapes its shadow root
  today, which is what `'body'` preserves; Flow's stays in place.

### Localization

Chrome strings resolve through `useGuardrailRemoveDialogLabels` (lingui,
`guardrails.remove-dialog.*` ids in the shared canvas catalog); `labels` overrides any of them
and wins over the catalog. Domain values are not localized here: the guardrail and tool names
are user data, and scopes go through `formatScope`.

Seven of the eight strings are harvested from the two products' own catalogs, where the English
already matched in both, so nothing here is wording this package invented. The eighth, `close`,
comes from Agents' `common.close`; its own dialog labels that button with a hardcoded `"close"`.

**English only**, like the rest of the family: the other thirteen catalogs get these ids from
`chore(l10n): sync from Localization`, and until it runs `useSafeLingui` renders the English
default, so nothing is missing on screen.

## CentralizedGuardrailsSection

The read-only list of guardrails an organization's AI Trust Layer governance policy enforces
on an agent, and `CentralizedGuardrailDetails`, the content behind a row.

```tsx
import {
  CentralizedGuardrailDetails,
  CentralizedGuardrailsSection,
  getApplicableCentralizedGuardrails,
} from '@uipath/apollo-react/canvas/guardrails';

<CentralizedGuardrailsSection
  guardrails={getApplicableCentralizedGuardrails(policy.centralizedGuardrails, {
    isConversational,
  })}
  policyName={policy.policyName}
  definitions={definitions}        // undefined while the catalog is loading
  docsHref={CENTRALIZED_GUARDRAILS_DOCS}
  onSelect={openDetails}           // the host opens its own dialog or panel
/>;
```

Contract highlights:

- **Governance guardrails are their own record.** `CentralizedGuardrail` mirrors both
  products' policy schemas: no `id`, `scopes` at the top level rather than under a
  `selector`, and `action` as a bare discriminator rather than an object. It is deliberately
  not a variant of `GuardrailBuilderValue`. `executionStage` stays `string` because both
  products parse it as one; `action` is the closed four-value union both close it to, and a
  TypeScript string enum member assigns to its literal, so Agents' `ActionType` fits.
- **Props, never contexts.** Both products hold the policy and the definitions in a context of
  their own (`useGovernance`, `GuardrailDefinitionsContext`, `useAiTrustLayerGovernancePolicy`);
  passing them in is what lets one component serve both.
- **The host filters, the component renders.** `getApplicableCentralizedGuardrails` is the
  predicate for the agent kind being edited, exported so no host rewrites it. An empty
  `guardrails` renders nothing; `emptyState` overrides that, and an explicit `null` is
  honoured.
- **`definitions` is optional, and `undefined` means "not loaded yet".** That is what keeps a
  row from claiming a configuration was deleted while the catalog is still in flight. An
  empty array means it loaded and the configuration really is gone.
- **Scopes, actions and execution stages default to the family's own labels**, with
  `formatScope` / `formatAction` to override. Every one of those strings already existed in
  the canvas catalog, so defaulting removes a prop an adapter can forget for a visible
  regression (`Llm` instead of "LLM calls").
- **A broken BYO configuration gets a chip and a sentence.** The chip is `GuardrailList`'s
  own (`Unavailable` / `Disabled`, same ids) and makes the row findable in a long policy; the
  sentence under it, which both products already show, says what to do about it.
- **The row's accessible name is its own text.** Both products put an `aria-label` on it,
  which overrides the content and hides the description, the provider and the
  broken-configuration message from screen readers entirely.
- **Layout knobs for both hosts**: `unstyled` drops the card border and padding, `hideHeader`
  drops the heading, info popover and policy caption. Agents nests the section in its own
  `SectionAccordion` and uses both.
- **`docsHref` is opt-in.** Product documentation URLs never ship in this package.

### CentralizedGuardrailDetails

The details **content**, not a shell: Agents opens a dialog and Flow pushes a panel overlay,
each with its own header, breadcrumb and dismissal, so the surrounding chrome stays host
orchestration. The `Details in a dialog` and `Details in a panel overlay` stories show both.

```tsx
<CentralizedGuardrailDetails
  guardrail={selected}
  policyName={policy.policyName}
  definitions={definitions}
/>;
```

- **One configuration renderer for both origins.** A BYO guardrail states its configuration
  as connector parameters and a built-in as `entities` / `entityThresholds`.
  `resolveCentralizedGuardrailParameters` lifts the built-in fields onto the parameter shape
  so one resolver covers both, and a threshold map absorbs its `keySource` list into its key
  column.
- **Labels and entity names come from the matching definition**, so a centralized guardrail
  names its entities the way the guardrail editor names them ("US Social Security Number
  (SSN)", not `USSocialSecurityNumber`) and each validator names its own configuration
  ("Severity thresholds" for harmful content, "Detection thresholds" for PII). With no
  definition matched it falls back to generic labels and raw values, which is what both
  products render today.
- **A read-only value is text, not a disabled input.** The family's parameter editors are the
  MetadataForm stack and have no read-only mode, and these values arrive as untyped wire data
  rather than `GuardrailValidatorParameter`s. A disabled input, which is how Flow renders this
  today, is also worse than text: it cannot be focused, so its content is not selectable, not
  copyable and skipped by a screen reader.

Both components resolve a built-in validator's name and description from the canonical copy
table (see *Definitions layer*), never from the definitions array: a policy can enforce a
validator this tenant is not entitled to and therefore has no definition for. A BYO
guardrail's description comes from its connector definition and never from the curated table,
since a connector may expose a validator id a built-in also uses.

## GuardrailBuilder

The complete Add/Edit screen for an OOTB guardrail validator: status banners, usage note,
type display (edit mode), name, description, validator parameters, scope selector, action
(log / block / escalate; filter reserved for the custom-guardrail phase), evaluations
toggle, mixed-scopes banner, and the Save / Cancel / Save-as-new footer.

```tsx
import { GuardrailBuilder } from '@uipath/apollo-react/canvas/guardrails';

<GuardrailBuilder
  open
  inline
  definition={definition}          // GuardrailDefinition (display-ready; see Definitions layer)
  scope="Agent"                    // scope selector renders only for 'Agent'
  guardrail={existing}             // edit mode; omit to create
  defaultName={uniqueName}
  existingNames={otherNames}
  availableToolNames={toolNames}
  onSave={persist}
  onCancel={close}
/>;
```

Contract highlights:

- **Owns form state.** Initialized from `definition`/`guardrail`/`defaultName` at mount —
  remount with a new `key` to reset (all known hosts already remount per session).
- **Owns validation and gates its own Save.** Messages localize through lingui
  (overridable per string via `labels`); a host that validates externally (e.g. zod) passes
  `errors` — host messages display immediately, win per field, and gate Save. The pure
  predicates (`getGuardrailActionErrorFields`, `getGuardrailSelectorErrorFields`,
  `getRequiredEmptyParameterIds`) are exported.
- **Escalation is slot-driven.** `renderRecipientSearch` (user/group directory autosuggest)
  and `renderAppPicker` (escalation app) are host capabilities; `escalateHelp` renders under
  the escalation grid (e.g. a marketplace link — product URLs never ship in this package).
  Without slots the form falls back to a plain input / an "unavailable" note.
- **Layout knobs for both hosts**: `inline`/`hideHeader`/`dialogMaxWidth`, `title` accepts a
  ReactNode (chips, links), `evalsTogglePlacement: 'form' | 'footer'`.
- Requires an ancestor `TooltipProvider`.

`GuardrailFormLayout` is exported standalone for hosts composing their own screen: three
modes (inline+hideHeader / inline with back-button header / modal Dialog), `secondaryAction`,
`saveDisabled`, and a `footerStart` region.

## GuardrailActionSection

The action half of a guardrail: an action-type select plus the field that type needs. `log`
takes a severity level, `block` a reason, `filter` a host-supplied field picker, and
`escalate` expands into the escalation layout that `EscalateActionFields` owns (recipient
type, recipient, action app).

`GuardrailBuilder` renders it. Both are also exported for hosts that build their own editor,
where the section needs two props:

```tsx
import { GuardrailActionSection } from '@uipath/apollo-react/canvas/guardrails';

const [action, setAction] = useState<GuardrailAction>({
  $actionType: 'log',
  severityLevel: 'Info',
});

<GuardrailActionSection action={action} onActionChange={setAction} />;
```

### Contract

- **`onActionChange` carries the whole next action.** Switching the type emits a fresh default
  payload for it (`createDefaultGuardrailAction`), so no half-migrated action exists. The
  component stores nothing else: no draft state, no validation of its own.
- **Errors are host-owned.** `GuardrailActionErrors` is the action slice of
  `GuardrailBuilderErrors` (`blockReason`, `filterFields`, `recipient`, `actionApp`);
  `EscalateActionFields` takes the two it can show as `GuardrailEscalateActionErrors`. Each
  renders as soon as it is present, so a host that surfaces errors only after a save attempt
  withholds the prop until then.
- **A slot that receives an `error` owns rendering it**, so `<Input error={ctx.error} />` in a
  slot shows the message once. The built-in fallbacks pass it to `Input`, which also wires
  `aria-describedby` / `aria-errormessage` / `aria-invalid`. The exception is the
  no-app-picker note, which carries its own `FormFieldError` because Save is still gated on
  `actionApp`.
- **`labels` is optional and partial**, resolved from the canvas lingui catalog through
  `useGuardrailActionLabels`. `GuardrailActionLabels` is a `Pick` over the builder's keys and
  reads the same `guardrails.builder.*` ids, so a full `GuardrailBuilderLabels` is accepted
  here and neither path can word a string differently.
- **`filter` stays product territory.** The option appears only with `showFilter` (custom
  guardrails) and its field picker is `filterContent`: field references are product-shaped and
  this package never edits them.
- **Asset recipients round-trip.** Types 4 and 6 display as their static siblings (3 and 5) in
  the type select, so a value written by a host asset editor never blanks the selection.

### Escalation slots

The escalation target is a host capability in both products, so every part of it is a slot
with a fallback:

| Slot | Replaces | Fallback without it |
| --- | --- | --- |
| `renderRecipientSearch(ctx)` | the User/Group directory autosuggest | an input on `value` + `displayName` |
| `renderStaticRecipient(ctx)` | the email / group-name editor (types 3/4/5/6); return `undefined` to fall through, `null` to render nothing | an input on `value`, or `assetName` for an asset recipient |
| `renderAppPicker(ctx)` | the escalation action app picker | a localized "picker unavailable" note |
| `escalateHelp` | content under the escalation grid | nothing |

`escalateHelp` is a node rather than a string because it is where a marketplace link goes, and
product URLs never ship in this package. `ctx.onChange` on `renderStaticRecipient` replaces the
recipient wholesale, which is how a host swaps the static and asset variants of one kind.

The field's `<label>` points at the built-in input, so a slot must name its own control with
`aria-labelledby={ctx.labelId}`. A control with no `error` prop of its own has to render
`ctx.error` beside it, inside what the slot returns; nothing else renders it.

### Three layouts

`EscalateActionFields` is separately exported because its layout is what hosts compose
differently:

| Props | Renders |
| --- | --- |
| `actionTypeSelect` (what the section passes) | the whole escalate grid: leading cell, three fields, `escalateHelp` |
| `asGridItems` | the three cells as a fragment, for a grid the host owns and where it places `escalateHelp` |
| neither | the three fields stacked, `escalateHelp` under them |

`className` merges onto whichever root it renders, and has no effect under `asGridItems`, which
renders no element of its own.

## GuardrailValidatorForm

Renders one editor per `GuardrailParameterDefinition`, covering the seven wire parameter
types:

| type | editor |
| --- | --- |
| `number` | numeric input with `min`/`max`/`step` |
| `text` | multiline textarea (`maxLength`) |
| `boolean` | switch |
| `enum` | single select (a stored value missing from `options` is kept as a synthetic option) |
| `enum-list` | toggleable chips inline for ≤8 options, otherwise the wind `MultiSelect` |
| `text-list` | repeated textarea rows with Add/Remove (`maxItems`, `maxLength`) |
| `map-enum` | one numeric input per key selected in the sibling `keySource` enum-list |

```tsx
import {
  GuardrailValidatorForm,
  getRequiredEmptyParameterIds,
  seedGuardrailParameters,
} from '@uipath/apollo-react/canvas/guardrails';

const [parameters, setParameters] = useState(() =>
  seedGuardrailParameters(definition.parameters, existingGuardrail?.validatorParameters)
);

<GuardrailValidatorForm
  parameterDefinitions={definition.parameters}
  parameters={parameters}
  onChange={setParameters}
  errors={errors}                 // Record<paramId, message> — host-owned validation
  onClearError={clearParamError}
/>;
```

Requires an ancestor `TooltipProvider` (for the per-parameter info tooltips).

The controlled contract above is this family's, not `MetadataForm`'s: the form owns its own
state and exposes a plugin seam, so the translation lives in one named place,
`useMetadataFormBridge`. Nothing else in the family reaches into `context.form`.

### Contract

- **Fully controlled values; validation is shared.** The host owns values (`parameters` +
  `onChange`). Validation runs on both sides, and the split is deliberate:
  - *The form* declares `required`/`min`/`max` from the parameter definitions and its resolver
    evaluates them, with messages from the label catalog so they translate. A field can
    therefore show an error with no `errors` entry at all. **When** it reports is `validateLive`:
    on by default, since a host mounting `GuardrailValidatorForm` standalone has no save of its
    own and nothing else would validate. `GuardrailBuilder` passes its own post-save-attempt
    flag instead, so inside the dialog parameters stay quiet until the first failed Save and
    then go live — the same gate the name, scope and action fields have always used.
  - *The host* owns anything the form cannot know — domain rules, and the save-time gate.
    Compute required-field errors with `getRequiredEmptyParameterIds(definitions, parameters)`
    and out-of-range values with `getOutOfRangeParameterIds(definitions, parameters)`, gate
    Save on both, and map the returned ids to your own localized messages. The component
    renders `errors[id]` under the matching editor and calls `onClearError(id)` before
    `onChange` when that parameter is edited.

  **The host's verdict wins where they disagree** — a `text-list` of whitespace-only rows
  passes the array's `.min(1)` but counts as empty for `getRequiredEmptyParameterIds`. That
  precedence is pinned by a test rather than left to whichever ran last. Gate Save on the host
  predicates: they are authoritative, and the resolver is there for live feedback while typing.
  They are also what fills the dialog on a failed Save, since the resolver is still held back at
  that instant — so keep computing them even though the resolver covers `required`/`min`/`max`.
- **Definitions arrive pre-resolved.** `label`, `tooltip` and `optionLabels` are display
  strings; this form resolves nothing and renders what it is handed. Two things can produce
  them: the host's own table, or the package's own [definitions layer](#definitions-layer),
  whose `enrichGuardrailDefinitions` resolves the six built-in validators from the shared
  canvas catalog. Domain copy for a validator this package has not learned (a BYO manifest, a
  newly shipped backend parameter) still belongs to whoever ships it, and reaches the form the
  same way.
- **No product types cross the boundary.** `GuardrailValidatorParameter` structurally mirrors
  the wire shape both products persist, so host unions assign cleanly in both directions.
- **Per-parameter override.** `renderParameter(ctx)` replaces the editor for any parameter
  (return `undefined` to fall through). `ctx.onValueChange` upserts the parameter;
  `ctx.onParametersChange` replaces the whole array for overrides that persist sidecar
  parameters (e.g. a model picker storing connection metadata).

### Save-time companions

The editors never prune or drop values while typing; reconcile at save time:

```ts
import { dropEmptyOptionalParameters, syncMapEnumParameters } from '@uipath/apollo-react/canvas/guardrails';

const cleaned = dropEmptyOptionalParameters(
  syncMapEnumParameters(parameters, definition.parameters),
  definition.parameters
);
```

- `syncMapEnumParameters` rebuilds every `map-enum` value so its keys exactly match the
  current `keySource` selection (preserving user edits, then per-key defaults, then `min`).
  It mirrors the map-enum editor's key resolution — keeping the two in one package is the
  point: they must never drift.
- `dropEmptyOptionalParameters` removes optional parameters left `''`/`[]`, which runtimes
  reject at publish time.
- `seedGuardrailParameters` builds the initial value array from definitions (editing passes
  the stored values through verbatim), coercing `null` defaults to the union's value types.

### Localization

The component's own chrome strings (placeholders, Add, aria labels) localize through the
package's standard lingui setup: `useSafeLingui` with explicit `guardrails.*` ids and English
defaults, translations in the shared canvas catalog (`src/canvas/locales/*.json`, delivered by
the l10n sync; `ru` falls back to English per key). Without a lingui provider the components
render the English defaults — mount `ApI18nProvider component="canvas"` (from
`@uipath/apollo-react/i18n`) for translations. `labels` overrides individual strings and wins
over the catalog. The resolver's own messages (`requiredError`, `minError`, `maxError`) are
part of that catalog: the schema declares those constraints, so the messages ship with the
component rather than arriving through `errors`. Domain messages still belong to hosts and
come in via `errors`.

Localized template strings that cross into plain-string APIs (dialog titles, the text-list
remove label consumed by wind's `formatTemplate`) are ICU messages formatted with sentinel
values, so they come back carrying the `{{token}}` convention — see `TEMPLATE_TOKENS` in
`i18n.ts`.

### Consuming from a shadow-DOM host (Agents stage 2)

Radix overlays (the enum select, the enum-list popover, tooltips) portal to `document.body`
by default and escape shadow roots; wrap the form's subtree with `PortalContainerProvider`
and inject the compiled canvas stylesheet
(`@uipath/apollo-react/canvas/styles/tailwind.canvas.css?inline` — its Tailwind build scans
this directory) into the shadow root (see `AgentCanvasEditor` in `frontend-sw` for the
`?inline` injection precedent). `@uipath/apollo-wind` must resolve to a single copy alongside
apollo-react's own pin, or Radix contexts and CSS duplicate.

## GuardrailScopeSelector

Where a guardrail applies: a chip group over the three scopes (Agent, LLM calls, Tools) and,
once Tools is on, a second group for the tools it targets. The value is a `GuardrailSelector`,
`{ scopes, matchNames? }`.

`GuardrailBuilder` renders it for agent-level guardrails (`scope="Agent"`). It is also
exported for hosts that build their own editor, where it needs two props:

```tsx
import { GuardrailScopeSelector } from '@uipath/apollo-react/canvas/guardrails';

const [selector, setSelector] = useState<GuardrailSelector>({ scopes: ['Agent'] });

<GuardrailScopeSelector
  selector={selector}
  onChange={setSelector}
  availableToolNames={toolNames}   // omit it and the Tools scope is not offered
  allowedScopes={definition.allowedScopes}
/>;
```

### Contract

- **`onChange` carries the whole next selector**, and `matchNames` only while Tools is
  selected: turning Tools on targets every name in `availableToolNames`, turning it off drops
  the list. The component stores nothing and validates nothing.
- **Tools needs tools.** With `availableToolNames` empty or omitted the Tools chip is not
  offered, and a selector that already includes Tools has it stripped through `onChange` as
  soon as it renders, so no invalid state survives that the user cannot see or fix. A host
  whose tool list loads asynchronously should mount the selector once the list is known.
- **`allowedScopes` narrows what is offered**, typically to a definition's `allowedScopes`. It
  filters the chips only: a scope already in the value stays there.
- **Only known tools render.** A `matchNames` entry missing from `availableToolNames` stays in
  the value, unseen; pruning renamed or deleted tools is the host's sync, not this component's.
- **Errors are host-owned.** `GuardrailScopeSelectorErrors` is the selector slice of
  `GuardrailBuilderErrors` (`scopes`, `toolNames`), and each message renders as soon as it is
  present, so a host that shows errors only after a save attempt withholds the prop until
  then. `getGuardrailSelectorErrorFields(selector)` says which of the two fail; the builder's
  own wording is `scopesRequiredError` / `toolsRequiredError` on `useGuardrailBuilderLabels()`.
- **`labels` is optional and partial**, resolved from the canvas lingui catalog through
  `useGuardrailScopeSelectorLabels`. `GuardrailScopeSelectorLabels` is a `Pick` over the
  builder's keys and reads the same `guardrails.builder.*` ids, so a full
  `GuardrailBuilderLabels` is accepted here and neither path can word a string differently.
- **Each chip group is a named `role="group"`** (its label, via `aria-labelledby`) with its
  error linked through `aria-describedby`; the chips are toggle buttons. Nothing portals, so no
  `TooltipProvider` or portal container is needed.
- `className` merges onto the root, `data-slot="guardrail-scope-selector"`.

## Built on the forms/ MetadataForm stack

`GuardrailValidatorForm` is not a form renderer of its own: internally it is
`buildGuardrailFormSchema(definitions, labels)` + the package's `MetadataForm`
(`components/forms/`: `FormSchema` → `MetadataForm` → `field-renderer`), mounted with
`container="div"`. The public contract above is the adapter boundary — hosts never see the
schema.

`MetadataForm` owns its own state; it has no controlled-host props. An earlier revision of
#1107 added some (`values`, `onValuesChange`, `errors`, `disableValidation`) and they were
removed in review, because they existed to route around features the schema contract already
declared. The translation from this family's controlled contract onto the primitive therefore
lives in one named place, `useMetadataFormBridge`, which is a `FormPlugin` that:

- registers the guardrail-owned custom components from the first paint (`FormPlugin.components`);
- pushes host `parameters` in with `context.form.setValue`, structurally compared so an echo of
  the form's own emission performs no write and focus/cursor survive;
- pushes host `errors` in as `type: 'external'`, cleared only when the prop drops them;
- reports user edits out through `onValueChange`, suppressed while the hook is itself writing.

Validation is live rather than disabled: `buildGuardrailFormSchema` declares `required`/`min`/
`max` with messages from the label catalog (so they translate), and the host's own predicates
(`getRequiredEmptyParameterIds`, `getOutOfRangeParameterIds`) run alongside, reaching the form
as external errors. Where the two disagree — a `text-list` of whitespace-only rows passes the
array's `.min(1)` but counts as empty for the host — the host verdict is what the user sees;
`guardrail-validator-form.test.tsx` pins that.

How each parameter type maps:

| parameter type | rendering |
| --- | --- |
| `number` | field type `number` |
| `text` | field type `textarea` (`minRows`, `maxLength`) |
| `boolean` | field type `switch` |
| `enum` | field type `select` (synthetic option appended for a stale stored value) |
| `enum-list` > 8 options | field type `multiselect` |
| `enum-list` ≤ 8 options | custom component `guardrail-enum-list-chips` (`GuardrailChip` toggles in a `FieldShell`) |
| `text-list` | field type `string-list` (added to forms/ for this convergence — generic) |
| `map-enum` | custom component `guardrail-map-enum` (reads the `keySource` sibling via the form context) |
| any id claimed by `renderParameter` | custom component `guardrail-render-parameter` (the bridge that mounts the host's node and exposes `onValueChange`/`onParametersChange`) |

Why the three custom components stay guardrail-owned: the chip-toggle UX is a product
decision (small option sets read better as chips than a dropdown), `map-enum` derives its
rows from a sibling field's live selection, and `renderParameter` is a host seam — all three
are exactly what `type: 'custom'` + component registration exists for.

Adapter invariants (guarded by the `controlled contract` tests in
`guardrail-validator-form.test.tsx`):

- Emissions upsert only the edited parameter into the host's current array — untouched
  defaults never leak in, and parameters without a matching definition (sidecars written via
  `onParametersChange`, e.g. `byomConnectionId`) never enter the form and round-trip
  untouched.
- A synchronous host echo of the emitted array is a no-op (per-field deep-equal guard): no
  re-emission, focus and cursor survive. Hosts must echo synchronously from `onChange`.
- Values are coerced to the wire shape on emit (`coerceGuardrailParameterValue`): a cleared
  number input persists `0`, never `NaN`; text/enum never persist `null`.

**Rule for new work**: a new parameter editor extends `field-renderer` with a first-class
field type (when it's generic) or registers a custom component here (when it's
guardrail-shaped) — never a parallel renderer next to `MetadataForm`.
