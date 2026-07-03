import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PickerTranslator } from './i18n';

import type { AnnotatedModel } from './primitives/OptionList';
import type { DiscoveryModel } from './types';
import { filterModels, type GroupStrategy, groupModels } from './utils';

export interface UseModelPickerStateOptions {
  models: DiscoveryModel[];
  value?: string | null;
  /**
   * Selection callback. New shape: `(model)`. Legacy `(modelId, model)`
   * callers can wrap at the call site — see `ModelPickerChangeHandler`
   * in ModelPicker.tsx for the migration note.
   */
  onChange?: (model: DiscoveryModel) => void;
  /**
   * Initial grouping strategy. The hook stores this as internal state so
   * consumers can let the user switch view (Category ⇆ Provider) without
   * lifting the value into the host. Pass a fresh `groupBy` to reset.
   */
  groupBy?: GroupStrategy;
  /**
   * Authoritative recommended/preview model IDs sourced from Model_hub
   * configs in gitops-centralized-cluster. Passed through to
   * `groupModels` so grouping aligns with chip rendering.
   */
  recommendedModelIds?: readonly string[];
  previewModelIds?: readonly string[];
  /**
   * Optional per-product filter applied to the catalog *before* grouping
   * and search. Runs once per `models` array via `useMemo`; pass a
   * stable function reference if `models` is large.
   */
  filter?: (model: DiscoveryModel) => boolean;
  /**
   * Group keys to render as collapsed when the picker first mounts.
   * The hook keeps the collapse map as internal state so the parent
   * doesn't have to. A non-empty search query temporarily forces every
   * group open so matches always show.
   */
  initiallyCollapsedGroups?: readonly string[];
  /**
   * Lingui i18n instance. Forwarded to `groupModels` so group labels +
   * hints render in the host's active locale. Omit only when the host
   * has no Lingui provider in scope (tests, isolated primitives).
   */
  i18n?: PickerTranslator;
}

export interface UseModelPickerStateResult {
  open: boolean;
  setOpen: (next: boolean) => void;
  query: string;
  setQuery: (next: string) => void;
  /** Current grouping strategy. Initially seeded from `opts.groupBy`. */
  groupBy: GroupStrategy;
  setGroupBy: (next: GroupStrategy) => void;
  /**
   * `models` after the host's `filter` ran. Use this for downstream
   * counts and side effects — `annotated`/`filtered` already include
   * this filter, so most consumers won't need it.
   */
  visibleModels: DiscoveryModel[];
  /** All models, annotated with groupKey/groupLabel, sorted into group order. */
  annotated: AnnotatedModel[];
  /** annotated filtered by `query`. */
  filtered: AnnotatedModel[];
  /** Per-group counts (post-filter, pre-query). */
  groupCounts: Record<string, number>;
  /**
   * Group keys currently collapsed. While `query` is non-empty every
   * group is forced open (returns an empty set) so search results stay
   * visible.
   */
  collapsedGroups: ReadonlySet<string>;
  /** Toggle the collapsed state of a single group. */
  toggleGroup: (groupKey: string) => void;
  /** The currently selected model, or null. */
  selected: AnnotatedModel | null;
  /**
   * Raw `value` that couldn't be resolved against `models`. `null` when
   * the selection resolved cleanly, when no `value` was passed, or
   * while the catalog is still loading (empty `models`). Used by the
   * trigger to render an explicit error-state fallback (raw id +
   * red border) instead of silently dropping the value — which would
   * look identical to "nothing selected" and risk accidental
   * overwrites of a stored config.
   */
  unknownValue: string | null;
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  /** Bind to the search input's onKeyDown. */
  onSearchKeyDown: (e: React.KeyboardEvent) => void;
  /** Programmatically pick a model. Closes the popup. */
  choose: (m: DiscoveryModel) => void;
  /** Stable id prefix unique to this picker instance. */
  id: string;
  /** Ref to attach to the trigger button so keyboard focus can return there. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  /** Ref to attach to the search input. */
  searchRef: React.RefObject<HTMLInputElement | null>;
}

let pickerIdCounter = 0;

