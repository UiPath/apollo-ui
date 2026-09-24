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
import { type ModelPickerLabels, resolveLabels } from './labels';
import { FolderSwitcher, type FolderSwitcherFolder } from './primitives/FolderSwitcher';
import { defaultRowActions } from './primitives/ModelOptionRow';
import { GroupedOptionList, optionDomId, VirtualOptionList } from './primitives/OptionList';
import { PickerPopup, type PickerPopupProps } from './primitives/PickerPopup';
import { PickerSearchInput } from './primitives/PickerSearchInput';
import { PickerTrigger } from './primitives/PickerTrigger';
import type { DiscoveryModel, ModelTag } from './types';
import { useModelPickerState } from './useModelPickerState';
import type { DeriveModelTagsContext, GroupStrategy } from './utils';
import { isByoModel, resolveHomeGeography } from './utils';

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
   * Per-row right-aligned actions. The default renders edit/delete on BYO
   * rows when `canManageByo` is true and the matching handler is wired.
   * Pass null to suppress.
   */
  optionActions?: (model: DiscoveryModel) => React.ReactNode;
}

export interface ModelPickerProps {
  /**
   * The catalog to render, typically the rows the LLM Gateway Discovery API
   * returns. The picker fetches nothing; how the host loads them is its own
   * business.
   */
  models: DiscoveryModel[];
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
  /**
   * Marks the field required: a visual asterisk on the label, plus
   * `aria-required` on the trigger, which is a `combobox` and so announces
   * it. The search field inside the popup carries no `aria-required`.
   */
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
   * Grouping strategy. The picker holds this as internal state so the
   * in-popup view toggle (see `allowGroupingChange`) can update it without
   * lifting state to the host; passing a different value later resets the
   * view to it. Default: `subscription`.
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
   * Whether to show the BYO management affordances (row actions +
   * "Use custom model" footer CTA).
   *
   * Your authorization model decides — the platform's own rule is
   * organization administrator, the same signal the portal uses to gate the
   * AI Trust Layer admin pages, but the picker does not check it. Defaults to
   * false, so the affordances stay hidden until a host opts in.
   *
   * A product that wants different actions can still override via
   * `slots.optionActions`; a different footer can replace the default
   * via `slots.popupFooter` (or `null` to suppress it).
   */
  canManageByo?: boolean;
  /**
   * Activation for the "Use custom model" footer CTA. There is no default
   * destination; the AI Trust Layer add form is the usual one. Without this
   * the CTA still renders, as a disabled hint, so the affordance stays
   * discoverable. The picker closes itself before calling.
   */
  onUseCustomModel?: () => void;
  /**
   * Folders for the toolbar scope switcher, which renders when this is
   * non-empty — typically the user's Orchestrator folders, fetched by the
   * host. Ids are opaque to the picker: it reports the chosen one through
   * `onFolderChange` and the host refetches.
   */
  folders?: readonly FolderSwitcherFolder[];
  /**
   * Selected folder id. `null` means the "All folders" sentinel. Leave
   * undefined to let the picker own the selection (uncontrolled), which
   * is useful when the folder only drives a client-side `filter`.
   */
  folder?: string | null;
  /**
   * Folder change callback. Optional when uncontrolled; required to refetch
   * a folder-scoped catalog, since the picker fetches nothing itself.
   */
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
   * Delete request for a BYO row. Rendered only when `canManageByo` is true;
   * omit it and no delete action appears.
   *
   * The picker issues no request of its own. It shows a confirmation dialog
   * naming the configuration, then calls this and awaits it — a rejection
   * surfaces in the picker's own error region rather than going unhandled.
   * **Refreshing `models` afterwards is the host's job**; the deleted row
   * stays on screen until a new list arrives.
   */
  onDeleteModel?: (model: DiscoveryModel) => void | Promise<void>;
  /**
   * Edit activation for a BYO row. Rendered only when `canManageByo` is true.
   * The host decides where it leads; the AI Trust Layer edit page is the
   * usual destination.
   */
  onEditModel?: (model: DiscoveryModel) => void;
  /**
   * Overrides for the strings the picker renders. Anything omitted falls back
   * to `DEFAULT_MODEL_PICKER_LABELS`, so an unlocalized host still shows real
   * English rather than raw keys.
   */
  labels?: Partial<ModelPickerLabels>;
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
      folders,
      folder: folderProp,
      onFolderChange,
      allFoldersLabel,
      loading,
      error,
      showGroupHeaders = true,
      popupContainer,
      onDeleteModel,
      onEditModel,
      labels: labelOverrides,
      slots,
      testId,
    },
    forwardedRef
  ) {
    // apollo-wind ships no i18n: every string falls back to its English
    // default, and a host localizes by passing `labels`. A design-system
    // component must never throw or render raw keys in a host that
    // supplies nothing.
    const labels = React.useMemo(() => resolveLabels(labelOverrides), [labelOverrides]);

    const defaultLabel = labels.fieldLabel;
    const resolvedLabel = label ?? defaultLabel;
    const labelHidden = label === null;
    const resolvedPlaceholder = placeholder ?? labels.placeholder;

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

    const catalog = models;
    const effectiveLoading = loading ?? false;

    // Deleting a BYO configuration removes it for every consumer in the
    // tenant, so the picker always confirms first. Confirming is presentation;
    // the request itself belongs to the host, which owns the credentials.
    const [pendingDelete, setPendingDelete] = React.useState<DiscoveryModel | null>(null);
    const [deleteError, setDeleteError] = React.useState<Error | null>(null);
    // Mirrors `pendingDelete` for the popover's close handler, which fires
    // synchronously when focus moves into the portaled confirm dialog.
    const pendingDeleteRef = React.useRef<DiscoveryModel | null>(null);
    pendingDeleteRef.current = pendingDelete;
    // One deletion at a time. The row stays on screen until the host hands
    // back a new `models`, so without this a slow request could be
    // re-submitted from the row action or the Delete shortcut while the
    // first is still in flight. A ref, not state: the guard must hold in
    // the same tick the click lands, before any re-render.
    const deleteInFlight = React.useRef(false);
    const handleDeleteModel = React.useMemo(() => {
      if (!onDeleteModel) return undefined;
      return (m: DiscoveryModel) => {
        if (deleteInFlight.current) return;
        setDeleteError(null);
        setPendingDelete(m);
      };
    }, [onDeleteModel]);
    const confirmPendingDelete = React.useCallback(async () => {
      const model = pendingDelete;
      setPendingDelete(null);
      if (!model || !onDeleteModel || deleteInFlight.current) return;
      deleteInFlight.current = true;
      try {
        await onDeleteModel(model);
      } catch (err) {
        // This runs from an onClick whose promise nobody holds — a throwing
        // host callback would otherwise be an unhandled rejection with no
        // trace of why nothing happened.
        setDeleteError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        deleteInFlight.current = false;
      }
    }, [pendingDelete, onDeleteModel]);
    // Only the host's catalog error takes over the popup and paints the
    // field invalid. A failed delete is reported inside the still-open
    // popup (below) and leaves the list, which is intact, alone.
    const effectiveError = error ?? null;

    const effectiveModels = React.useMemo(() => {
      // The one opinion the component keeps: a policy-blocked model is a
      // governance verdict, not a rendering preference, and must never be
      // offered no matter who fetched the row.
      return catalog.filter((m) => !m.isBlockedByPolicy);
    }, [catalog]);

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
      // Hidden headers mean no expand control, so no collapsing either.
      collapsibleGroups: showGroupHeaders,
      labels,
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
      activeVisible,
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
        if (next) {
          setOpen(true);
          return;
        }
        // The confirm dialog is portaled, so Radix reads focus moving into it
        // as leaving the popover. Keep the list open behind the dialog, the
        // way the Material picker did; the dialog hands focus back on close.
        if (pendingDeleteRef.current) return;
        closePopup();
      },
      [setOpen, closePopup]
    );
    const slotCtx = React.useMemo<ModelPickerSlotContext>(
      () => ({ selected, close: closePopup }),
      [selected, closePopup]
    );

    // BYO management is the host's judgement — it knows its own authorization
    // model; the component just honours the answer.
    const effectiveCanManageByo = canManageByo ?? false;
    const effectiveFolders = folders;

    // The row's edit/delete icons are not tab stops (interactive children of
    // `role="option"` break the activedescendant model), so the keyboard
    // reaches the same actions from the search field: Shift+Enter edits the
    // active BYO row, Delete asks to delete it. Everything
    // else falls through to the listbox navigation.
    const listReady = !effectiveLoading && !effectiveError;
    const handleSearchKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (!listReady) {
          // The list is not rendered (refetch, error): nothing to select,
          // collapse or act on. Escape still closes; typing still filters.
          if (e.key === 'Escape') onSearchKeyDown(e);
          else if (e.key === 'Enter' || e.key.startsWith('Arrow')) e.preventDefault();
          return;
        }
        const active = filtered[activeIndex];
        // `activeVisible`: the index can rest on a row inside a collapsed
        // section (so ArrowRight can reopen it); nothing may act on it there.
        if (active && activeVisible && effectiveCanManageByo && isByoModel(active)) {
          if (e.key === 'Enter' && e.shiftKey && onEditModel) {
            e.preventDefault();
            onEditModel(active);
            return;
          }
          // Only when the key has nothing to delete in the field (caret at the
          // end, no selection), so a forward-delete of typed text, whitespace
          // included, is never hijacked.
          const field = e.currentTarget as HTMLInputElement;
          const nothingToDelete =
            field.selectionStart === field.value.length &&
            field.selectionEnd === field.selectionStart;
          if (e.key === 'Delete' && nothingToDelete && handleDeleteModel) {
            e.preventDefault();
            handleDeleteModel(active);
            return;
          }
        }
        onSearchKeyDown(e);
      },
      [
        listReady,
        filtered,
        activeIndex,
        activeVisible,
        effectiveCanManageByo,
        onEditModel,
        handleDeleteModel,
        onSearchKeyDown,
      ]
    );

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
        labels,
        homeRegion: homeGeography,
        recommendedModelIds,
        previewModelIds,
        badgesFor,
        customTagsFor,
      }),
      [labels, homeGeography, recommendedModelIds, previewModelIds, badgesFor, customTagsFor]
    );

    // Row actions: respect the slot override, otherwise gate the default
    // edit action by the resolved BYO-management permission and wire it
    // to the LLM-configurations page — the edit form directly when the
    // row carries its configuration id, the configurations list otherwise.
    const renderRowActions = React.useMemo(() => {
      if (slots?.optionActions) return slots.optionActions;
      if (!effectiveCanManageByo) return () => null;
      if (!onEditModel && !handleDeleteModel) return () => null;
      return (m: DiscoveryModel) =>
        defaultRowActions(m, { labels, onEdit: onEditModel, onDelete: handleDeleteModel });
    }, [slots?.optionActions, effectiveCanManageByo, onEditModel, handleDeleteModel, labels]);

    // Footer: explicit slot override (including `null`) wins; otherwise
    // the default "Use custom model" CTA appears when the user may manage
    // BYO. Computed as a node (not a render function) so the popup
    // receives stable children.
    const footerNode = React.useMemo<React.ReactNode>(() => {
      if (slots && 'popupFooter' in slots) {
        return slots.popupFooter ? slots.popupFooter(slotCtx) : null;
      }
      if (!effectiveCanManageByo) return null;
      const activate = onUseCustomModel;
      return (
        <UseCustomModelFooter
          disabled={!activate}
          labels={labels}
          onActivate={() => {
            // Navigate first, then close: opening the new tab must happen
            // synchronously within the click gesture or the browser blocks it
            // as a popup. Closing the popup first can sever that gesture chain.
            activate?.();
            closePopup();
          }}
        />
      );
    }, [slots, effectiveCanManageByo, onUseCustomModel, slotCtx, closePopup, labels]);

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
                    // Same gate as the listbox below: while loading or in
                    // error the list is not in the DOM, and a stale
                    // `filtered` must not leave the combobox pointing at an
                    // element that does not exist.
                    listReady && activeVisible && filtered[activeIndex]
                      ? optionDomId(listboxId, filtered[activeIndex].modelId)
                      : undefined
                  }
                  inputRef={searchRef}
                  leading={
                    slots?.searchLeading?.() ??
                    (effectiveFolders && effectiveFolders.length > 0 ? (
                      <FolderSwitcher
                        allFoldersLabel={allFoldersLabel ?? labels.allFolders}
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
                  onKeyDown={handleSearchKeyDown}
                  placeholder={labels.searchPlaceholder}
                  trailing={
                    allowGroupingChange ? (
                      <GroupBySegmented
                        labels={labels}
                        onChange={setGroupBy}
                        value={activeGroupBy}
                      />
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
                aria-label={labels.loading}
                aria-live="polite"
                className="flex justify-center py-6 text-foreground-muted"
                role="status"
              >
                <Spinner size="sm" />
              </div>
            )}
            {effectiveError && !effectiveLoading && (
              <div className="px-4 py-4 text-center text-sm text-error" role="alert">
                {effectiveError.message}
              </div>
            )}
            {deleteError && !effectiveError && (
              <div className="border-b border-border px-4 py-2 text-sm text-error" role="alert">
                {deleteError.message}
              </div>
            )}
            {!effectiveLoading && !effectiveError && filtered.length === 0 && (
              // biome-ignore lint/a11y/useSemanticElements: a live status region, not an <output>.
              <div
                aria-live="polite"
                className="py-6 text-center text-sm text-foreground-muted"
                role="status"
              >
                {query.trim() ? labels.emptyNoMatch(query.trim()) : labels.emptyNoModels}
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
                  ? labels.resultCount(filtered.length)
                  : labels.resultCount(filtered.length)
                : ''}
            </div>
            {!effectiveLoading && !effectiveError && filtered.length > 0 && (
              <>
                <List
                  activeIndex={activeIndex}
                  aria-label={labels.listboxLabel}
                  collapsedGroups={collapsedGroups}
                  groupCounts={groupCounts}
                  hideGroupHeaders={!showGroupHeaders || activeGroupBy === 'flat'}
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
          <AlertDialogContent
            container={popupContainer}
            // Back to the search field, not to whatever the row click focused.
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              searchRef.current?.focus();
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>{labels.deleteConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>
                {labels.deleteConfirmMessage(
                  pendingDelete ? (pendingDelete.displayName ?? pendingDelete.modelName) : ''
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              {/* Focus lands on the safe action for a destructive confirm. */}
              <AlertDialogCancel autoFocus>{labels.deleteConfirmCancel}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-error-background text-error hover:bg-error-background/80"
                onClick={confirmPendingDelete}
              >
                {labels.deleteConfirmConfirm}
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
  labels: ModelPickerLabels;
}

const GroupBySegmented: React.FC<GroupBySegmentedProps> = ({ value, onChange, labels }) => {
  const groupByOptions: Array<{ key: GroupStrategy; label: string }> = [
    {
      key: 'subscription',
      label: labels.groupByCategory,
    },
    { key: 'vendor', label: labels.groupByProvider },
  ];
  return (
    // A `role="group"` of toggle buttons rather than a radiogroup: the
    // control changes how the list is ordered, it does not select a value.
    // biome-ignore lint/a11y/useSemanticElements: a toolbar grouping, not a <fieldset>.
    <div
      aria-label={labels.groupByAriaLabel}
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
              'cursor-pointer rounded-md px-2.5 py-1.5 text-xs leading-tight font-semibold transition-colors',
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
   * Render the CTA as a static (non-tappable) hint when
   * `onUseCustomModel` is not wired. The CTA still shows so the BYO
   * affordance is visible — it just doesn't act on click and surfaces a
   * tooltip explaining why.
   */
  disabled?: boolean;
  labels: ModelPickerLabels;
}

const UseCustomModelFooter: React.FC<UseCustomModelFooterProps> = ({
  onActivate,
  disabled,
  labels,
}) => (
  <button
    className={cn(
      'flex w-full cursor-pointer items-center justify-start gap-3 px-4 py-3 text-left text-brand transition-colors',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset',
      'disabled:cursor-default',
      disabled ? 'opacity-55' : 'hover:bg-surface-hover'
    )}
    data-slot="model-picker-use-custom-model"
    disabled={disabled}
    onClick={disabled ? undefined : onActivate}
    title={disabled ? labels.useCustomModelDisabledHint : undefined}
    type="button"
  >
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
      <Plus className="size-[18px]" />
    </span>
    <span className="flex min-w-0 flex-col">
      <span className="text-sm leading-snug font-semibold">{labels.useCustomModelTitle}</span>
      <span className="text-xs leading-snug font-normal text-foreground-muted">
        {labels.useCustomModelSubtitle}
      </span>
    </span>
  </button>
);
