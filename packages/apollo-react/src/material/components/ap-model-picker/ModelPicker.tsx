import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { Colors, FontFamily } from '@uipath/apollo-core';
import React from 'react';
import { useSafeLingui } from '../../../i18n';
import type { ModelBadgeKind } from './badges';
import { FolderSwitcher } from './primitives/FolderSwitcher';
import { GroupedOptionList, optionDomId, VirtualOptionList } from './primitives/OptionList';
import { PickerPopup } from './primitives/PickerPopup';
import { PickerSearchInput } from './primitives/PickerSearchInput';
import { PickerTrigger } from './primitives/PickerTrigger';
import type { DiscoveryModel, ModelTag } from './types';
import { useModelPickerState } from './useModelPickerState';
import { type PlatformRequestContext, useCanManageByo, useUserFolders } from './usePlatformAccess';
import type { DeriveModelTagsContext, GroupStrategy } from './utils';

export type ModelPickerVariant = 'searchable' | 'virtualized';

/**
 * Selection callback. The picker calls `onChange(model)` with the full
 * Discovery DTO — read `model.modelId` for the id. Hosts migrating from
 * the legacy `(modelId, model)` signature can adapt at the call site:
 *
 *   <ModelPicker onChange={(m) => legacy(m.modelId, m)} ... />
 */
export type ModelPickerChangeHandler = (model: DiscoveryModel) => void;

/**
 * Context handed to footer-type slots (`listFooter`, `popupFooter`).
 * `close()` dismisses the popup — call it before navigating away so
 * the picker doesn't linger over the next screen.
 */
export interface ModelPickerSlotContext {
  selected: DiscoveryModel | null;
  close: () => void;
}

/**
 * Optional slots. Each slot receives the picker's current selected model
 * (or null) and the surrounding context. Use slots to add columns, footers,
 * custom headers without forking the component.
 */
export interface ModelPickerSlots {
  /**
   * Extra content rendered to the right of the model name in the trigger,
   * before the caret. Example: a small "effort" badge.
   */
  triggerExtra?: (model: DiscoveryModel | null) => React.ReactNode;
  /**
   * Rendered above the search input in the popup. Use for a sticky CTA
   * or a banner that spans the full width. Default: nothing.
   *
   * NOTE: for compact inline controls like a folder picker, prefer
   * `searchLeading` — it puts the control on the same row as the search
   * field, sharing chrome instead of stacking a separate banner.
   */
  popupHeader?: () => React.ReactNode;
  /**
   * Rendered to the left of the search field, inline with it. Use for a
   * folder scope picker, a "filter by tag" pill, or any control that
   * scopes the visible options.
   */
  searchLeading?: () => React.ReactNode;
  /**
   * Rendered directly under the option list, flush against the last row
   * but inside the popup's main scroll/content region — *above* any
   * `popupFooter`. Use for inline calls-to-action that should read as
   * part of the list rather than a separate footer band (e.g.,
   * `+ Add custom model` styled like a list row).
   */
  listFooter?: (ctx: ModelPickerSlotContext) => React.ReactNode;
  /**
   * Rendered below the option list in the popup, in its own banded
   * footer with a top border + secondary background. Use for an effort
   * picker, "Show all models" toggle, etc.
   *
   * When `canManageByo` is true and this slot is unset, the picker
   * renders the default "Use custom model" CTA wired to
   * `onUseCustomModel`. Pass a function here to replace the default
   * footer, or `null` to suppress it entirely.
   */
  popupFooter?: null | ((ctx: ModelPickerSlotContext) => React.ReactNode);
  /**
   * Per-row meta column (renders after the model name + chips, before
   * row actions). Use for cost bars, context window indicators, etc.
   */
  optionMeta?: (model: DiscoveryModel) => React.ReactNode;
  /**
   * Per-row right-aligned actions. Default renders edit/delete for BYO
   * models (only when `canManageByo` is true). Pass null to suppress.
   */
  optionActions?: (model: DiscoveryModel) => React.ReactNode;
}

