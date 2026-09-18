# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Lives in apollo-react next to canvas — MUI-free, built
entirely on `@uipath/apollo-wind` primitives and its `forms/` engine, strings on lingui —
and is exported through the narrow `@uipath/apollo-react/canvas/guardrails` subpath (also
re-exported from `./canvas`). Members: the definitions layer (wire types, parser, canonical
copy and `useGuardrailDefinitions`), `GuardrailBuilder` (the whole Add/Edit screen),
`GuardrailFormLayout` (the screen shell), `GuardrailValidatorForm` (the validator
parameter section, also rendered inside the builder), and `GuardrailActionSection` +
`EscalateActionFields` (the action and escalation half of it).

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
