# ModelPicker

Apollo's shared LLM model picker, built on the UiPath LLM Gateway Discovery API. Ships in `@uipath/apollo-wind`.

This is a port of apollo-react's Material `ap-model-picker` onto wind primitives (Radix + Tailwind), for hosts that cannot take a MUI dependency. The headless layer is shared in substance: the picker-facing contracts in `types.ts` (`DiscoveryModel` and everything it references, `ModelTag`, `ModelGroup`) match the apollo-react source line for line — only apollo-react's request-header type is absent here — so grouping, filtering and tag derivation behave the same in both. `utils.ts` and `badges.ts` are adapted where strings enter; `useModelPickerState.ts` also gains section collapse on `←`/`→` and selector-safe ids. The apollo-react package's platform hooks (`usePlatformAccess.ts`, `useDiscoveryModels.ts`) are not ported: apollo-wind carries no UiPath platform calls.

**This is not a drop-in replacement for `ap-model-picker`.** The prop surface has deliberately diverged: this copy owns no data, no platform hooks and no message catalogs, so `models` is required, the host brings its own fetch, and strings arrive as `labels`. Read [Differences from the apollo-react picker](#differences-from-the-apollo-react-picker) before porting a call site.

It renders a labeled trigger that opens a popup with a built-in folder switcher, a search field, a Category ⇆ Provider grouping pill, grouped sections — Custom Models (BYO) always first — and a "Use custom model" footer for users who can manage BYO.

It fetches nothing and ships no platform hooks: the host loads the catalog with its own data layer and passes it in — see [Quick start](#quick-start).

---

## Quick start

The picker renders what you give it and fetches nothing:

```tsx
import { ModelPicker, type DiscoveryModel } from '@uipath/apollo-wind';

// Load the catalog however your app loads data — React Query, SWR, Redux, a
// postMessage bridge. The LLM Gateway Discovery API (`GET .../llmgateway_/api/discovery`)
// returns rows in exactly the `DiscoveryModel` shape.
const { data: models, isLoading, error } = useQuery<DiscoveryModel[]>({ queryKey: ['models'], queryFn: fetchModels });
const [value, setValue] = React.useState<string | null>(null);

<ModelPicker
  models={models ?? []}
  value={value}
  onChange={(model) => setValue(model.modelId)}
  loading={isLoading}
  error={error}
/>
```

Nothing in the picker performs a request. That holds for every platform concern — the folder list,
the org-admin check, BYO deletes, AI Trust Layer deep links — each is a prop or a callback the host
supplies. apollo-wind deliberately carries no UiPath platform calls; the apollo-react package's
`usePlatformAccess` hooks were not ported.

---

## Per-product customization

The picker is one shared visual + behavioral contract. Everything below is a prop on `<ModelPicker>` — no forks, no wrappers, no design-system PRs.

### 1. Filter the visible catalog

When your product should only show a subset of what Discovery returns (specific modalities, operation codes, current-user permissions, region constraints), pass a `filter`:

```tsx
<ModelPicker
  models={models}
  filter={(m) =>
    m.byomDetails?.availableOperationCodes?.includes('agents-design-eval-deploy') ??
    m.modelSubscriptionType === 'UiPathOwned'
  }
  value={value}
  onChange={(m) => setValue(m.modelId)}
/>
```

**Notes:**

- `filter` runs **before** grouping and search. Empty groups disappear cleanly.
- A `value` whose id is filtered out still resolves — the trigger renders normally, no spurious "unknown model" error.
- Pass a **stable function reference** if `models` is large; the hook re-derives groups whenever `filter` changes identity.

**Modality is a product decision.** The picker renders whatever Discovery serves — it does not assume text generation. Products that only offer chat models opt in with the exported helper, which drops embeddings (by `apiFlavor`) and realtime (by `modelType`):

```tsx
import { isTextGenerationModel } from '@uipath/apollo-wind';

<ModelPicker filter={isTextGenerationModel} … />
```

An indexing or context-grounding surface picks embeddings from the same catalog, so excluding them centrally would break it. The one thing the picker *does* drop unconditionally is `isBlockedByPolicy` — that's an org-wide governance verdict, not a product preference.

### 2. Friendly names

Display names travel on the Discovery DTO, like Recommended. Product teams author them centrally in their Model Hub configuration; the gateway merges them into the response as `displayName`, so every row shows the human label ("Claude Sonnet 4.6") over a monospace technical id, and the trigger matches — with no wiring:

```tsx
// The picker renders `model.displayName` when the DTO carries it.
<ModelPicker models={models} value={value} onChange={(m) => setValue(m.modelId)} />
```

**Products cannot rename models.** There is deliberately no name prop: the same model reads identically in every product surface, and a wrong or missing name is fixed once, centrally, not patched per product. Models without an authored name fall back to the raw `modelName`. Search matches display names as well as technical ids.

**BYO connection names.** BYO rows render a disambiguating caption from `byoConnectionLabel`. Discovery serves only `byomDetails.integrationServiceConnectionId`, so the host resolves the name (Integration Service `GET connections_/api/v1/Connections/{id}`, one request per distinct connection, worth caching) and passes it in. A row without a label simply renders without a caption.

### 3. Badges from the Apollo pool

The picker derives lifecycle chips automatically (Recommended, Preview, Deprecating, Substituted, Custom, Out-of-region). For product badges beyond those, Apollo owns a shared **badge pool** (`MODEL_BADGES` in `badges.ts`): each pool entry defines the badge's label, tooltip, color variant, and localization once, so the same badge reads identically in every product. Products stamp pool badges per model with `badgesFor`:

```tsx
<ModelPicker
  models={models}
  badgesFor={(m) => (isExpensive(m) ? ['cost-premium'] : ['cost-basic'])}
  value={value}
  onChange={(m) => setValue(m.modelId)}
/>
```

The pool currently ships the cost tiers: `cost-basic`, `cost-standard`, `cost-premium`. **Adding a badge to the pool is a design-system PR**: one entry in `badges.ts` plus its label in `labels.ts` — not a per-product invention. That keeps naming, colors, and translations consistent everywhere.

**Defining a new pool badge** (using a hypothetical "Early access" badge as the example):

1. **Declare the strings in `labels.ts`** — add plain-string fields to `ModelPickerLabels` and their English defaults to `DEFAULT_MODEL_PICKER_LABELS`. Only string-typed fields are usable by the pool (`StaticLabelKey`), so keep them plain rather than formatter functions:

   ```ts
   export interface ModelPickerLabels {
     // …existing labels…
     earlyAccess: string;
     earlyAccessTooltip: string;
   }

   export const DEFAULT_MODEL_PICKER_LABELS: ModelPickerLabels = {
     // …existing defaults…
     earlyAccess: 'Early access',
     earlyAccessTooltip: 'Available before general rollout',
   };
   ```

2. **Register the kind in `badges.ts`** — extend the `ModelBadgeKind` union and add the matching `MODEL_BADGES` entry, referencing the label *keys*:

   ```ts
   export type ModelBadgeKind =
     | 'cost-basic'
     | 'cost-standard'
     | 'cost-premium'
     | 'early-access';

   export const MODEL_BADGES: Record<ModelBadgeKind, ModelBadgeDefinition> = {
     // …existing cost tiers…
     'early-access': {
       label: 'earlyAccess',
       tooltip: 'earlyAccessTooltip', // tooltip is optional
       variant: 'info-mini',
     },
   };
   ```

3. **Hosts translate through `labels`** — apollo-wind ships no catalogs, so a localized host adds `earlyAccess` / `earlyAccessTooltip` to the `labels` object it already passes. Hosts that don't translate get the English defaults automatically.

That's the whole surface: because `ModelBadgeKind` is a union, every product's `badgesFor` callback can return `'early-access'` immediately, and TypeScript flags typos at compile time.

**Picking a `variant`:** default to neutral gray `mini` unless the semantic color genuinely applies (`info-mini`, `success-mini`, `warning-mini`, `error-mini`); `ModelTagChip` maps each onto a wind `Badge` variant. The cost tiers deliberately stay neutral — warning/error coloring would read as "this model is risky", which a price tier is not.

Pool badges render after the built-in chips so the picker's canonical signals (Recommended / Preview / lifecycle) always read first.

**Escape hatch:** `customTagsFor` still accepts free-form `ModelTag`s (appended after pool badges) for experiments and one-offs pending a pool addition; color new kinds via `customTagVariants` (`mini`, `info-mini`, `success-mini`, `warning-mini`, `error-mini`; unknown kinds fall back to neutral gray `mini`). Anything worth shipping should graduate into the pool.

### 4. Recommended and Preview

Recommended and Preview travel on the Discovery DTO. Product teams author their Recommended list in their product's Model Hub configuration; the gateway merges it into the Discovery response, so every model arrives with `isRecommended` and `isPreview` set. The picker builds the corresponding groups and chips from those fields:

```tsx
// The Recommended group + chip come from `model.isRecommended`,
// Preview from `model.isPreview` — no wiring needed.
<ModelPicker models={models} value={value} onChange={(m) => setValue(m.modelId)} />
```

To promote or retire a model, edit your product's Model Hub configuration — no frontend change needed.

Resolution order: `recommendedModelIds` prop (test/storybook override) → DTO `isRecommended` → a local heuristic (`UiPathOwned && !preview && !deprecating`) for backends that don't send the field yet.

### 5. Cost badges

Cost badges are **on by default**: whenever the Discovery DTO carries cost data, each row gets its tier from the Apollo pool (`cost-basic` / `cost-standard` / `cost-premium`) via `defaultCostTier`, which bins `modelDetails.costDetails.flatCosts.inputTokenCost` (cents per million input tokens, the gateway's unit; the first tier is used for tiered pricing) at `$1`/M and `$5`/M. No wiring needed.

A host-supplied `badgesFor` takes over entirely — return your own pool kinds to reclassify, or `[]` to suppress badges:

```tsx
<ModelPicker badgesFor={(m) => (isExpensive(m) ? ['cost-premium'] : [])} … />
```

### 6. BYO management

The BYO affordances — the row actions and the "Use custom model" footer — render when
`canManageByo` is true. The picker does not decide who may manage BYO, and does not perform the
actions; it renders them and calls you.

```tsx
// Whether this user may manage BYO is your call. The platform's own rule is
// organization administrator (`accountRoleType` of ACCOUNT_ADMIN / ACCOUNT_OWNER,
// from portal_/api/organization/UserOrganizationInfo) — the gate the portal puts
// on the AI Trust Layer pages.
const canManage = useIsOrgAdmin();

<ModelPicker
  models={models}
  canManageByo={canManage}
  onEditModel={(m) =>
    window.open(llmConfigurationsEditUrl(m.byomDetails?.byoConfigurationId), '_blank', 'noopener,noreferrer')
  }
  onDeleteModel={async (m) => {
    await deleteConfiguration(m.byomDetails!.byoConfigurationId!);
    await refetch();
  }}
  onUseCustomModel={() => openMyWizard()}
/>
```

- **Delete is confirmed for you, but not performed for you.** Removing a BYO configuration
  affects everyone in the tenant, so the picker always shows a confirm dialog naming the
  configuration before calling `onDeleteModel`. It issues no request itself and does not
  refresh anything: the deleted row stays on screen until you hand back a new `models`, which
  is why the example above awaits its own `refetch()`. If your handler rejects, the message
  surfaces in the picker's own error region rather than vanishing into a floating promise.
- **`onEditModel` and `onUseCustomModel` have no default destination.** The footer still renders
  without `onUseCustomModel`, as a disabled hint, so the affordance is discoverable while you
  wire it.
- **`canManageByo` is a boolean you supply.** The picker does not check roles; fail closed on your
  side (default `false`) so a slow or failed authorization call hides the affordances rather than
  exposing them.

### 7. Folder scoping

Pass `folders` and the toolbar shows a scope switcher; own the selection with `folder` +
`onFolderChange` and refetch your catalog with the new folder key.

```tsx
const folders = useMyFolders(); // e.g. Orchestrator FoldersNavigation/GetFoldersForCurrentUser
const [folder, setFolder] = React.useState<string | null>(null);
const { data: models } = useQuery({ queryKey: ['models', folder], queryFn: () => fetchModels(folder) });

<ModelPicker models={models ?? []} folders={folders} folder={folder} onFolderChange={setFolder} />
```

Two conventions worth keeping when you build that list: drop personal workspaces (not a meaningful
scope for shared model configurations), and use Orchestrator folder **Keys** (GUIDs) as ids — that
is what `X-UiPath-FolderKey` expects on the Discovery request. The picker prepends the
"All folders" sentinel itself; picking it reports `null`.

### 8. View toggle (Category ⇆ Provider)

Both views are built-in. Users switch via a pill segmented control on the toolbar. To control the initial view or hide the toggle entirely:

```tsx
<ModelPicker
  groupBy="vendor"               // initial view: by Provider
  allowGroupingChange={false}    // hide the Category|Provider pill
/>
```

In **Category** view, the section order is: Custom Models (BYO) → Recommended → Preview → More models → Deprecating soon → Other.

In **Provider** view, Custom Models (BYO) comes first, followed by one section per vendor (Anthropic, OpenAI, Google Vertex, AWS Bedrock, …). Within each vendor section, models are ordered by lifecycle: Recommended → Preview → the rest → Deprecating last.

In both views the BYO section is the only collapsible one — it starts expanded, and the header chevron folds it.

### 9. Escape hatches (slots)

Slots are the "I need to do something the picker doesn't natively support" surface. Most products won't need them; reach for a slot only when no prop fits:

```tsx
<ModelPicker
  models={models}
  slots={{
    // Replace the default "Use custom model" footer.
    popupFooter: ({ close }) => (
      <MyCustomFooter onClick={() => { close(); openMyWizard(); }} />
    ),
    // Per-row right-aligned actions (overrides the default edit action).
    optionActions: (m) => (m.byoConnectionLabel ? <MyActions model={m} /> : null),
    // Per-row meta column (between chips and actions).
    optionMeta: (m) => <ContextWindowBar tokens={m.modelDetails?.contextWindowTokens} />,
    // Custom content inside the trigger, next to the model name.
    triggerExtra: (m) => m && <EffortChip />,
    // Banner above the toolbar (e.g. a tenant-level notice).
    popupHeader: () => <TenantUpgradeBanner />,
    // Inline content to the left of the search field (overrides built-in folder switcher).
    searchLeading: () => <MyCustomFolderPicker />,
    // Content directly below the option list, above any popupFooter.
    listFooter: ({ close }) => <ShowAllModelsToggle />,
  }}
/>
```

**Rule of thumb:** if you find yourself reaching for a slot for something everyone wants, propose a new prop instead.

---

## API reference

### `<ModelPicker>` props

| Prop                  | Type                                                  | Description                                                                                                          |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `models`              | `DiscoveryModel[]`                                    | **Required.** The catalog to render. The picker fetches nothing.                                                     |
| `value`               | `string \| null`                                      | Selected `modelId`.                                                                                                  |
| `onChange`            | `(model: DiscoveryModel) => void`                     | Selection callback. Receives the full DTO.                                                                           |
| `label`               | `string`                                              | Label above the trigger. Defaults to a localized "Model".                                                            |
| `required`            | `boolean`                                             | Marks the field as required: visual `*` on the label, `aria-required` on the trigger.                                |
| `placeholder`         | `string`                                              | Placeholder when nothing's selected. Defaults to a localized "Select a model".                                       |
| `disabled`            | `boolean`                                             | Disables the trigger.                                                                                                |
| `invalid`             | `boolean`                                             | Renders the trigger border in error red (`aria-invalid`).                                                            |
| `errorText`           | `string`                                              | Error message rendered under the trigger (`role="alert"`, linked via `aria-describedby`).                            |
| `loading`             | `boolean`                                             | Shows a spinner in the popup.                                                                                        |
| `error`               | `Error \| null`                                       | Renders the error message in the popup body.                                                                         |
| `variant`             | `'searchable' \| 'virtualized'`                       | Default `'searchable'`; auto-switches to the virtualized renderer above 120 visible options. Pass `'virtualized'` to force it. |
| `groupBy`             | `'subscription' \| 'vendor' \| 'flat'`                 | Initial view. Default `'subscription'`.                                                                              |
| `allowGroupingChange` | `boolean`                                             | Show the Category ⇆ Provider toggle. Default `true`.                                                                  |
| `homeRegion`          | `string`                                              | User's home region — a geography code (`'EU'`) or the raw OMS organization region (`'UnitedStates'`, `'Japan'`, …); the picker owns the OMS→geography mapping. Triggers the Out-of-region chip when a model's `routingDetails.geography` differs. |
| `recommendedModelIds` | `readonly string[]`                                   | Test/storybook override for the Recommended set. Production reads `model.isRecommended` from the Discovery DTO.      |
| `previewModelIds`     | `readonly string[]`                                   | Same, for Preview (production: DTO `isPreview`).                                                                     |
| `filter`              | `(m) => boolean`                                      | Per-product filter applied before grouping and search.                                                               |
| `badgesFor`           | `(m) => readonly ModelBadgeKind[]`                    | Stamp badges from the Apollo badge pool (see §3; cost badges in §5).                                                 |
| `customTagsFor`       | `(m) => readonly ModelTag[]`                          | Escape hatch: free-form chips for one-offs pending a pool addition. Prefer `badgesFor`.                              |
| `customTagVariants`   | `Record<string, string>`                              | Chip variant lookup for new tag kinds (`mini`, `info-mini`, …).                                                     |
| `canManageByo`        | `boolean`                                             | Show the BYO row actions and footer CTA. Your authorization model decides; the picker checks no roles.          |
| `onUseCustomModel`    | `() => void`                                          | Footer CTA activation. Without it the CTA renders as a disabled hint.                                                |
| `onEditModel`         | `(model: DiscoveryModel) => void`                     | Edit activation on a BYO row. No default destination; the AI Trust Layer edit page is the usual one.                |
| `folders`             | `readonly { id; label }[]`                            | Folders for the toolbar switcher. The switcher renders when this is non-empty.                                       |
| `folder`              | `string \| null`                                      | Selected folder id (Orchestrator folder Key), or `null` for "All folders".                                           |
| `onFolderChange`      | `(next: string \| null) => void`                      | Folder change callback. Re-fetch your catalog with the new `folderKey`.                                              |
| `allFoldersLabel`     | `string`                                              | Override the "All folders" sentinel label.                                                                           |
| `showGroupHeaders`    | `boolean`                                             | Default `true`. Set `false` for a flat list (grouping still orders rows; sections cannot collapse without a header). |
| `popupContainer`      | `Element \| DocumentFragment \| 'body' \| null`         | Portal target for the popup. Defaults to the nearest `PortalContainerProvider`, then `document.body`.                 |
| `labels`              | `Partial<ModelPickerLabels>`                          | String overrides, merged over `DEFAULT_MODEL_PICKER_LABELS`. See [Internationalization](#internationalization).       |
| `slots`               | `ModelPickerSlots`                                    | Escape hatches. See above.                                                                                           |

---

## Data flow

There isn't one. The picker is a pure function of its props: `models`, `folders`,
`canManageByo`, `loading`, `error`, and the callbacks. Everything platform-shaped — the Discovery
request, folder lists, the org-admin check, BYO deletes, connection-name lookups — lives in the
host. apollo-wind ships no UiPath platform calls; see [Quick start](#quick-start).

The one opinion the component keeps is dropping `isBlockedByPolicy` rows: that is an org-wide
governance verdict, not a rendering preference, and it must not be offered no matter who fetched
the row. Everything else about which models appear is yours, via `filter`.

## Accessibility

The picker implements the WAI-ARIA listbox pattern with keyboard input:

- **Trigger** is `role="combobox"`, like wind's Select and Combobox triggers, so the selected model is announced as the field's value. It carries `aria-haspopup="listbox"`, `aria-controls` pointing at the popup, `aria-expanded`, `aria-invalid`, `aria-required`, and `aria-describedby` linking to the error message.
- **Search input** is `aria-autocomplete="list"`, `aria-controls={listboxId}`, with `aria-activedescendant` updating to the highlighted option as the user navigates with `↑`/`↓` — DOM focus stays on the search.
- **Listbox** has an `aria-label` ("Models" by default, localized).
- **Each option** has a stable id (`{listboxId}-opt-{modelId}`), `role="option"`, and `aria-selected`.
- **Loading / error / empty / result-count** announce via `role="status"` + `aria-live="polite"` and `role="alert"` for errors.
- **Required asterisk** is `aria-hidden`; requiredness is announced by `aria-required` on the trigger.

Keyboard:

- `↑` / `↓` — move the active row
- `Enter` — select the active row, close
- `←` / `→` — collapse / expand the Custom Models section while one of its rows is active (the
  section headers are deliberately not tab stops, so this is the keyboard path to collapsing;
  other sections do not collapse). A collapsed section stays one `↑`/`↓` stop — its header
  highlights and `→` reopens it — so it can never be skipped past
- `Shift+Enter` — edit the active BYO row (calls `onEditModel`)
- `Delete` — delete the active BYO row (opens the confirm dialog) when the key has nothing to
  delete in the search field: caret at the end, no selection. A forward-delete of typed text,
  whitespace included, is never hijacked. The
  row's edit/delete icons are pointer targets, not tab stops: interactive children inside a
  `role="option"` would break the `aria-activedescendant` model.
- `Escape` — close, return focus to the trigger
- `Tab` — moves between trigger, search, and toolbar controls

---

## Theming and dark mode

Every surface is styled with wind's semantic Tailwind tokens — `bg-popover`, `bg-surface-raised`, `bg-surface-hover`, `bg-surface-selected`, `text-foreground`, `text-foreground-muted`, `text-foreground-subtle`, `border-border`, `text-error`, `ring-ring`, `text-brand` — so the picker follows the host's theme class (`light` / `dark` / `.future-*`) with no props or variable overrides. Field errors use the `error` token, never `destructive`: the two resolve to different colours in several themes.

Internals are addressable through stable `data-slot` attributes rather than class names: `model-picker`, `model-picker-trigger`, `model-picker-popup`, `model-picker-toolbar`, `model-picker-listbox`, `model-picker-row`, `model-picker-group-header`, `model-picker-group-by`, `model-picker-tag` (which also carries `data-tag-kind`), `model-picker-folder-switcher`, `model-picker-use-custom-model`.

Overlays (the popup, the folder menu, tooltips, the delete confirm) portal to `document.body` by default. Shadow-DOM and webview hosts should mount a `PortalContainerProvider` around their tree — that redirects every overlay at once — or pass `popupContainer` for this picker alone.

## Internationalization

The picker holds no i18n machinery. Every user-visible string is a field on `ModelPickerLabels`,
and anything you omit falls back to `DEFAULT_MODEL_PICKER_LABELS` — so an unlocalized host
renders real English rather than raw keys.

```tsx
const { t } = useTranslation('myNamespace');
const labels = React.useMemo(
  () => ({
    fieldLabel: t('model_field_label', 'Model'),
    searchPlaceholder: t('model_search_placeholder', 'Search models'),
    resultCount: (n: number) => t('model_resultCount', { defaultValue: '{{count}} models', count: n }),
  }),
  [t]
);

<ModelPicker labels={labels} models={models} />
```

Notes:

- **Interpolated strings are functions**, not templates — `deprecatingTag: (date) => …`,
  `resultCount: (n) => …`, `contextWindow: (tokens) => …`. A translator controls word order,
  which a `{placeholder}` cannot express in every language.
- **Pass a stable reference** (`useMemo`): the picker re-derives chips and groups when `labels`
  changes identity.
- Strings that used to be built in code are fields too: the context column (`1M context`) and
  the section count (`3 models`). `formatContextWindow` is exported if you only want to
  translate the suffix and keep the rounding.
- `resolveLabels(partial)` is exported for standalone use of the primitives.

## Performance

- The picker uses `useMemo` for the catalog → annotated → filtered chain so re-renders without a `models` change skip the work.
- Option rows are memoized (`React.memo` + stable handlers): moving the keyboard highlight or hovering re-renders only the two rows whose `active` flag changed, not the whole list.
- The `searchable` variant auto-switches to the virtualized renderer above 120 visible options, so large catalogs stay smooth without configuration. Pass `variant="virtualized"` to force it.
- The forwarded `ref` points at the trigger button — call `ref.current?.focus()` after a failed form submit to move the user to the field.
- Pass **stable references** for `filter`, `badgesFor`, `customTagsFor` (wrap in `useCallback`) and for `labels` (wrap in `useMemo`). The picker re-derives chips and groups when these change identity.

---

## Files

```
model-picker/
├── README.md                    ← you are here
├── index.ts                     — public barrel
├── types.ts                     — the model shape the picker renders, tag kinds
├── labels.ts                    — ModelPickerLabels contract + English defaults
├── badges.ts                    — the Apollo badge pool (MODEL_BADGES)
├── utils.ts                     — deriveModelTags, groupModels, filterModels
├── useModelPickerState.ts       — state controller hook
├── ModelPicker.tsx              — the picker
├── ModelPicker.test.tsx         — unit tests
├── ModelPicker.stories.tsx      — Storybook stories
├── ModelTagChip.tsx             — semantic Badge wrapper
└── primitives/
    ├── PickerTrigger.tsx        — the button
    ├── PickerPopup.tsx          — Popover content wrapper
    ├── PickerSearchInput.tsx    — search field with leading/trailing slots
    ├── FolderSwitcher.tsx       — toolbar folder pill
    ├── OptionList.tsx           — grouped + virtualized renderers
    ├── ModelOptionRow.tsx       — one row
    └── GroupHeader.tsx          — section header
```

## Differences from the apollo-react picker

The rendered behaviour matches. The prop surface has deliberately diverged, mostly
because this copy owns no data:

1. **It is presentation-only, and so is the package.** No `requestContext`, no self-fetch, no self-delete: `models` is required and the host brings its own data layer. The apollo-react package's platform hooks (`usePlatformAccess`, `useDiscoveryModels`) were not ported — apollo-wind carries no UiPath platform calls.
2. **`labels` replaces Lingui.** See [Internationalization](#internationalization). `loadModelPickerMessages` / `MODEL_PICKER_LOCALES` / `resolveModelPickerLocale` have no equivalent — there are no bundled catalogs.
3. **No `disablePortal`.** Mount a `PortalContainerProvider` instead; it redirects every overlay in the subtree, not just this one.
4. **No `ApModelPicker` alias.** apollo-wind does not use the `Ap` prefix.
5. **The trigger wears `Input`'s chrome**, so it sits flush with the text fields around it.

The prop-driven tests still track the apollo-react originals closely; the self-fetch and self-delete cases retired with the behaviour.

## Storybook

Stories live in `ModelPicker.stories.tsx` under **Components/UiPath/Model Picker**. Run `pnpm storybook` from `packages/apollo-wind` (port 6006). Key stories:

- **Default** — baseline picker
- **Virtualized (500+ models)** — performance variant
- **With per-product filter** — `filter` prop in action
- **With friendly names (Discovery displayName)** — DTO-authored labels, no product wiring
- **With custom badges (escape hatch)** — free-form `customTagsFor` + `customTagVariants`
- **Admin — can manage BYO** — `canManageByo` + `onUseCustomModel`
- **Viewer — read-only BYO** — default, no admin affordances
- **Folder-scoped Custom Models** — built-in folder switcher
- **Recommended from Discovery + cost badges (agents example)** — DTO `isRecommended` + cost chips
- **Routing substitution** — gateway routes traffic; trigger surfaces the redirection
- **Unknown model — graceful fallback** — stored `value` not in catalog
- **Kitchen sink** — every capability turned on at once
- **Dark mode** — the picker re-skinned by a `dark` wrapper alone