export interface ModelPickerProps {
  /** The catalog to render, typically from the LLM Gateway Discovery API. */
  models: DiscoveryModel[];
  /** Selected `modelId`, or `null`/`undefined` for no selection. */
  value?: string | null;
  /**
   * Selection callback — receives the picked `DiscoveryModel`. See
   * `ModelPickerChangeHandler` above for the migration note from the
   * legacy `(modelId, model)` shape.
   */
  onChange?: ModelPickerChangeHandler;
  /** Field label above the trigger. Defaults to a localized "Model". */
  label?: string;
  /** Marks the field required: `aria-required` + a visual asterisk. */
  required?: boolean;
  /**
   * Trigger text when nothing is selected. Defaults to a localized
   * "Select a model".
   */
  placeholder?: string;
  /** Disables the trigger. */
  disabled?: boolean;
  /** Paints the trigger border error-red and sets `aria-invalid`. */
  invalid?: boolean;
  /**
   * Error message under the trigger (`role="alert"`, associated to the
   * trigger via `aria-describedby`).
   */
  errorText?: string;
  /**
   * Which option-list renderer to use. Default: `searchable`, which
   * renders every row but automatically switches to the virtualized
   * renderer when more than 120 options are visible. Pass
   * `virtualized` to force virtualization regardless of count.
   */
  variant?: ModelPickerVariant;
  /**
   * Initial grouping strategy. The picker holds this as internal state
   * once mounted so the in-popup view toggle (see
   * `allowGroupingChange`) can update it without lifting state to the
   * host. Default: `subscription`.
   */
  groupBy?: GroupStrategy;
  /**
   * Show the in-popup grouping pill (Category ⇆ Provider) on the
   * toolbar. Default: `true`.
   */
  allowGroupingChange?: boolean;
  /** User's home region (e.g. `'EU'`). Used to flag out-of-region models. */
  homeRegion?: string;
  /**
   * Test/storybook override for the Recommended signal. In production
   * the signal arrives ON the Discovery DTO (`model.isRecommended`) —
   * the backend merges `Model_hub/<product>.yaml` from
   * `gitops-centralized-cluster` into the response, so products do NOT
   * fetch Model_hub or pass this prop. When set (even as an empty
   * array), only listed ids count as Recommended.
   */
  recommendedModelIds?: readonly string[];
  /**
   * Test/storybook override for the Preview signal. Production sources
   * it from the DTO's `isPreview`.
   */
  previewModelIds?: readonly string[];
  /**
   * Per-product filter applied to the catalog *before* grouping and
   * search. The most common per-product control: an FPS team scopes
   * the picker to (e.g.) only models that match a given operation
   * code, or only the ones the current user has access to. Pass a
   * stable reference if `models` is large.
   */
  filter?: (model: DiscoveryModel) => boolean;
  /**
   * Per-product override for the human label. In production, display
   * names arrive on the Discovery DTO (`model.displayName`, merged
   * server-side like `isRecommended`) and need no wiring. When this
   * prop is set it wins over the DTO; return `null`/`undefined` from
   * it to fall through to `displayName` and then the raw `modelName`.
   * Rows show the friendly label as the primary line with the
   * technical id as a secondary monospace line; the trigger uses the
   * same resolution so the selected label stays consistent everywhere.
   */
  friendlyNameFor?: (model: DiscoveryModel) => string | null | undefined;
  /**
   * Stamp badges from the Apollo badge pool per model (e.g.
   * `['cost-premium']`). The pool (`MODEL_BADGES` in badges.ts) owns
   * labels, tooltips, variants, and localization so the same badge
   * reads identically in every product; new badges are added to the
   * pool by design-system PR, not invented per product. Pool badges
   * render after the built-in derived tags (Recommended, Preview,
   * Custom, Deprecating, Out-of-region, Substituted).
   */
  badgesFor?: (model: DiscoveryModel) => readonly ModelBadgeKind[];
  /**
   * Escape hatch: free-form chips appended after pool badges. Prefer
   * `badgesFor` — use this only for experiments or one-offs pending a
   * badge-pool addition.
   */
  customTagsFor?: (model: DiscoveryModel) => readonly ModelTag[];
  /**
   * Apollo MUI chip variant lookup for *new* tag kinds the host
   * introduces via `customTagsFor`. Built-in kinds keep their existing
   * variant. Pass to color custom tags without forking ModelTagChip,
   * e.g. `customTagVariants={{ multimodal: 'info-mini' }}`.
   */
  customTagVariants?: Record<string, string>;
  /**
   * Explicit override for BYO management affordances (edit/delete row
   * actions + "Use custom model" footer CTA).
   *
   * **Leave it unset** and pass `requestContext` instead: the picker
   * then checks the `AiTrustLayerByoLlm` license entitlement itself —
   * the same signal the Experiences portal uses to show BYO LLM
   * management. Set `true`/`false` only when your product has its own
   * authorization model. With neither an override nor a
   * `requestContext`, affordances stay hidden.
   *
   * A product that wants different actions can still override via
   * `slots.optionActions`; a different footer can replace the default
   * via `slots.popupFooter` (or `null` to suppress it).
   */
  canManageByo?: boolean;
  /**
   * Called when the user activates the default "Use custom model"
   * footer CTA (visible when BYO management is allowed and no custom
   * `popupFooter` slot is provided). The picker closes itself before
   * calling this — typically the host navigates to the BYO
   * connections page.
   */
  onUseCustomModel?: () => void;
  /**
   * Auth + routing context for the picker's built-in platform calls:
   * the folder list (`enableFolders`) and the BYO-management
   * entitlement check (`canManageByo` unset). Pass a **stable
   * (memoized) object** — the internal hooks refetch when its identity
   * changes.
   */
  requestContext?: PlatformRequestContext;
  /**
   * Turn on folder scoping. The picker fetches the current user's
   * Orchestrator folders itself (via `requestContext`) and renders the
   * toolbar folder switcher — the product only decides *whether*
   * folders apply to its surface. Wire `onFolderChange` and re-fetch
   * Discovery with the new `folderKey` when the selection changes.
   * Default: `false`.
   */
  enableFolders?: boolean;
  /**
   * Test/storybook override for the folder list. When set, the picker
   * skips its internal folder fetch and renders these instead.
   * Production hosts should prefer `enableFolders` + `requestContext`.
   */
  folders?: ReadonlyArray<{ id: string; label: string }>;
  /**
   * Selected folder id. `null` means the "All folders" sentinel (omit
   * `X-UiPath-FolderKey` on the Discovery request).
   */
  folder?: string | null;
  /** Folder change callback. */
  onFolderChange?: (next: string | null) => void;
  /** Label for the "All folders" sentinel. Default: `'All folders'`. */
  allFoldersLabel?: string;
  /** Shows a spinner in the popup while the catalog loads. */
  loading?: boolean;
  /**
   * Catalog fetch error. Renders the message in the popup
   * (`role="alert"`) and paints the trigger invalid.
   */
  error?: Error | null;
  /**
   * Show section header rows (`CUSTOM MODELS (BYO)` / `RECOMMENDED` /
   * `PREVIEW` / `DEPRECATING SOON`) between groups. Default: `true`.
   *
   * Regardless of this setting, models stay ordered by group — BYO
   * first, then Recommended, Preview, More, Deprecating.
   */
  showGroupHeaders?: boolean;
  /** Extensibility slots. See `ModelPickerSlots`. */
  slots?: ModelPickerSlots;
}

