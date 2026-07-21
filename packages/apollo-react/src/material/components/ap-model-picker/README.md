# ModelPicker

Apollo's shared LLM model picker, built on the UiPath LLM Gateway Discovery API. Ships in `@uipath/apollo-react` under the Material component set (`@uipath/apollo-react/material/components`).

It renders a labeled trigger that opens a popup with a built-in folder switcher, a search field, a Category ⇆ Provider grouping pill, grouped sections — Custom Models (BYO) always first — and a "Use custom model" footer for users who can manage BYO.

The picker is **fully controlled** — your code owns the `value` and the catalog (`models[]`). The picker only renders the UI.

---

## Quick start

```tsx
import { ModelPicker, useDiscoveryModels } from '@uipath/apollo-react/material/components';

const { models, loading, error } = useDiscoveryModels({
  token,
  accountId,
  tenantId,
  requestingProduct: 'agents',
  requestingFeature: 'design-eval-deploy',
});

const [value, setValue] = React.useState<string | null>(null);

<ModelPicker
  models={models}
  loading={loading}
  error={error}
  value={value}
  onChange={(model) => setValue(model.modelId)}
/>
```

That's the minimum. The rest of this document covers the per-product customization surface.

---

## Per-product customization

The picker is one shared visual + behavioral contract. Everything below is a prop on `<ModelPicker>` — no forks, no wrappers, no design-system PRs.

### 1. Filter the visible catalog

When your product should only show a subset of what Discovery returns (specific operation codes, current-user permissions, region constraints), pass a `filter`:

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

### 2. Friendly names

Display names travel on the Discovery DTO, like Recommended. Product teams author them centrally in their Model Hub configuration; the gateway merges them into the response as `displayName`, so every row shows the human label ("Claude Sonnet 4.6") over a monospace technical id, and the trigger matches — with no wiring:

```tsx
// The picker renders `model.displayName` when the DTO carries it.
<ModelPicker models={models} value={value} onChange={(m) => setValue(m.modelId)} />
```

**Products cannot rename models.** There is deliberately no name prop: the same model reads identically in every product surface, and a wrong or missing name is fixed once, centrally, not patched per product. Models without an authored name fall back to the raw `modelName`. Search matches display names as well as technical ids.

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

The pool currently ships the cost tiers: `cost-basic`, `cost-standard`, `cost-premium`. **Adding a badge to the pool is a design-system PR**: one entry in `badges.ts` plus its `msg()` label in `i18n.ts` — not a per-product invention. That keeps naming, colors, and translations consistent everywhere.

**Defining a new pool badge** (using a hypothetical "Early access" badge as the example):

1. **Declare the label in `i18n.ts`** — add `msg()` descriptors to `BADGE_LABELS`, keyed under the `modelPicker.badge.*` id namespace:

   ```ts
   export const BADGE_LABELS = {
     // …existing cost-tier labels…
     earlyAccess: msg({
       id: 'modelPicker.badge.earlyAccess.label',
       message: 'Early access',
     }),
     earlyAccessTooltip: msg({
       id: 'modelPicker.badge.earlyAccess.tooltip',
       message: 'Available before general rollout',
     }),
   } as const;
   ```

2. **Register the kind in `badges.ts`** — extend the `ModelBadgeKind` union and add the matching `MODEL_BADGES` entry:

   ```ts
   export type ModelBadgeKind =
     | 'cost-basic'
     | 'cost-standard'
     | 'cost-premium'
     | 'early-access';

   export const MODEL_BADGES: Record<ModelBadgeKind, ModelBadgeDefinition> = {
     // …existing cost tiers…
     'early-access': {
       label: BADGE_LABELS.earlyAccess,
       tooltip: BADGE_LABELS.earlyAccessTooltip, // tooltip is optional
       variant: 'info-mini',
     },
   };
   ```

3. **Extract translations** — run `pnpm i18n:extract` from `packages/apollo-react` so the new keys land in every `locales/*` catalog (catalogs compile automatically before `build` and `test`).

That's the whole surface: because `ModelBadgeKind` is a union, every product's `badgesFor` callback can return `'early-access'` immediately, and TypeScript flags typos at compile time.

**Picking a `variant`:** default to neutral gray `mini` unless the semantic color genuinely applies (`info-mini`, `success-mini`, `warning-mini`, `error-mini`). The cost tiers deliberately stay neutral — warning/error coloring would read as "this model is risky", which a price tier is not.

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

Cost badges live in the Apollo pool (`cost-basic` / `cost-standard` / `cost-premium`), so the classification is the only per-product decision. The agents product classifies with the exported `defaultCostTier` helper and stamps the matching pool kind:

```tsx
import { defaultCostTier } from '@uipath/apollo-react/material/components';

<ModelPicker
  models={models}
  badgesFor={(m) => {
    const tier = defaultCostTier(m); // null when the DTO has no cost data
    return tier ? [`cost-${tier}` as const] : [];
  }}
/>
```

