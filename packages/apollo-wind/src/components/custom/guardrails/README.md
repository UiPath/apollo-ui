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
| `enum-list` | toggleable chips, inline for ≤8 options, otherwise in a popover |
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
never-rejecting loader (`loadGuardrailValidatorFormMessages`). If catalogs are ever dropped,
the `labels` prop remains a complete, non-breaking localization path.

### Consuming from a shadow-DOM host (Agents stage 2)

Radix overlays (the enum select, the enum-list popover, tooltips) portal to `document.body`
by default and escape shadow roots; wrap the form's subtree with `PortalContainerProvider`
and inject the package CSS into the shadow root (see `HitlSchemaCanvas` in `frontend-sw` for
the `?inline` injection precedent).