// Visual-only marker. The input is announced as required via
// `aria-required` (and `aria-invalid` when blank + invalid), so the
// asterisk is decorative — wrapped in `aria-hidden` below.
const REQUIRED_INDICATOR = '*';

// Above this many visible options the `searchable` variant hands the
// list to the virtualized renderer automatically. Protects hosts with
// big catalogs that never read the `variant` docs. Chosen so typical
// tenant catalogs (< 100 models) keep the simpler non-virtual DOM.
const AUTO_VIRTUALIZE_THRESHOLD = 120;

/**
 * The forwarded ref points at the trigger button, so hosts can focus
 * the picker programmatically (e.g. after a validation failure).
 */
export const ModelPicker = React.forwardRef<HTMLButtonElement, ModelPickerProps>(
  (
    {
      models,
      value,
      onChange,
      label,
      required,
      placeholder,
      disabled,
      invalid,
      errorText,
      variant = 'searchable',
      groupBy = 'subscription',
      allowGroupingChange = true,
      homeRegion,
      recommendedModelIds,
      previewModelIds,
      filter,
      friendlyNameFor,
      badgesFor,
      customTagsFor,
      customTagVariants,
      canManageByo,
      onUseCustomModel,
      requestContext,
      enableFolders = false,
      folders,
      folder = null,
      onFolderChange,
      allFoldersLabel,
      loading,
      error,
      showGroupHeaders = true,
      slots,
    },
    forwardedRef
  ) => {
    // useSafeLingui resolves against the host's I18nProvider when one is
    // mounted and falls back to the English defaults baked into each
    // descriptor otherwise — design-system components must not throw in
    // providerless hosts (see src/i18n/useSafeLingui.ts).
    const { _ } = useSafeLingui();
    const i18n = React.useMemo(() => ({ _ }), [_]);

    const resolvedLabel = label ?? _({ id: 'modelPicker.label.default', message: 'Model' });
    const resolvedPlaceholder =
      placeholder ??
      _({
        id: 'modelPicker.placeholder.selectAModel',
        message: 'Select a model',
      });

    // BYO sits at the top of both views and starts expanded — collapsing
    // it by default would hide the most-requested section. The header
    // still renders a chevron so users can collapse it manually if they
    // want to focus on the hosted catalog.
    const initiallyCollapsedGroups = React.useMemo<readonly string[]>(() => [], []);
    const state = useModelPickerState({
      models,
      value,
      onChange,
      groupBy,
      recommendedModelIds,
      previewModelIds,
      filter,
      initiallyCollapsedGroups,
      i18n,
    });
    const {
      open,
      setOpen,
      query,
      setQuery,
      groupBy: activeGroupBy,
      setGroupBy,
      filtered,
      groupCounts,
      collapsedGroups,
      toggleGroup,
      selected,
      unknownValue,
      activeIndex,
      setActiveIndex,
      onSearchKeyDown,
      choose,
      id,
      triggerRef,
      searchRef,
    } = state;

    const listboxId = `${id}-listbox`;
    // Auto-virtualize large filtered sets so hosts don't need to know
    // about the `variant` prop to stay smooth on big catalogs.
    const List =
      variant === 'virtualized' || filtered.length > AUTO_VIRTUALIZE_THRESHOLD
        ? VirtualOptionList
        : GroupedOptionList;

    // Expose the trigger element on the forwarded ref while keeping the
    // hook's internal ref (focus-return + popup anchoring) wired.
    const handleTriggerRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      },
      [forwardedRef, triggerRef]
    );

    const closePopup = React.useCallback(() => setOpen(false), [setOpen]);
    const slotCtx = React.useMemo<ModelPickerSlotContext>(
      () => ({ selected, close: closePopup }),
      [selected, closePopup]
    );

    // BYO management: an explicit `canManageByo` prop wins; otherwise
    // the picker checks the AiTrustLayerByoLlm entitlement itself via
    // `requestContext` (failing closed while loading / on error).
    const { canManage: entitledToManageByo } = useCanManageByo(
      canManageByo === undefined && requestContext ? requestContext : null
    );
    const effectiveCanManageByo = canManageByo ?? entitledToManageByo ?? false;

    // Folder list: fetched internally when the product opts in via
    // `enableFolders`, unless a test/storybook override supplies the
    // list directly through `folders`.
    const { folders: fetchedFolders } = useUserFolders(
      enableFolders && !folders && requestContext ? requestContext : null
    );
    const effectiveFolders = folders ?? (enableFolders ? fetchedFolders : undefined);

    // Dev-time guard: duplicate folder ids silently break the switcher's
    // selection highlight. Warn once per list change. `typeof process`
    // keeps this safe in browsers that don't shim Node globals (Vite
    // serves Storybook without one); the warning is a Node/dev-bundler
    // nicety, not a runtime feature.
    React.useEffect(() => {
      if (
        typeof process === 'undefined' ||
        process.env['NODE_ENV'] === 'production' ||
        !effectiveFolders
      ) {
        return;
      }
      const seen = new Set<string>();
      for (const f of effectiveFolders) {
        if (seen.has(f.id)) {
          console.warn(
            `[ModelPicker] Duplicate folder id "${f.id}" — folder selection will misbehave.`
          );
          return;
        }
        seen.add(f.id);
      }
    }, [effectiveFolders]);

    // Single tagContext value passed to both trigger + option rows so
    // chip derivation stays consistent. Carries the active i18n instance
    // so tag labels + tooltips render in the host's locale.
    const tagContext = React.useMemo<DeriveModelTagsContext>(
      () => ({
        i18n,
        homeRegion,
        recommendedModelIds,
        previewModelIds,
        badgesFor,
        customTagsFor,
      }),
      [i18n, homeRegion, recommendedModelIds, previewModelIds, badgesFor, customTagsFor]
    );

    // Friendly-name resolution mirrors `isRecommended`: explicit prop
    // (per-product override) → DTO `displayName` (authored centrally,
    // merged into Discovery server-side) → raw `modelName` (the
    // row/trigger fallback when this returns null).
    const resolveFriendlyName = React.useCallback(
      (m: DiscoveryModel) => friendlyNameFor?.(m) ?? m.displayName ?? null,
      [friendlyNameFor]
    );

    const selectedPrimaryLabel = selected ? resolveFriendlyName(selected) : null;

    // In Category view the section header *is* the Recommended/Preview
    // label — repeating it on every row inside the section is noise.
    // Hide both chips on rows when grouped by subscription; keep them in
    // Provider/flat views where the section header doesn't carry that
    // signal. Trigger chips are unaffected (they carry the selection's
    // status even when the popup is closed).
    const rowHideTagKinds = React.useMemo<readonly string[] | undefined>(
      () => (activeGroupBy === 'subscription' ? ['recommended', 'preview'] : undefined),
      [activeGroupBy]
    );

    // Row actions: respect the slot override, otherwise gate the default
    // edit/delete by the resolved BYO-management permission. Returning
    // `undefined` lets OptionList fall back to its own default; passing
    // `null` from a slot suppresses actions entirely.
    const renderRowActions = React.useMemo(() => {
      if (slots?.optionActions) return slots.optionActions;
      if (!effectiveCanManageByo) return () => null;
      return undefined;
    }, [slots?.optionActions, effectiveCanManageByo]);

    // Footer: explicit slot override (including `null`) wins; otherwise
    // the default "Use custom model" CTA appears when the user may
    // manage BYO. Computed as a node (not a render function) so the
    // popup receives stable children.
    const footerNode = React.useMemo<React.ReactNode>(() => {
      if (slots && Object.hasOwn(slots, 'popupFooter')) {
        return slots.popupFooter ? slots.popupFooter(slotCtx) : null;
      }
      if (!effectiveCanManageByo) return null;
      return (
        <UseCustomModelFooter
          onActivate={() => {
            closePopup();
            onUseCustomModel?.();
          }}
          disabled={!onUseCustomModel}
        />
      );
    }, [slots, effectiveCanManageByo, onUseCustomModel, slotCtx, closePopup]);

    return (
      // Typography comes from Apollo's Noto Sans stack directly (not the
      // host's body font) so the picker renders identically in MUI apps,
      // Angular shells, and bare web-component hosts.
      <Box
        className="apollo-model-picker"
        sx={{ width: '100%', fontFamily: FontFamily.FontNormal }}
      >
        <Typography
          component="label"
          htmlFor={`${id}-trigger`}
          sx={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            mb: 0.875,
          }}
        >
          {resolvedLabel}
          {required && (
            <Box
              component="span"
              aria-hidden
              sx={{
                color: `var(--color-error-text, ${Colors.ColorRed700})`,
                ml: 0.25,
              }}
            >
              {REQUIRED_INDICATOR}
            </Box>
          )}
        </Typography>

        <PickerTrigger
          id={`${id}-trigger`}
          triggerRef={handleTriggerRef}
          selected={selected}
          unknownValue={unknownValue}
          placeholder={resolvedPlaceholder}
          disabled={disabled}
          invalid={!!invalid || !!error || !!unknownValue}
          required={required}
          open={open}
          controlsId={listboxId}
          describedById={(errorText ?? error) ? `${id}-error` : undefined}
          tagContext={tagContext}
          tagVariants={customTagVariants}
          primaryLabel={selectedPrimaryLabel}
          extra={slots?.triggerExtra?.(selected)}
          onClick={() => setOpen(!open)}
        />

        {(errorText ?? error) && (
          <Typography
            id={`${id}-error`}
            variant="caption"
            role="alert"
            sx={{
              display: 'block',
              color: `var(--color-error-text, ${Colors.ColorRed700})`,
              mt: 0.5,
              fontSize: 12,
            }}
          >
            {errorText ?? error?.message}
          </Typography>
        )}

        <PickerPopup
          open={open}
          anchorEl={triggerRef.current}
          onClose={closePopup}
          header={
            <>
              {slots?.popupHeader?.()}
              <PickerSearchInput
                value={query}
                onChange={(next) => {
                  setQuery(next);
                  setActiveIndex(0);
                }}
                onKeyDown={onSearchKeyDown}
                inputRef={searchRef}
                listboxId={listboxId}
                activeDescendantId={
                  filtered[activeIndex]
                    ? optionDomId(listboxId, filtered[activeIndex].modelId)
                    : undefined
                }
                leading={
                  slots?.searchLeading?.() ??
                  (effectiveFolders && effectiveFolders.length > 0 && onFolderChange ? (
                    <FolderSwitcher
                      folders={effectiveFolders}
                      value={folder ?? null}
                      onChange={onFolderChange}
                      allFoldersLabel={allFoldersLabel}
                    />
                  ) : undefined)
                }
                trailing={
                  allowGroupingChange ? (
                    <GroupBySegmented value={activeGroupBy} onChange={setGroupBy} />
                  ) : undefined
                }
              />
            </>
          }
          footer={footerNode}
        >
          {loading && (
            <Box
              role="status"
              aria-live="polite"
              aria-label={_({
                id: 'modelPicker.loading.label',
                message: 'Loading models',
              })}
              sx={{
                py: 3,
                display: 'flex',
                justifyContent: 'center',
                color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
              }}
            >
              <CircularProgress size={20} />
            </Box>
          )}
          {error && !loading && (
            <Box
              role="alert"
              sx={{
                py: 2,
                px: 2,
                textAlign: 'center',
                color: `var(--color-error-text, ${Colors.ColorRed700})`,
                fontSize: 13,
              }}
            >
              {error.message}
            </Box>
          )}
          {!loading && !error && filtered.length === 0 && (
            <Box
              role="status"
              aria-live="polite"
              sx={{
                py: 3,
                textAlign: 'center',
                color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
                fontSize: 13,
              }}
            >
              {query.trim()
                ? _({
                    id: 'modelPicker.empty.noMatch',
                    message: 'No models match "{query}".',
                    values: { query: query.trim() },
                  })
                : _({
                    id: 'modelPicker.empty.noModels',
                    message: 'No models available.',
                  })}
            </Box>
          )}
          {/*
          Offscreen result-count announcement. Updates whenever the
          filtered set changes so screen-reader users hear "5 models" /
          "1 model" / "no models" as they type, without us having to
          interrupt the rest of the popup. Visually hidden via the
          standard SR-only pattern (1×1 px, clipped, no margin).
        */}
          <Box
            aria-live="polite"
            aria-atomic="true"
            sx={{
              position: 'absolute',
              width: 1,
              height: 1,
              margin: -1,
              padding: 0,
              overflow: 'hidden',
              clip: 'rect(0 0 0 0)',
              whiteSpace: 'nowrap',
              border: 0,
            }}
          >
            {!loading && !error && filtered.length > 0
              ? filtered.length === 1
                ? _({
                    id: 'modelPicker.count.one',
                    message: '{n} model',
                    values: { n: filtered.length },
                  })
                : _({
                    id: 'modelPicker.count.many',
                    message: '{n} models',
                    values: { n: filtered.length },
                  })
              : ''}
          </Box>
          {!loading && !error && filtered.length > 0 && (
            <>
              <List
                id={listboxId}
                options={filtered}
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                selectedId={value ?? null}
                onSelect={choose}
                tagContext={tagContext}
                tagVariants={customTagVariants}
                friendlyNameFor={resolveFriendlyName}
                groupCounts={groupCounts}
                collapsedGroups={collapsedGroups}
                onGroupToggle={toggleGroup}
                hideGroupHeaders={!showGroupHeaders || activeGroupBy === 'flat'}
                hideTagKinds={rowHideTagKinds}
                renderRowActions={renderRowActions}
                renderRowMeta={slots?.optionMeta}
              />
              {slots?.listFooter?.(slotCtx)}
            </>
          )}
        </PickerPopup>
      </Box>
    );
  }
);

