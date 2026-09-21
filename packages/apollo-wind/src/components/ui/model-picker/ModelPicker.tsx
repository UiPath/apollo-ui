'use client';

import { Plus } from 'lucide-react';
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FormField, FormFieldError, FormFieldLabel } from '@/components/ui/form-field';
import { Popover, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib';
import type { ModelBadgeKind } from './badges';
import { DELETE_CONFIRM, defaultTranslator, type PickerTranslator } from './i18n';
import { FolderSwitcher, type FolderSwitcherFolder } from './primitives/FolderSwitcher';
import { defaultRowActions } from './primitives/ModelOptionRow';
import { GroupedOptionList, optionDomId, VirtualOptionList } from './primitives/OptionList';
import { PickerPopup, type PickerPopupProps } from './primitives/PickerPopup';
import { PickerSearchInput } from './primitives/PickerSearchInput';
import { PickerTrigger } from './primitives/PickerTrigger';
import type { DiscoveryModel, ModelTag } from './types';
import { useModelPickerState } from './useModelPickerState';
import {
  buildLlmConfigurationsUrl,
  type LlmConfigurationsLinkOptions,
  type PlatformRequestContext,
  platformNavigation,
  useByoConnectionNames,
  useCanManageByo,
  useDeleteByoConfiguration,
  usePlatformDiscoveryModels,
  useUserFolders,
} from './usePlatformAccess';
import type { DeriveModelTagsContext, GroupStrategy } from './utils';
import { resolveHomeGeography } from './utils';

const EMPTY_MODELS: DiscoveryModel[] = [];

export type ModelPickerVariant = 'searchable' | 'virtualized';

/**
 * Selection callback. The picker calls `onChange(model)` with the full
 * Discovery DTO — read `model.modelId` for the id.
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
   * Per-row right-aligned actions. The default renders an edit action
   * for BYO models (only when `canManageByo` resolves true and a
   * `requestContext` provides the navigation target). Pass null to
   * suppress.
   */
  optionActions?: (model: DiscoveryModel) => React.ReactNode;
}