`defaultCostTier` bins Discovery's `modelDetails.costDetails.inputTokenCost` (USD per million input tokens) at `$1` / `$5`. Copy it, change the thresholds, or classify on something else entirely — the pool badge kinds are the shared contract, the classifier is yours.

### 6. BYO management

BYO management affordances — the edit row action and the "Use custom model" footer — appear only for **organization administrators**, the same gate the Automation Cloud portal puts on the AI Trust Layer admin pages these affordances navigate to. Pass a `requestContext` and the picker runs the check:

```tsx
const requestContext = React.useMemo(() => ({
  token,
  baseUrl,                          // origin + org prefix, e.g. 'https://cloud.uipath.com/acme'
  tenantName,                       // path segment for platform routes
  tenantId,                         // tenant GUID (admin-page deep links)
  requestingProduct: 'agents',      // pre-populates the add-configuration form
  requestingFeature: 'design-eval-deploy',
}), [token, baseUrl, tenantName, tenantId]);

<ModelPicker models={models} requestContext={requestContext} />
```

Under the hood: `GET {baseUrl}/portal_/api/organization/UserOrganizationInfo` — org admin means `accountRoleType` is `ACCOUNT_ADMIN` or `ACCOUNT_OWNER` (the portal's own `isOrgAdminSelector` rule). The check **fails closed**: affordances stay hidden while loading, on error, and while re-checking after the context changes. It is a client-side affordance gate only; the configurations pages and APIs enforce authorization server-side.

**Default navigation.** With a `requestContext` in place the affordances work with zero extra wiring — both lead to the AI Trust Layer LLM-configurations surface (`{baseUrl}/portal_/admin/ai-trust-layer/llm-configurations`):

- The **"Use custom model" footer** opens the *add configuration* form, deep-linked to `/{tenantId}/{folderId}/add` and pre-populated via `?product=&feature=` from `requestingProduct`/`requestingFeature`. The folder id is the switcher's current selection, or — when none is selected ("All folders") — the first available folder, matching the configurations page's own default. Only when no folders exist does it fall back to the configurations list.
- The **edit row action** (BYO rows only) opens the configuration's *edit* form when the model carries `byomDetails.byoConfigurationId` (served by Discovery on UiPath/Arima#2659); when absent it lands on the configurations list scoped to the tenant + folder.
- The **delete row action** (BYO rows only) is opt-in: pass `onDeleteModel` and the picker renders a delete icon next to edit, calling your handler (which performs the deletion and refreshes `models`). Omit it to keep removal on the configurations page only.

By default these navigations replace the current tab; set `openLinksInNewTab` to open the AI Trust Layer pages in a new tab instead (products embedded in a larger surface use this so the user keeps their in-progress work). `onUseCustomModel` overrides the footer's default navigation (e.g. an in-app wizard), and `slots.optionActions` overrides the row actions. Products with their own authorization model can pass `canManageByo` (`true`/`false`); when set, no admin check request is made.

### 7. Folder scoping

Set `enableFolders` and the picker fetches the current user's Orchestrator folders (via the same `requestContext`) and renders the toolbar switcher. Your product only decides whether folder scoping applies to its surface:

```tsx
const [folder, setFolder] = React.useState<string | null>(null);
const { models } = useDiscoveryModels({
  ...ctx,
  folderKey: folder ?? undefined,  // omit → backend returns the union
});

<ModelPicker
  models={models}
  requestContext={requestContext}   // same object as section 6
  enableFolders
  folder={folder}
  onFolderChange={setFolder}
/>
```

Under the hood: `GET {baseUrl}/{tenantName}/orchestrator_/api/FoldersNavigation/GetFoldersForCurrentUser` (the same call the Automation Cloud portal makes). Folder ids are Orchestrator folder **Keys** (GUIDs) — pass the selected id straight through as `folderKey` on your Discovery re-fetch. Personal-workspace folders (`FolderType === 'Personal'`) are always excluded — a personal workspace is not a meaningful scope for shared model configurations; a host that really needs one can supply it via the `folders` prop.

The picker prepends an "All folders" sentinel automatically; picking it fires `onFolderChange(null)` — re-fetch without a `folderKey` to get the union of all folders the user can see.

For tests and Storybook, the `folders` prop overrides the internal fetch with a static list.

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
| `models`              | `DiscoveryModel[]`                                    | The catalog. Required.                                                                                               |
| `value`               | `string \| null`                                      | Selected `modelId`.                                                                                                  |
| `onChange`            | `(model: DiscoveryModel) => void`                     | Selection callback. Receives the full DTO.                                                                           |
| `label`               | `string`                                              | Label above the trigger. Defaults to a localized "Model".                                                            |
| `required`            | `boolean`                                             | Marks the field as required (`aria-required` + visual `*`).                                                          |
| `placeholder`         | `string`                                              | Placeholder when nothing's selected. Defaults to a localized "Select a model".                                       |
| `disabled`            | `boolean`                                             | Disables the trigger.                                                                                                |
| `invalid`             | `boolean`                                             | Renders the trigger border in error red (`aria-invalid`).                                                            |
| `errorText`           | `string`                                              | Error message rendered under the trigger (`role="alert"`, linked via `aria-describedby`).                            |
| `loading`             | `boolean`                                             | Shows a spinner in the popup.                                                                                        |
| `error`               | `Error \| null`                                       | Renders the error message in the popup body.                                                                         |
| `variant`             | `'searchable' \| 'virtualized'`                       | Default `'searchable'`; auto-switches to the virtualized renderer above 120 visible options. Pass `'virtualized'` to force it. |
| `groupBy`             | `'subscription' \| 'vendor' \| 'flat'`                 | Initial view. Default `'subscription'`.                                                                              |
| `allowGroupingChange` | `boolean`                                             | Show the Category ⇆ Provider toggle. Default `true`.                                                                  |
| `homeRegion`          | `string`                                              | User's home region (`'EU'`, `'US'`, …). Triggers the Out-of-region chip when a model's `routingDetails.geography` differs. |
| `recommendedModelIds` | `readonly string[]`                                   | Test/storybook override for the Recommended set. Production reads `model.isRecommended` from the Discovery DTO.      |
| `previewModelIds`     | `readonly string[]`                                   | Same, for Preview (production: DTO `isPreview`).                                                                     |
| `filter`              | `(m) => boolean`                                      | Per-product filter applied before grouping and search.                                                               |
| `badgesFor`           | `(m) => readonly ModelBadgeKind[]`                    | Stamp badges from the Apollo badge pool (see §3; cost badges in §5).                                                 |
| `customTagsFor`       | `(m) => readonly ModelTag[]`                          | Escape hatch: free-form chips for one-offs pending a pool addition. Prefer `badgesFor`.                              |
| `customTagVariants`   | `Record<string, string>`                              | Apollo MUI chip variant lookup for new tag kinds.                                                                    |
| `requestContext`      | `PlatformRequestContext`                              | Auth/routing for the picker's built-in platform calls (org-admin check + folder fetch) and the default add/edit navigation. Pass a memoized object. |
| `canManageByo`        | `boolean`                                             | Explicit override for BYO management. When unset and `requestContext` is provided, the picker checks whether the user is an organization admin. |
| `onUseCustomModel`    | `() => void`                                          | Overrides the footer CTA's default navigation to the LLM-configurations add page. Picker closes itself first.        |
| `enableFolders`       | `boolean`                                             | Turn on folder scoping — the picker fetches the user's Orchestrator folders via `requestContext`. Default `false`.   |
| `folders`             | `readonly { id; label }[]`                            | Test/storybook override for the folder list (skips the internal fetch).                                              |
| `folder`              | `string \| null`                                      | Selected folder id (Orchestrator folder Key), or `null` for "All folders".                                           |
| `onFolderChange`      | `(next: string \| null) => void`                      | Folder change callback. Re-fetch your catalog with the new `folderKey`.                                              |
| `allFoldersLabel`     | `string`                                              | Override the "All folders" sentinel label.                                                                           |
| `showGroupHeaders`    | `boolean`                                             | Default `true`. Set `false` for a flat list (grouping is still applied to ordering).                                 |
| `slots`               | `ModelPickerSlots`                                    | Escape hatches. See above.                                                                                           |

---

## Data flow

The picker is **data-agnostic**. Pass `models` and get `onChange(model)` back.

Optional Discovery API integration via `useDiscoveryModels({ ctx })`:

```ts
const { models, loading, error, refetch } = useDiscoveryModels({
  token,
  baseUrl,
  accountId,
  tenantId,
  requestingProduct: 'agents',
  requestingFeature: 'design-eval-deploy',
  folderKey,         // optional — scopes BYO results
  operationCode,     // optional
});
```

Or skip the hook and feed the picker from your existing data layer (SWR, React Query, Redux, etc.).

---

## Accessibility

The picker implements the WAI-ARIA listbox pattern with keyboard input:

- **Trigger** is `aria-haspopup="listbox"`, with `aria-controls` pointing at the popup, `aria-expanded`, `aria-invalid`, `aria-required`, and `aria-describedby` linking to the error message.
- **Search input** is `aria-autocomplete="list"`, `aria-controls={listboxId}`, with `aria-activedescendant` updating to the highlighted option as the user navigates with `↑`/`↓` — DOM focus stays on the search.
- **Listbox** has an `aria-label` ("Models" by default, localized).
- **Each option** has a stable id (`{listboxId}-opt-{modelId}`), `role="option"`, and `aria-selected`.
- **Loading / error / empty / result-count** announce via `role="status"` + `aria-live="polite"` and `role="alert"` for errors.
- **Required asterisk** is `aria-hidden` (the input carries `aria-required`).

Keyboard:

- `↑` / `↓` — move the active row
- `Enter` — select the active row, close
- `Escape` — close, return focus to the trigger
- `Tab` — moves between trigger, search, and toolbar controls

---

## Theming and dark mode

The picker reads every color through Apollo's CSS custom properties (`--color-*`) with `Colors.*` constants from `@uipath/apollo-core` as fallbacks. It works **without** an Apollo MUI ThemeProvider — required for portal-shell web component hosts.

To swap themes, toggle the `--color-*` variable set at the document root (or any ancestor of the picker). Apollo's standard light/dark themes already provide all the variables the picker reads.

---

## Internationalization

Every user-visible string is keyed under the `modelPicker.*` namespace:

- Runtime strings resolve through `useSafeLingui()` — the host's `I18nProvider` (or `ApI18nProvider`) supplies translations when mounted, and every descriptor falls back to its English `message` otherwise. The picker never throws in providerless hosts.
- Data-driven labels (group names, tag labels) are defined once in `i18n.ts` as `msg()` descriptors and resolved via `i18n._(descriptor)` at render time.

The component has its own catalog entry in `packages/apollo-react/lingui.config.ts` (`ap-model-picker/locales/{locale}`). Extract keys with `pnpm i18n:extract` from `packages/apollo-react`; catalogs compile automatically before `build` and `test`.

---

## Performance

- The picker uses `useMemo` for the catalog → annotated → filtered chain so re-renders without a `models` change skip the work.
- Option rows are memoized (`React.memo` + stable handlers): moving the keyboard highlight or hovering re-renders only the two rows whose `active` flag changed, not the whole list.
- The `searchable` variant auto-switches to the virtualized renderer above 120 visible options, so large catalogs stay smooth without configuration. Pass `variant="virtualized"` to force it.
- The forwarded `ref` points at the trigger button — call `ref.current?.focus()` after a failed form submit to move the user to the field.
- Pass **stable references** for `filter`, `badgesFor`, `customTagsFor` (wrap in `useCallback`) and for `requestContext` (wrap in `useMemo`). The picker re-derives chips / re-fetches when these change identity.

---

## Files

```
ap-model-picker/
├── README.md                    ← you are here
├── index.ts                     — public barrel
├── types.ts                     — Discovery DTO types, tag kinds
├── i18n.ts                      — central message descriptors
├── badges.ts                    — the Apollo badge pool (MODEL_BADGES)
├── utils.ts                     — deriveModelTags, groupModels, filterModels
├── useModelPickerState.ts       — state controller hook
├── useDiscoveryModels.ts        — optional Discovery API hook
├── usePlatformAccess.ts         — folder list + BYO entitlement hooks
├── ModelPicker.tsx              — the picker
├── ModelPicker.test.tsx         — unit tests
├── ModelPicker.stories.tsx      — Storybook stories
├── ModelTagChip.tsx             — semantic Chip wrapper
└── primitives/
    ├── PickerTrigger.tsx        — the button
    ├── PickerPopup.tsx          — Popper + Paper wrapper
    ├── PickerSearchInput.tsx    — search field with leading/trailing slots
    ├── FolderSwitcher.tsx       — toolbar folder pill
    ├── OptionList.tsx           — grouped + virtualized renderers
    ├── ModelOptionRow.tsx       — one row
    └── GroupHeader.tsx          — section header
```

---

## Storybook

Stories live in `ModelPicker.stories.tsx` and appear under **Apollo React/Material (Maintenance Only)/Components/ModelPicker**. Run `pnpm storybook:dev` from the repo root (port 6007). Key stories:

- **Default** — baseline picker
- **Virtualized (500+ models)** — performance variant
- **With per-product filter** — `filter` prop in action
- **With friendly names (Discovery displayName)** — DTO-authored labels, no product wiring
- **With custom badges (escape hatch)** — free-form `customTagsFor` + `customTagVariants`
- **Admin — can manage BYO** — `canManageByo` + `onUseCustomModel`
- **Viewer — read-only BYO** — default, no admin affordances
- **Folder-scoped Custom Models** — built-in folder switcher
- **Recommended from Discovery + cost badges (agents example)** — DTO `isRecommended` + cost chips via `customTagsFor`
- **Routing substitution** — gateway routes traffic; trigger surfaces the redirection
- **Unknown model — graceful fallback** — stored `value` not in catalog
- **Kitchen sink** — every capability turned on at once
- **Dark mode (CSS variables only)** — the picker re-skinned by flipping `--color-*` values on a wrapper, no ThemeProvider
