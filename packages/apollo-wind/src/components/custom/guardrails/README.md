# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Members: `GuardrailBuilder` (the whole Add/Edit screen),
`GuardrailFormLayout` (the screen shell), and `GuardrailValidatorForm` (the validator
parameter section, also rendered inside the builder).

## GuardrailBuilder

The complete Add/Edit screen for an OOTB guardrail validator: status banners, usage note,
type display (edit mode), name, description, validator parameters, scope selector, action
(log / block / escalate; filter reserved for the custom-guardrail phase), evaluations
toggle, mixed-scopes banner, and the Save / Cancel / Save-as-new footer.

```tsx
import { GuardrailBuilder } from '@uipath/apollo-wind';

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
  locale={i18n.language}
/>;
```

Contract highlights:

- **Owns form state.** Initialized from `definition`/`guardrail`/`defaultName` at mount —
  remount with a new `key` to reset (all known hosts already remount per session).
- **Owns validation and gates its own Save.** Messages come from the built-in catalog
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
} from '@uipath/apollo-wind';

const [parameters, setParameters] = useState(() =>
  seedGuardrailParameters(definition.parameters, existingGuardrail?.validatorParameters)
);

<GuardrailValidatorForm
  parameterDefinitions={definition.parameters}
  parameters={parameters}
  onChange={setParameters}
  errors={errors}                 // Record<paramId, message> — host-owned validation
  onClearError={clearParamError}
  locale={i18n.language}
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
  strings, already resolved by the time they reach the component. Build them with the
  definitions layer below, which owns the canonical English for built-in validators and takes
  the host's translator; or resolve them yourself and pass them in.
- **No product types cross the boundary.** `GuardrailValidatorParameter` structurally mirrors
  the wire shape both products persist, so host unions assign cleanly in both directions.
- **Per-parameter override.** `renderParameter(ctx)` replaces the editor for any parameter
  (return `undefined` to fall through). `ctx.onValueChange` upserts the parameter;
  `ctx.onParametersChange` replaces the whole array for overrides that persist sidecar
  parameters (e.g. a model picker storing connection metadata).

### Save-time companions

The editors never prune or drop values while typing; reconcile at save time:

```ts
import { dropEmptyOptionalParameters, syncMapEnumParameters } from '@uipath/apollo-wind';

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

The component's own chrome strings (placeholders, Add, aria labels) ship with catalogs for 14
locales, loaded lazily via the `locale` prop; unsupported locales fall back per key to
English. `labels` overrides individual strings and wins over the catalog. The required-error
message is deliberately not included: it arrives through `errors`, because validation
messages belong to hosts.

This is apollo-wind's first component with built-in locale catalogs (the package's
LOCALIZATION_GUIDE prescribes props-based localization). The catalogs follow the
`ap-model-picker` mechanism from apollo-react, minus Lingui: plain TypeScript modules and a
never-rejecting loader (`loadGuardrailMessages`). If catalogs are ever dropped,
the `labels` prop remains a complete, non-breaking localization path.

**The copy rule, in two halves.** Chrome copy (the component's own placeholders, buttons and
aria labels) is localized in-package, as above. Domain copy (validator names and descriptions,
parameter labels and tooltips, PII entity names) ships **English-only, plus a translator seam**:
the canonical strings live in `definitions-copy.ts` and each host resolves them through its own
i18n toolchain. Domain copy is here rather than host-side for one specific reason, covered
below: the backend cannot supply it, so the alternative is every product describing the same
catalog itself, which is what produced the drift this layer exists to end.

### Consuming from a shadow-DOM host (Agents stage 2)

Radix overlays (the enum select, the enum-list popover, tooltips) portal to `document.body`
by default and escape shadow roots; wrap the form's subtree with `PortalContainerProvider`
and inject the package CSS into the shadow root (see `HitlSchemaCanvas` in `frontend-sw` for
the `?inline` injection precedent).

## Definitions layer

Four modules turn a raw guardrail definitions API response into the display-ready shape the
components above render. No fetching: every host's transport differs irreducibly (different
query libraries, different HTTP clients, tenant id versus tenant name in the URL, and one host
that never fetches at all because its definitions arrive over `postMessage`), so definitions
arrive as data and the host keeps its own transport, exactly as the components keep their own
values.

| Module | Role |
| --- | --- |
| `definitions-wire.ts` | Hand-written public wire types. No zod, ever. |
| `definitions-parse.ts` | Private zod schemas plus `parseGuardrailDefinitions`. The only zod importer. |
| `definitions-copy.ts` | Canonical English for built-in validators, and the copy-key contract. |
| `definitions-enrich.ts` | `enrichGuardrailDefinitions` and the display-ready output type. |

```ts
import {
  enrichGuardrailDefinitions,
  parseGuardrailDefinitions,
  withGuardrailFolderMetadata,
} from '@uipath/apollo-wind';