export interface ModelPickerProps {
  /**
   * The catalog to render, typically from the LLM Gateway Discovery API.
   * Optional when a `requestContext` (with `userId`) is provided: the
   * picker then fetches Discovery itself — including refetching when the
   * folder selection changes and after a BYO delete — so products need no
   * catalog plumbing at all. Pass `models` to override with a host-owned
   * fetch.
   */
  models?: DiscoveryModel[];
  /** Selected `modelId`, or `null`/`undefined` for no selection. */
  value?: string | null;
  /**
   * Connection id of the selected BYO model. Two BYO configurations can
   * serve the same model name under different connections; `value` alone
   * matches the first, so the wrong row highlights. When provided,
   * selection also requires `byomDetails.integrationServiceConnectionId`
   * to match. Omit for non-BYO selections.
   */
  valueConnectionId?: string | null;
  /**
   * Selection callback — receives the picked `DiscoveryModel`. See
   * `ModelPickerChangeHandler` above for the migration note from the
   * legacy `(modelId, model)` shape.
   */
  onChange?: ModelPickerChangeHandler;
  /**
   * Field label above the trigger. Defaults to a localized "Model".
   *
   * Pass `null` when the host already labels the field — a parameter row, a
   * table cell — and a second label would be duplicate chrome. The visible
   * label is then dropped and the trigger keeps an accessible name from
   * `ariaLabel` (falling back to the default "Model"), so suppressing the
   * label never costs the field its name.
   */
  label?: string | null;
  /**
   * Accessible name for the trigger when `label` is `null`. Ignored when a
   * visible label renders — that label names the field.
   */
  ariaLabel?: string;
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
  /**
   * User's home region — used to flag out-of-region models. Accepts a
   * Discovery geography code (`'EU'`) or the raw OMS organization region
   * exactly as PortalShell serves it (`'UnitedStates'`, `'Japan'`, …);
   * the picker owns the OMS→geography mapping so hosts don't each
   * maintain one. Unknown values disable out-of-region chips.
   */
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
   * Chip variant lookup for *new* tag kinds the host
   * introduces via `customTagsFor`. Built-in kinds keep their existing
   * variant. Pass to color custom tags without forking ModelTagChip,
   * e.g. `customTagVariants={{ multimodal: 'info-mini' }}`.
   */
  customTagVariants?: Record<string, string>;
  /**
   * Explicit override for BYO management affordances (edit row action
   * + "Use custom model" footer CTA).
   *
   * **Leave it unset** and pass `requestContext` instead: the picker
   * then checks whether the current user is an **organization
   * administrator** — the same signal the Experiences portal uses to
   * gate the AI Trust Layer admin pages these affordances navigate to.
   * Set `true`/`false` only when your product has its own
   * authorization model. With neither an override nor a
   * `requestContext`, affordances stay hidden.
   *
   * A product that wants different actions can still override via
   * `slots.optionActions`; a different footer can replace the default
   * via `slots.popupFooter` (or `null` to suppress it).
   */
  canManageByo?: boolean;
  /**
   * Override for the default "Use custom model" footer CTA action.
   * When unset and a `requestContext` is provided, activating the CTA
   * navigates to the AI Trust Layer LLM-configurations page — straight
   * to the add form (pre-populated with `requestingProduct` /
   * `requestingFeature`) when the tenant GUID and a concrete folder
   * are known, otherwise to the configurations list. The picker closes
   * itself before navigating/calling.
   */
  onUseCustomModel?: () => void;
  /**
   * Auth + routing context for the picker's built-in platform calls —
   * the folder list (`enableFolders`) and the org-admin check
   * (`canManageByo` unset) — and for the default add/edit navigation
   * into the AI Trust Layer LLM-configurations pages. Pass a **stable
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
   * Include `numericId` when the default add/edit navigation should
   * deep-link into a folder's LLM-configurations pages.
   */
  folders?: readonly FolderSwitcherFolder[];
  /**
   * Selected folder id. `null` means the "All folders" sentinel (omit
   * `X-UiPath-FolderKey` on the Discovery request). Leave undefined to
   * let the picker own the selection (uncontrolled) — with the built-in
   * Discovery fetch this makes folder switching fully self-contained.
   */
  folder?: string | null;
  /** Folder change callback. Optional in uncontrolled/self-fetch mode. */
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
  /**
   * Portal target for the dropdown popup. Hosts that mount the picker inside a
   * shadow root or a webview should pass their root element so the popup
   * resolves the CSS variables scoped to it. Defaults to the nearest
   * `PortalContainerProvider`, then `document.body`.
   *
   * There is deliberately no `disablePortal`: mounting a
   * `PortalContainerProvider` around the host tree solves the same problem
   * for every overlay at once, and is the apollo-wind convention.
   */
  popupContainer?: PickerPopupProps['container'];
  /**
   * Opt out of picker-owned deletion and perform the DELETE yourself.
   *
   * Rarely needed: in self-fetch mode the picker already deletes the BYO
   * configuration through the platform route it has credentials for, so
   * hosts only need `onModelDeleted`. Pass this when a product must route
   * the call somewhere else — the picker then confirms, calls this, and
   * refetches, but issues no request of its own.
   *
   * With a host-owned `models` list there is no request context to delete
   * with, so this is the only way to surface a delete action at all.
   */
  onDeleteModel?: (model: DiscoveryModel) => void | Promise<void>;
  /**
   * Fired after a BYO model is successfully deleted, whether the picker or
   * `onDeleteModel` performed it. The catalog has already been refetched.
   *
   * Use it to reconcile host state the picker cannot know about — most
   * importantly, to pick a replacement when the deleted model was the
   * current selection (the picker does not choose one for you, since what
   * to fall back to is a product decision).
   */
  onModelDeleted?: (model: DiscoveryModel) => void | Promise<void>;
  /**
   * Translator for the picker's own strings. apollo-wind ships no i18n
   * library, so the default renders the English source text. Supply a
   * shim over the host's i18n (a Lingui `i18n` instance satisfies this
   * shape structurally; a react-i18next host wraps `t`) to localize.
   */
  translator?: PickerTranslator;
  /** Extensibility slots. See `ModelPickerSlots`. */
  slots?: ModelPickerSlots;
  /** Rendered as `data-testid` on the picker's root element. */
  testId?: string;
}

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
  function ModelPicker(
    {
      models,
      value,
      valueConnectionId,
      onChange,
      label,
      ariaLabel,
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
      badgesFor,
      customTagsFor,
      customTagVariants,
      canManageByo,
      onUseCustomModel,
      requestContext,
      enableFolders = false,
      folders,
      folder: folderProp,
      onFolderChange,
      allFoldersLabel,
      loading,
      error,
      showGroupHeaders = true,
      popupContainer,
      onDeleteModel,
      onModelDeleted,
      translator,
      slots,
      testId,
    },
    forwardedRef
  ) {
    // apollo-wind ships no i18n: `defaultTranslator` renders each
    // descriptor's English source text, and a host localizes by passing
    // its own translator. A design-system component must never throw or
    // render raw keys in a host that supplies nothing.
    const i18n = translator ?? defaultTranslator;
    const _ = React.useCallback<PickerTranslator['_']>((d) => i18n._(d), [i18n]);

    const defaultLabel = _({ id: 'modelPicker.label.default', message: 'Model' });
    const resolvedLabel = label ?? defaultLabel;
    const labelHidden = label === null;
    const resolvedPlaceholder =
      placeholder ?? _({ id: 'modelPicker.placeholder.selectAModel', message: 'Select a model' });

    // BYO sits at the top of both views and starts expanded — collapsing
    // it by default would hide the most-requested section. The header
    // still renders a chevron so users can collapse it manually.
    const initiallyCollapsedGroups = React.useMemo<readonly string[]>(() => [], []);

    // Folder selection: controlled via `folder`/`onFolderChange`, or owned
    // by the picker when the prop is left undefined.
    const [internalFolder, setInternalFolder] = React.useState<string | null>(null);
    const folderIsControlled = folderProp !== undefined;
    const folder = folderIsControlled ? folderProp : internalFolder;
    const handleFolderChange = React.useCallback(
      (next: string | null) => {
        if (!folderIsControlled) setInternalFolder(next);
        onFolderChange?.(next);
      },
      [folderIsControlled, onFolderChange]
    );

    // Catalog: host-supplied `models`, or fetched from Discovery by the
    // picker itself when only a `requestContext` is provided.
    const selfFetchCtx = !models && requestContext ? requestContext : null;
    const {
      models: fetchedModels,
      loading: discoveryLoading,
      error: discoveryError,
      refetch: refetchDiscovery,
    } = usePlatformDiscoveryModels(selfFetchCtx, folder ?? null);
    const catalog = models ?? fetchedModels ?? EMPTY_MODELS;
    const effectiveLoading = (loading ?? false) || discoveryLoading;

    // Deleting a BYO configuration removes it for every consumer in the
    // tenant, so the picker always confirms first. In self-fetch mode it
    // then issues the DELETE itself — it already holds the credentials and
    // org/tenant path that route needs — and refetches. `onDeleteModel`
    // overrides that for hosts who must own the request.
    const { deleteConfiguration } = useDeleteByoConfiguration(selfFetchCtx);
    const [pendingDelete, setPendingDelete] = React.useState<DiscoveryModel | null>(null);
    const [deleteError, setDeleteError] = React.useState<Error | null>(null);
    const canSelfDelete = !onDeleteModel && !!selfFetchCtx;
    const handleDeleteModel = React.useMemo(() => {
      if (!onDeleteModel && !canSelfDelete) return undefined;
      return (m: DiscoveryModel) => {
        setDeleteError(null);
        setPendingDelete(m);
      };
    }, [onDeleteModel, canSelfDelete]);
    const confirmPendingDelete = React.useCallback(async () => {
      const model = pendingDelete;
      setPendingDelete(null);
      if (!model) return;
      try {
        if (onDeleteModel) {
          await onDeleteModel(model);
        } else {
          const configurationId = model.byomDetails?.byoConfigurationId;
          // Rows without a configuration id never render the action, so this
          // is unreachable in practice — but deleting "nothing" must not look
          // like success to the host.
          if (!configurationId)
            throw new Error('This custom model has no configuration to delete.');
          await deleteConfiguration(configurationId);
        }
      } catch (err) {
        setDeleteError(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      try {
        // Awaited so the host reacts to a refreshed catalog, not the one that
        // still lists the model it just deleted.
        if (selfFetchCtx) await refetchDiscovery();
        await onModelDeleted?.(model);
      } catch (err) {
        // The delete itself succeeded, but this runs from an onClick whose
        // promise nobody holds — a throwing host callback would otherwise be
        // an unhandled rejection with no trace of why nothing happened.
        setDeleteError(err instanceof Error ? err : new Error(String(err)));
      }
    }, [
      pendingDelete,
      onDeleteModel,
      onModelDeleted,
      deleteConfiguration,
      selfFetchCtx,
      refetchDiscovery,
    ]);
    const effectiveError = error ?? deleteError ?? discoveryError;

    // BYO rows without a host-supplied `byoConnectionLabel` get their
    // Integration Service connection name resolved by the picker itself.
    // Policy-blocked models are never rendered (same as the platform BFFs).
    // Which modalities a product offers is the product's call — pass `filter`
    // (see `isTextGenerationModel` for the common chat-only case).
    const connectionNames = useByoConnectionNames(catalog, requestContext ?? null);
    const effectiveModels = React.useMemo(() => {
      const allowed = catalog.filter((m) => !m.isBlockedByPolicy);
      if (connectionNames.size === 0) return allowed;
      return allowed.map((m) => {
        if (m.byoConnectionLabel) return m;
        const id = m.byomDetails?.integrationServiceConnectionId;
        const name = id ? connectionNames.get(id) : undefined;
        return name ? { ...m, byoConnectionLabel: name } : m;
      });
    }, [catalog, connectionNames]);

    const state = useModelPickerState({
      models: effectiveModels,
      value,
      valueConnectionId,
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

    // Closing the popup also drops a failed-delete message. The failure
    // happens while the popup is shut (the confirm dialog closed it), so the
    // message waits for the next open — but it is a transient action failure,
    // not a state of the field, and must not outlive being read.
    const closePopup = React.useCallback(() => {
      setOpen(false);
      setDeleteError(null);
    }, [setOpen]);
    const handleOpenChange = React.useCallback(
      (next: boolean) => {
        if (next) setOpen(true);
        else closePopup();
      },
      [setOpen, closePopup]
    );
    const slotCtx = React.useMemo<ModelPickerSlotContext>(
      () => ({ selected, close: closePopup }),
      [selected, closePopup]
    );

    // BYO management: an explicit `canManageByo` prop wins; otherwise
    // the picker checks whether the user is an organization admin via
    // `requestContext` (failing closed while loading / on error) — the
    // same gate the portal puts on the AI Trust Layer admin pages the
    // affordances navigate to.
    const { canManage: isOrgAdmin } = useCanManageByo(
      canManageByo === undefined && requestContext ? requestContext : null
    );
    const effectiveCanManageByo = canManageByo ?? isOrgAdmin ?? false;

    // Folder list: fetched internally when the product opts in via
    // `enableFolders`, unless a test/storybook override supplies the
    // list directly through `folders`.
    const { folders: fetchedFolders } = useUserFolders(
      enableFolders && !folders && requestContext ? requestContext : null
    );
    const effectiveFolders = folders ?? (enableFolders ? fetchedFolders : undefined);

    // Numeric folder id for the add/edit deep-links. Prefer the selected
    // folder; when none is selected (e.g. "All folders"), fall back to the
    // first available folder so the affordances still deep-link into a
    // concrete folder's add/edit page instead of dead-ending on the
    // configurations list.
    const selectedFolderNumericId = React.useMemo(
      () =>
        effectiveFolders?.find((f) => f.id === folder)?.numericId ??
        effectiveFolders?.find((f) => f.numericId != null)?.numericId,
      [effectiveFolders, folder]
    );
    const navigateToLlmConfigurations = React.useMemo(() => {
      if (!requestContext) return undefined;
      return (link: Omit<LlmConfigurationsLinkOptions, 'folderNumericId'>) => {
        const url = buildLlmConfigurationsUrl(requestContext, {
          ...link,
          folderNumericId: selectedFolderNumericId,
        });
        // Always a new tab: the picker is embedded in a product surface and
        // navigating it away to the AI Trust Layer admin pages would unload
        // the user's in-progress work.
        platformNavigation.openInNewTab(url);
      };
    }, [requestContext, selectedFolderNumericId]);

    // Dev-time guard: duplicate folder ids silently break the switcher's
    // selection highlight. Warn once per list change. `typeof process`
    // keeps this safe in browsers that don't shim Node globals.
    React.useEffect(() => {
      if (
        typeof process === 'undefined' ||
        process.env.NODE_ENV === 'production' ||
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
    // chip derivation stays consistent. `homeRegion` is normalized here —
    // hosts may pass a geography code or the raw OMS region name.
    const homeGeography = resolveHomeGeography(homeRegion);
    const tagContext = React.useMemo<DeriveModelTagsContext>(
      () => ({
        i18n,
        homeRegion: homeGeography,
        recommendedModelIds,
        previewModelIds,
        badgesFor,
        customTagsFor,
      }),
      [i18n, homeGeography, recommendedModelIds, previewModelIds, badgesFor, customTagsFor]
    );

    // In Category view the section header *is* the Recommended/Preview label,
    // so repeating it on rows inside *that* section is noise. `OptionList`
    // narrows this to rows whose own group matches the kind, so a Recommended
    // model filed under Custom Models (BYO) keeps its chip. Provider/flat views
    // pass nothing — there the header carries no lifecycle signal at all.
    // Trigger chips are unaffected.
    const rowHideTagKinds = React.useMemo<readonly string[] | undefined>(
      () => (activeGroupBy === 'subscription' ? ['recommended', 'preview'] : undefined),
      [activeGroupBy]
    );

    // Row actions: respect the slot override, otherwise gate the default
    // edit action by the resolved BYO-management permission and wire it
    // to the LLM-configurations page — the edit form directly when the
    // row carries its configuration id, the configurations list otherwise.
    const renderRowActions = React.useMemo(() => {
      if (slots?.optionActions) return slots.optionActions;
      if (!effectiveCanManageByo) return () => null;
      const onEdit = navigateToLlmConfigurations
        ? (model: DiscoveryModel) =>
            navigateToLlmConfigurations({
              intent: 'edit',
              configurationId: model.byomDetails?.byoConfigurationId,
            })
        : undefined;
      if (!onEdit && !handleDeleteModel) return () => null;
      return (m: DiscoveryModel) => {
        // When the picker owns the DELETE it needs a configuration id to
        // target, so rows lacking one get edit only. A host-supplied
        // handler may know another way, so it always gets the action.
        const deletable =
          handleDeleteModel && (onDeleteModel || !!m.byomDetails?.byoConfigurationId);
        return defaultRowActions(m, {
          i18n,
          onEdit,
          onDelete: deletable ? handleDeleteModel : undefined,
        });
      };
    }, [
      slots?.optionActions,
      effectiveCanManageByo,
      navigateToLlmConfigurations,
      handleDeleteModel,
      onDeleteModel,
      i18n,
    ]);

    // Footer: explicit slot override (including `null`) wins; otherwise
    // the default "Use custom model" CTA appears when the user may manage
    // BYO. Computed as a node (not a render function) so the popup
    // receives stable children.
    const footerNode = React.useMemo<React.ReactNode>(() => {
      if (slots && 'popupFooter' in slots) {
        return slots.popupFooter ? slots.popupFooter(slotCtx) : null;
      }
      if (!effectiveCanManageByo) return null;
      const activate =
        onUseCustomModel ??
        (navigateToLlmConfigurations
          ? () => navigateToLlmConfigurations({ intent: 'add' })
          : undefined);
      return (
        <UseCustomModelFooter
          disabled={!activate}
          i18n={i18n}
          onActivate={() => {
            // Navigate first, then close: opening the new tab must happen
            // synchronously within the click gesture or the browser blocks it
            // as a popup. Closing the popup first can sever that gesture chain.
            activate?.();
            closePopup();
          }}
        />
      );
    }, [
      slots,
      effectiveCanManageByo,
      onUseCustomModel,
      navigateToLlmConfigurations,
      slotCtx,
      closePopup,
      i18n,
    ]);

    // A stored value that hasn't resolved *yet* is not missing, it is pending:
    // render it as plain text so opening a saved form doesn't flash "Select a
    // model" before the catalog arrives. Deliberately keyed on `loading` rather
    // than an empty catalog — a catalog that loaded empty (governance blocked
    // every model) really has lost the selection, and the placeholder plus the
    // host's own explanation is the honest thing to show there.
    const pendingValue = effectiveLoading && !selected && value ? value : null;

    const errorMessage = errorText ?? effectiveError?.message;

    return (
      <FormField className="w-full" data-slot="model-picker" data-testid={testId}>
        {!labelHidden && (
          <FormFieldLabel htmlFor={`${id}-trigger`} required={required}>
            {resolvedLabel}
          </FormFieldLabel>
        )}

        <Popover onOpenChange={handleOpenChange} open={open}>
          <PopoverTrigger asChild>
            <PickerTrigger
              controlsId={listboxId}
              describedById={errorMessage ? `${id}-error` : undefined}
              disabled={disabled}
              extra={slots?.triggerExtra?.(selected)}
              aria-label={labelHidden ? (ariaLabel ?? defaultLabel) : undefined}
              id={`${id}-trigger`}
              invalid={!!invalid || !!effectiveError || !!unknownValue}
              open={open}
              pendingValue={pendingValue}
              placeholder={resolvedPlaceholder}
              ref={handleTriggerRef}
              required={required}
              selected={selected}
              tagContext={tagContext}
              tagVariants={customTagVariants}
              unknownValue={unknownValue}
            />
          </PopoverTrigger>

          <PickerPopup
            container={popupContainer}
            footer={footerNode}
            header={
              <>
                {slots?.popupHeader?.()}
                <PickerSearchInput
                  activeDescendantId={
                    filtered[activeIndex]
                      ? optionDomId(listboxId, filtered[activeIndex].modelId)
                      : undefined
                  }
                  inputRef={searchRef}
                  leading={
                    slots?.searchLeading?.() ??
                    (effectiveFolders &&
                    effectiveFolders.length > 0 &&
                    (onFolderChange || selfFetchCtx) ? (
                      <FolderSwitcher
                        allFoldersLabel={
                          allFoldersLabel ??
                          _({ id: 'modelPicker.folderSwitcher.allFolders', message: 'All folders' })
                        }
                        container={popupContainer}
                        folders={effectiveFolders}
                        onChange={handleFolderChange}
                        value={folder ?? null}
                      />
                    ) : undefined)
                  }
                  listboxId={listboxId}
                  onChange={(next) => {
                    setQuery(next);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onSearchKeyDown}
                  placeholder={_({
                    id: 'modelPicker.search.placeholder',
                    message: 'Search models',
                  })}
                  trailing={
                    allowGroupingChange ? (
                      <GroupBySegmented i18n={i18n} onChange={setGroupBy} value={activeGroupBy} />
                    ) : undefined
                  }
                  value={query}
                />
              </>
            }
            // The state machine drives the highlight through
            // `aria-activedescendant`, so DOM focus must stay on the search
            // input rather than moving to the popover root.
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              searchRef.current?.focus();
            }}
          >
            {effectiveLoading && (
              // biome-ignore lint/a11y/useSemanticElements: a live status region, not an <output>.
              <div
                aria-label={_({ id: 'modelPicker.loading.label', message: 'Loading models' })}
                aria-live="polite"
                className="flex justify-center py-6 text-foreground-muted"
                role="status"
              >
                <Spinner size="sm" />
              </div>
            )}
            {effectiveError && !effectiveLoading && (
              <div className="px-4 py-4 text-center text-[13px] text-error" role="alert">
                {effectiveError.message}
              </div>
            )}
            {!effectiveLoading && !effectiveError && filtered.length === 0 && (
              // biome-ignore lint/a11y/useSemanticElements: a live status region, not an <output>.
              <div
                aria-live="polite"
                className="py-6 text-center text-[13px] text-foreground-muted"
                role="status"
              >
                {query.trim()
                  ? _({
                      id: 'modelPicker.empty.noMatch',
                      message: 'No models match "{query}".',
                      values: { query: query.trim() },
                    })
                  : _({ id: 'modelPicker.empty.noModels', message: 'No models available.' })}
              </div>
            )}
            {/*
            Offscreen result-count announcement. Updates whenever the
            filtered set changes so screen-reader users hear "5 models" /
            "1 model" as they type, without interrupting the rest of the
            popup.
          */}
            <div aria-atomic="true" aria-live="polite" className="sr-only">
              {!effectiveLoading && !effectiveError && filtered.length > 0
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
            </div>
            {!effectiveLoading && !effectiveError && filtered.length > 0 && (
              <>
                <List
                  activeIndex={activeIndex}
                  aria-label={_({ id: 'modelPicker.listbox.label', message: 'Models' })}
                  collapsedGroups={collapsedGroups}
                  groupCounts={groupCounts}
                  hideGroupHeaders={!showGroupHeaders || activeGroupBy === 'flat'}
                  hideTagKinds={rowHideTagKinds}
                  id={listboxId}
                  onGroupToggle={toggleGroup}
                  onSelect={choose}
                  options={filtered}
                  renderRowActions={renderRowActions}
                  renderRowMeta={slots?.optionMeta}
                  selectedId={selected?.modelId ?? value ?? null}
                  setActiveIndex={setActiveIndex}
                  tagContext={tagContext}
                  tagVariants={customTagVariants}
                />
                {slots?.listFooter?.(slotCtx)}
              </>
            )}
          </PickerPopup>
        </Popover>

        {errorMessage && (
          <FormFieldError id={`${id}-error`} role="alert">
            {errorMessage}
          </FormFieldError>
        )}

        <AlertDialog
          onOpenChange={(next) => !next && setPendingDelete(null)}
          open={pendingDelete !== null}
        >
          <AlertDialogContent container={popupContainer}>
            <AlertDialogHeader>
              <AlertDialogTitle>{_(DELETE_CONFIRM.title)}</AlertDialogTitle>
              <AlertDialogDescription>
                {_({
                  ...DELETE_CONFIRM.message,
                  values: {
                    name: pendingDelete
                      ? (pendingDelete.displayName ?? pendingDelete.modelName)
                      : '',
                  },
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {/* Focus lands on the safe action for a destructive confirm. */}
              <AlertDialogCancel autoFocus>{_(DELETE_CONFIRM.cancel)}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-error-background text-error hover:bg-error-background/80"
                onClick={confirmPendingDelete}
              >
                {_(DELETE_CONFIRM.confirm)}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FormField>
    );
  }
);

ModelPicker.displayName = 'ModelPicker';

// ---------------------------------------------------------------------------
// Group-by segmented control (Category ⇆ Provider).
//
// A pill segmented control on the toolbar. `subscription` maps to
// "Category" so end users see the friendlier word.
// ---------------------------------------------------------------------------

interface GroupBySegmentedProps {
  value: GroupStrategy;
  onChange: (next: GroupStrategy) => void;
  i18n: PickerTranslator;
}

const GroupBySegmented: React.FC<GroupBySegmentedProps> = ({ value, onChange, i18n }) => {
  const groupByOptions: Array<{ key: GroupStrategy; label: string }> = [
    {
      key: 'subscription',
      label: i18n._({ id: 'modelPicker.groupBy.category', message: 'Category' }),
    },
    { key: 'vendor', label: i18n._({ id: 'modelPicker.groupBy.provider', message: 'Provider' }) },
  ];
  return (
    // A `role="group"` of toggle buttons rather than a radiogroup: the
    // control changes how the list is ordered, it does not select a value.
    // biome-ignore lint/a11y/useSemanticElements: a toolbar grouping, not a <fieldset>.
    <div
      aria-label={i18n._({ id: 'modelPicker.groupBy.ariaLabel', message: 'Group models by' })}
      className="inline-flex gap-[3px] rounded-lg bg-surface-raised p-[3px]"
      data-slot="model-picker-group-by"
      role="group"
    >
      {groupByOptions.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            aria-pressed={active}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-[12.5px] leading-[1.2] font-semibold transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              active
                ? 'bg-popover text-brand shadow-sm'
                : 'text-foreground-muted hover:bg-surface-hover'
            )}
            key={opt.key}
            onClick={() => onChange(opt.key)}
            type="button"
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Default "Use custom model" footer CTA.
//
// Visible when `canManageByo` is true and no `popupFooter` slot is
// supplied. Full-width tappable band with a small primary tile + title
// + subtitle.
// ---------------------------------------------------------------------------

interface UseCustomModelFooterProps {
  onActivate: () => void;
  /**
   * Render the CTA as a static (non-tappable) hint when neither
   * `onUseCustomModel` nor a `requestContext` (for the default
   * LLM-configurations navigation) is wired. The CTA still shows so
   * the BYO affordance is visible — it just doesn't act on click and
   * surfaces a tooltip explaining why.
   */
  disabled?: boolean;
  i18n: PickerTranslator;
}

const UseCustomModelFooter: React.FC<UseCustomModelFooterProps> = ({
  onActivate,
  disabled,
  i18n,
}) => (
  <button
    className={cn(
      'flex w-full items-center justify-start gap-3 px-4 py-3 text-left text-brand transition-colors',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
      disabled ? 'opacity-55' : 'hover:bg-surface-hover'
    )}
    data-slot="model-picker-use-custom-model"
    disabled={disabled}
    onClick={disabled ? undefined : onActivate}
    title={
      disabled
        ? i18n._({
            id: 'modelPicker.useCustomModel.disabledHint',
            message: 'Pass onUseCustomModel or a requestContext to the picker to wire this action.',
          })
        : undefined
    }
    type="button"
  >
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
      <Plus className="size-[18px]" />
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="text-[13.5px] leading-[1.3] font-semibold">
        {i18n._({ id: 'modelPicker.useCustomModel.title', message: 'Use custom model' })}
      </span>
      <span className="text-xs leading-[1.3] font-normal text-foreground-muted">
        {i18n._({
          id: 'modelPicker.useCustomModel.subtitle',
          message: 'Bring a model from your own connection',
        })}
      </span>
    </span>
  </button>
);
