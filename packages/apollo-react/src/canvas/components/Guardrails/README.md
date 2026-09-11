# Guardrails components

Shared UI for the UiPath Guardrails experience, consumed by Flow (flow-workbench) and, in a
later stage, Agents (`frontend-sw`). Lives in apollo-react next to canvas — MUI-free, built
entirely on `@uipath/apollo-wind` primitives and its `forms/` engine, strings on lingui —
and is exported through the narrow `@uipath/apollo-react/canvas/guardrails` subpath (also
re-exported from `./canvas`). Members: `GuardrailBuilder` (the whole Add/Edit screen),
`GuardrailFormLayout` (the screen shell), and `GuardrailValidatorForm` (the validator
parameter section, also rendered inside the builder).

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