ModelPicker.displayName = 'ModelPicker';

// ---------------------------------------------------------------------------
// Group-by segmented control (Category ⇆ Provider).
//
// Implemented as a pill segmented control on the toolbar — matches the
// design handoff's "Group by" pill, not the earlier icon-button approach.
// `subscription` maps to "Category" so end users see the friendlier word.
// ---------------------------------------------------------------------------

interface GroupBySegmentedProps {
  value: GroupStrategy;
  onChange: (next: GroupStrategy) => void;
}

const GroupBySegmented: React.FC<GroupBySegmentedProps> = ({ value, onChange }) => {
  const { _ } = useSafeLingui();
  const groupByOptions: Array<{ key: GroupStrategy; label: string }> = [
    {
      key: 'subscription',
      label: _({ id: 'modelPicker.groupBy.category', message: 'Category' }),
    },
    {
      key: 'vendor',
      label: _({ id: 'modelPicker.groupBy.provider', message: 'Provider' }),
    },
  ];
  return (
    <Box
      role="group"
      aria-label={_({
        id: 'modelPicker.groupBy.ariaLabel',
        message: 'Group models by',
      })}
      sx={{
        display: 'inline-flex',
        // Pill track sits on a soft gray fill; selected segment lifts
        // out with a white pill + shadow per the handoff.
        backgroundColor: `var(--color-background-secondary, ${Colors.ColorGray150})`,
        borderRadius: '8px',
        p: '3px',
        gap: '3px',
      }}
    >
      {groupByOptions.map((opt) => {
        const active = opt.key === value;
        return (
          <ButtonBase
            key={opt.key}
            onClick={() => onChange(opt.key)}
            aria-pressed={active}
            sx={{
              fontSize: 12.5,
              fontWeight: 600,
              lineHeight: 1.2,
              px: 1.25,
              py: 0.625,
              borderRadius: '6px',
              color: active
                ? `var(--color-primary, ${Colors.ColorBlue500})`
                : `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
              backgroundColor: active
                ? `var(--color-background-raised, ${Colors.ColorWhite})`
                : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(16, 24, 40, 0.14)' : 'none',
              transition: 'background-color 120ms, color 120ms, box-shadow 120ms',
              '&:hover': {
                backgroundColor: active
                  ? `var(--color-background-raised, ${Colors.ColorWhite})`
                  : `var(--color-background-hover, rgba(82, 96, 105, 0.078))`,
              },
            }}
          >
            {opt.label}
          </ButtonBase>
        );
      })}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Default "Use custom model" footer CTA.
//
// Visible when `canManageByo` is true and no `popupFooter` slot is
// supplied. Full-width tappable band with a small primary tile + title
// + subtitle — matches the design handoff exactly.
// ---------------------------------------------------------------------------

interface UseCustomModelFooterProps {
  onActivate: () => void;
  /**
   * Render the CTA as a static (non-tappable) hint when the host
   * forgot to wire `onUseCustomModel`. The CTA still shows so the
   * BYO affordance is visible — it just doesn't crash on click and
   * surfaces a tooltip explaining why.
   */
  disabled?: boolean;
}

const UseCustomModelFooter: React.FC<UseCustomModelFooterProps> = ({ onActivate, disabled }) => {
  const { _ } = useSafeLingui();
  return (
    <ButtonBase
      onClick={disabled ? undefined : onActivate}
      disabled={disabled}
      title={
        disabled
          ? _({
              id: 'modelPicker.useCustomModel.disabledHint',
              message: 'Pass onUseCustomModel to the picker to wire this action.',
            })
          : undefined
      }
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 1.25,
        px: 2,
        py: 1.5,
        textAlign: 'left',
        color: `var(--color-primary, ${Colors.ColorBlue500})`,
        transition: 'background-color 120ms',
        '&:hover': {
          backgroundColor: disabled
            ? 'transparent'
            : `var(--color-primary-lighter, rgba(0, 103, 223, 0.06))`,
        },
        '&:focus-visible': {
          outline: 'none',
          boxShadow: `inset 0 0 0 2px var(--color-primary-focused, rgba(0, 103, 223, 0.2))`,
        },
        '&.Mui-disabled': {
          opacity: 0.55,
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `var(--color-primary-lighter, rgba(0, 103, 223, 0.10))`,
          color: `var(--color-primary, ${Colors.ColorBlue500})`,
        }}
      >
        <AddIcon sx={{ fontSize: 18 }} />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Box component="span" sx={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>
          {_({
            id: 'modelPicker.useCustomModel.title',
            message: 'Use custom model',
          })}
        </Box>
        <Box
          component="span"
          sx={{
            fontSize: 12,
            color: `var(--color-foreground-de-emp, ${Colors.ColorGray550})`,
            fontWeight: 400,
            lineHeight: 1.3,
          }}
        >
          {_({
            id: 'modelPicker.useCustomModel.subtitle',
            message: 'Bring a model from your own connection',
          })}
        </Box>
      </Box>
    </ButtonBase>
  );
};