/**
 * Shared state controller for ModelPicker (and any custom picker a
 * team builds on top of the primitives). Owns:
 *   - open/close state of the popup
 *   - search query + filtering
 *   - grouped + annotated option list
 *   - keyboard navigation index
 *   - collapsed-group bookkeeping
 *   - selection callback
 *
 * Consumers can use this hook directly to assemble their own picker from
 * the exported primitives — see ModelPicker.tsx for the canonical example.
 */
export function useModelPickerState(opts: UseModelPickerStateOptions): UseModelPickerStateResult {
  const {
    models,
    value,
    onChange,
    groupBy: initialGroupBy = 'subscription',
    recommendedModelIds,
    previewModelIds,
    filter,
    initiallyCollapsedGroups,
    i18n,
  } = opts;

  const id = useMemo(() => {
    pickerIdCounter += 1;
    return `apollo-model-picker-${pickerIdCounter}`;
  }, []);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  // Grouping is internal state seeded from the prop. Consumers that need
  // controlled grouping can mirror it via the `setGroupBy` setter; the
  // common case (host passes initial value, user toggles inside the
  // popup) doesn't need any external wiring.
  const [groupBy, setGroupBy] = useState<GroupStrategy>(initialGroupBy);
  // Sticky per-group collapse state, seeded from `initiallyCollapsedGroups`.
  // While the user is searching we force every group open so matches always
  // show; the stored set isn't mutated, so the previous collapse state
  // returns when the query clears.
  const [collapsedSet, setCollapsedSet] = useState<Set<string>>(
    () => new Set(initiallyCollapsedGroups ?? [])
  );

  const visibleModels = useMemo(() => (filter ? models.filter(filter) : models), [models, filter]);

  const annotated = useMemo<AnnotatedModel[]>(() => {
    const groups = groupModels(visibleModels, groupBy, {
      recommendedModelIds,
      previewModelIds,
      i18n,
    });
    return groups.flatMap((g) =>
      g.models.map((m) => ({
        ...m,
        groupKey: g.key,
        groupLabel: g.label,
      }))
    );
  }, [visibleModels, groupBy, recommendedModelIds, previewModelIds, i18n]);

  const filtered = useMemo(
    () => filterModels(annotated, query) as AnnotatedModel[],
    [annotated, query]
  );

  const groupCounts = useMemo<Record<string, number>>(() => {
    const out: Record<string, number> = {};
    for (const m of annotated) {
      out[m.groupKey] = (out[m.groupKey] ?? 0) + 1;
    }
    return out;
  }, [annotated]);

  // Selection lookup uses `models` (not visibleModels) so a stored
  // selection a host filtered out still resolves — otherwise narrowing
  // the catalog would silently flip the trigger into "unknown" state
  // for legitimate, recently-removed-from-view selections.
  const selected = useMemo(
    () => annotated.find((m) => m.modelId === value) ?? null,
    [annotated, value]
  );

  const unknownValue = useMemo<string | null>(() => {
    if (!value) return null;
    if (selected) return null;
    if (models.length === 0) return null;
    // If `value` exists in the raw catalog but was filtered out by the
    // host, we still treat that as "known" — render the placeholder
    // rather than the red error state. The host opted into the filter.
    if (models.some((m) => m.modelId === value)) return null;
    return value;
  }, [models, selected, value]);

  // Force every group open while searching so matches always show.
  // Once the query clears, the previously-stored collapse state returns.
  const collapsedGroups = useMemo<ReadonlySet<string>>(
    () => (query.trim() ? new Set<string>() : collapsedSet),
    [query, collapsedSet]
  );

  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedSet((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on open/close only — re-running on `filtered`/`value` would reset the keyboard highlight on every keystroke
  useEffect(() => {
    if (open) {
      const sel = filtered.findIndex((m) => m.modelId === value);
      setActiveIndex(sel >= 0 ? sel : 0);
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  const choose = useCallback(
    (m: DiscoveryModel) => {
      onChange?.(m);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  const onSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const m = filtered[activeIndex];
        if (m) choose(m);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    },
    [filtered, activeIndex, choose]
  );

  return {
    open,
    setOpen,
    query,
    setQuery,
    groupBy,
    setGroupBy,
    visibleModels,
    annotated,
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
  };
}
