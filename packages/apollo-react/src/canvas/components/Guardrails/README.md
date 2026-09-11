# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Lives in apollo-react next to canvas — MUI-free, built
entirely on `@uipath/apollo-wind` primitives and its `forms/` engine, strings on lingui —
and is exported through the narrow `@uipath/apollo-react/canvas/guardrails` subpath (also
re-exported from `./canvas`). Members: the definitions layer (wire types, parser, canonical
copy and `useGuardrailDefinitions`), `GuardrailList` (the applied-guardrails section),
`GuardrailBuilder` (the whole Add/Edit screen), `GuardrailFormLayout` (the screen shell),
and `GuardrailValidatorForm` (the validator parameter section, also rendered inside the
builder), plus the leaves the sections compose: `GuardrailStatusChip`,
`GuardrailStatusBanner` and `MixedScopesBanner`.

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
canvas catalog, rather than in each product's own table. Both products get the same wording
and the same translations, and the strings sit in the real localization pipeline.

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
> entries are hand-authored. A test asserts every message reaches `src/canvas/locales/en.json`
> with the same English, and that the catalog carries no `guardrails.definitions.*` id the
> source no longer declares. That test is what extraction would otherwise be doing for you.

## GuardrailList

The guardrails applied to an agent or a tool: an ordered list of rows with add, edit, remove
and reorder affordances, the two bring-your-own configuration notices, and optional status
chips.

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
  | `reorderDisabled` | `disabled` | Agents stops reordering in a read-only list and Flow does not, so one flag could not express both. Flow passes `false`. |
  | `unstyled` | `false` | Agents renders inside its own section accordion, where the card border and padding are extra chrome. |
  | `hideHeader` | `false` | Agents owns the section title and its add affordance. |
  | `footer` | none | Agents' add affordance sits *below* the rows and swaps itself for an entitlement line, which the header-only `addSlot` cannot express. |
  | `emptyState` | the default line | Agents renders nothing when empty: pass `null`. An explicit `null` is honoured, so the check is for an absent prop, not a falsy value. |
  | `rowActivatesEdit` | `false` | Agents opens the editor by clicking the row body. The body becomes a `role="button"`, whose children ARIA treats as presentational, so the BYO notices and the description are named in its `aria-describedby`. The provider line, action badge and scopes stay presentational: a host that needs those announced should render them outside the activatable body. |
  | `renderItemActions` | inline buttons | Agents' actions are an overflow menu. The slot receives `defaultActions`, so it can add to them instead of replacing them. |
  | `renderRowTooltip` | none | Agents hovers a combined description, provider and scopes tooltip over the row body. A tooltipped body that is not activatable gets `tabIndex={0}`, so the content opens on focus as well as hover. |
  | `formatScopes` / `formatAction` | raw values | Scope and action wording is product copy; return `null` to hide either line. |
  | `getItemId` | `id ?? name` | Flow keys rows by `id`, Agents by `name`. |
  | `getItemAdministration` | `'local'` | Governance-managed guardrails come from a different endpoint, so nothing on the record identifies them. |

  So Flow passes `previewChip` and `reorderDisabled={false}`; Agents passes `previewChip`,
  `unstyled`, `hideHeader`, `emptyState={null}`, `footer`, `rowActivatesEdit`,
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
- **Error text is `text-error`, not `text-destructive`.** The two resolve differently in
  several `tailwind.consumer.css` theme blocks and wind's `FormFieldError` settled on
  `text-error`. The BYO notices keep `role="alert"` rather than the family banner's
  `role="status"`: Flow announces them on mount today and the shared row keeps that parity.

### Chips and notices

`GuardrailStatusChip` is `Badge`-based and reuses the chip family's pill geometry. It is
deliberately **not** `GuardrailChip`, which wraps a Radix `Toggle`: these are read-only
labels, and rendering them as toggles would put fake buttons in the tab order and misreport
them to screen readers.

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
of the seventeen are harvested from Flow's canvas catalog into all 12 translated locales, so
the list adds no translation work. The five with no host equivalent are English-only for now
and fall back per key: `edit-row`, `status-feature-disabled`, `status-disabled`,
`status-unavailable`, `administration-governance`.

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
  definition={definition}          // GuardrailDefinition (display-ready, host-localized strings)
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

- **Fully controlled, validation-free.** The host owns values and validation. Compute
  required-field errors with `getRequiredEmptyParameterIds(definitions, parameters)` and
  out-of-range numbers with `getOutOfRangeParameterIds(definitions, parameters)` — gate Save
  on both — then map the returned ids to your own (localized) messages; the component renders `errors[id]` under
  the matching editor and calls `onClearError(id)` before `onChange` when that parameter is
  edited.
- **Definitions arrive pre-resolved.** `label`, `tooltip` and `optionLabels` are display
  strings the host already localized; domain copy (PII entity names, validator descriptions)
  never ships in this package.
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
defaults, translations in the shared canvas catalog (`src/canvas/locales/*.json`, 13 locales
translated; `ru` falls back to English per key). Without a lingui provider the components
render the English defaults — mount `ApI18nProvider component="canvas"` (from
`@uipath/apollo-react/i18n`) for translations. `labels` overrides individual strings and wins
over the catalog. The required-error message is deliberately not included: it arrives through
`errors`, because validation messages belong to hosts.

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

## Built on the forms/ MetadataForm stack

`GuardrailValidatorForm` is not a form renderer of its own: internally it is
`buildGuardrailFormSchema(definitions, labels)` + the package's `MetadataForm`
(`components/forms/`: `FormSchema` → `MetadataForm` → `field-renderer`), mounted through the
controlled-host seam (`values` / `onValuesChange` / `errors` / `disableValidation` /
`container="div"` / synchronous `components`). The public contract above is the adapter
boundary — hosts never see the schema.

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