const { definitions, invalid, inputError } = parseGuardrailDefinitions(await response.json());
if (invalid.length > 0) logger.warn('guardrail definitions dropped', invalid);

const enriched = enrichGuardrailDefinitions(definitions, {
  translate: (key, defaultValue) => t(key, { defaultValue }),
  hiddenValidators: ['prompt_injection'],
});

// BYO folder paths are not on the wire; stitch them on from your own connection lookup.
const withFolders = withGuardrailFolderMetadata(enriched, folderByConnectionId);
```

`EnrichedGuardrailDefinition extends GuardrailDefinition`, so the result passes straight into
`<GuardrailBuilder definition={...} />` while still carrying the fields hosts need outside the
form (`folderPath`, `byoConnectorName`, `byoGuardrailConnectionId`, `byoConnectorKey`,
`byoConfigurationId`, `folderKey`, and the payload/stage metadata both products discard today).

### Contract

- **Never throws.** `parseGuardrailDefinitions` returns a result: valid definitions in input
  order, plus one `invalid` entry per dropped definition with its index, its best-effort
  validator id and its issues. A guardrail surface renders inside a shadow root with no error
  boundary, where a thrown parse error blanks the whole panel. A non-array body reports
  `inputError` rather than throwing on `.map`.
- **A bad definition is dropped whole**, not partially parsed, which is what both products do
  today: half a definition renders a form that cannot be saved.
- **Unknown keys are stripped, not rejected.** The API adds fields without a frontend release,
  and a strict schema would turn each addition into an empty catalog. Note this parser only ever
  sees *definitions*: persisted guardrail values, sidecar parameters included, never pass through
  it.
- **zod stays private.** No exported type references zod, transitively or otherwise, because
  consuming hosts sit on different zod majors. Enforced three ways: a compile-time
  bidirectional assignability assertion against the hand-written wire types, a runtime key-set
  assertion, and a source-level guard test asserting `definitions-parse.ts` is the only importer.
- **Enrichment is a locale snapshot.** Every string resolves eagerly, so re-run it when the host
  locale changes.
- **Hiding is host policy.** `hiddenValidators` is a parameter, not a catalog field, and BYO
  definitions are never hidden by it: a connector manifest can legitimately declare
  `validator: "pii_detection"`.

### Why the copy lives here

The backend does not send display copy for built-in validators and cannot be made to without a
backend change: `OutOfTheBoxGuardrailDefinitionDto` marks the validator's friendly name
`[JsonIgnore]`, and `OutOfTheBoxGuardrailDefinitions` never sets `displayName`, `description` or
`optionLabels` for any built-in. Only BYO definitions carry display metadata, from their
connector manifest. So every frontend has had to describe the same catalog itself, and the two
hand-maintained tables had already drifted in 16 strings. Owning it once here ends that class of
bug; translations stay in each host's toolchain.

Copy precedence is asymmetric between the two levels, preserving what both products already
render:

| Level | Winner |
| --- | --- |
| Definition `displayName` / `description` | Curated catalog over the wire, for non-BYO |
| Parameter `label` / `tooltip` | Wire (`displayName` / `description`) over curated |
| `optionLabels` | Merged, manifest over curated |
| Anything on a BYO definition | Manifest only. No curated copy at any level |

Copy keys are `guardrail/<validator>/<slot>`, always built by the module's own helpers and never
written by hand, and the separator is `/` deliberately. `.` is i18next's default `keySeparator`
and one host's catalog is flat, so a dotted key would resolve as a nested path, miss, and fall
back to the English default: English would look perfect while every other locale went quietly
untranslated. `:` is the namespace separator and fails the same way. Option keys use the raw wire
value (`USSocialSecurityNumber`) so the key is derivable from the data rather than transcribed,
which is how the two products ended up with `finNationalId` and `fiNationalId` for one option.

`GUARDRAIL_COPY_EN` is the flat English record a host feeds its catalog generation. Regenerate
and diff it in host CI: both i18next and lingui prefer their own catalog's English over a
supplied `defaultValue`, so a host that bumps this package without regenerating silently keeps
the old strings and re-creates the drift.

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
