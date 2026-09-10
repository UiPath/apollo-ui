# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Lives in apollo-react next to canvas — MUI-free, built
entirely on `@uipath/apollo-wind` primitives and its `forms/` engine, strings on lingui —
and is exported through the narrow `@uipath/apollo-react/canvas/guardrails` subpath (also
re-exported from `./canvas`). Members: the definitions layer (wire types, parser, canonical
copy and `useGuardrailDefinitions`), `GuardrailPalette` (the add-guardrail picker),
`GuardrailBuilder` (the whole Add/Edit screen), `GuardrailFormLayout` (the screen shell),
and `GuardrailValidatorForm` (the validator parameter section, also rendered inside the
builder).

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
  compile-time assignability check, a runtime key-set assertion and a source-level guard, so
  the emitted `.d.ts` for this folder carries no schema types and consumers take no zod
  dependency.
- **Enrichment is pure and exported.** `enrichGuardrailDefinitions(wire, { copy, hiddenValidators })`
  is React-free, so non-React and bridge callers use it directly.
  `EnrichedGuardrailDefinition extends GuardrailDefinition`, so its output feeds
  `GuardrailBuilder` with no mapping.
- **Context and `hiddenValidators` are compared by content, not identity**, so a host can
  build them inline. (`useDiscoveryModels` compares the context by identity; an inline object
  there refetches on every render and never settles.)
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
  its place in the tab order and a keyboard user reaches the chip that says why. Agents today
  lets that entry through to the builder, which then refuses to save; Flow disables it in the
  select, and that is the behaviour this ships.
- **`previewChip` defaults to `false`**, the same call as the list: product lifecycle is not a
  package concern. Both hosts hardcode the chip today and both pass the prop, then drop it at
  GA without a release here.
- **`isLoading` renders a polite loading line and `error` a `GuardrailStatusBanner`.** Any
  definitions that did arrive stay pickable under the banner, which is what a host with a
  stale cache and a failed revalidation wants. `error` is shaped like
  `useGuardrailDefinitions`' own `error`, so the hook's result destructures straight in.
- **Definitions are generic.** `GuardrailPaletteDefinition` is the eight fields the palette
  reads; `EnrichedGuardrailDefinition` satisfies it, and so does a product's own definition
  type. The component is generic over it, so `onSelectOotb` hands back the object the host
  passed in, `parameters` and all, and there is nothing to look up again.

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
lingui id), so the palette adds no translation work: 9 of 9 in each of the 12 translated
locales, asserted by a test. `ru` is deliberately absent, as everywhere else in this catalog.
One loc review item comes with the harvest: German takes "Leitplanke" from Flow for eight ids
and "Leitlinien" from Agents for the ninth, because the two products picked different words.

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

### Contract

- **Fully controlled, validation-free.** The host owns values and validation. Compute
  required-field errors with `getRequiredEmptyParameterIds(definitions, parameters)` and map
  the returned ids to your own (localized) messages; the component renders `errors[id]` under
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
