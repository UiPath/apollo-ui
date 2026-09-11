# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Lives in apollo-react next to canvas — MUI-free, built
entirely on `@uipath/apollo-wind` primitives and its `forms/` engine, strings on lingui —
and is exported through the narrow `@uipath/apollo-react/canvas/guardrails` subpath (also
re-exported from `./canvas`). Members: the definitions layer (wire types, parser, canonical
copy and `useGuardrailDefinitions`), `GuardrailRemoveDialog` (the removal confirmation),
`GuardrailBuilder` (the whole Add/Edit screen), `GuardrailFormLayout` (the screen shell), and
`GuardrailValidatorForm` (the validator parameter section, also rendered inside the builder).

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
  so the write, the telemetry event and the close all stay with the host. `onCancel` covers
  the Cancel button and Escape, and fires **once** per dismissal. Confirming never also
  reports a cancel, which is why the confirm button is a wind `Button` rather than
  `AlertDialogAction`: Radix's action is a close button, so it drives `onOpenChange(false)` on
  top of the click. Flow's dialog reports both today.
- **The confirm button takes the default accent variant, not `destructive`.** It shipped
  destructive and was changed back: both products colour this action with the blue accent
  today, and both reported the red as a regression when they tested the shared dialog. The
  dialog carries the weight of the action through its title and impact lines instead. A test
  pins the variant.
- **Scopes arrive raw and localize through `formatScope`**, the same idiom as
  `GuardrailList`'s `formatScopes`. Scope vocabulary is product-owned; both products already
  hold the mapping, and an adapter that omits the callback renders `Llm` instead of
  `LLM calls`. Pass only the scopes worth listing: both products drop `Tool` when the
  remaining tools are listed by name.
- **The whole impact is the accessible description**, not just the first sentence, so an
  alert dialog announces what the removal costs. Focus opens on Cancel, the least destructive
  control, and Tab is trapped inside.
- **`container` picks the portal target**: omit it to inherit the nearest wind
  `PortalContainerProvider`, pass an element to portal into it, or `'body'` to force
  `document.body` even under a provider. Agents' dialog deliberately escapes its shadow root
  today, which is what `'body'` preserves; Flow's stays in place.

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
