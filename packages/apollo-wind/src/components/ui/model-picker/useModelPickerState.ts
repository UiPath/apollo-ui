import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ModelPickerLabels } from './labels';

import { type AnnotatedModel, isCollapsibleGroup } from './primitives/OptionList';
import type { DiscoveryModel } from './types';
import { filterModels, type GroupStrategy, groupModels, isByoModel } from './utils';

export interface UseModelPickerStateOptions {
  models: DiscoveryModel[];
  value?: string | null;
  /**
   * Connection id of the selected BYO model, when the host persists one.
   * Disambiguates two BYO configurations that serve the same model name
   * under different connections: `value` alone matches the first row,
   * so the wrong one highlights. When provided, `matchesValue` also
   * requires `byomDetails.integrationServiceConnectionId` to equal this.
   * Omit for non-BYO selections.
   */
  valueConnectionId?: string | null;
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
   * Whether sections may collapse at all. A host that hides the group
   * headers has removed the only visible expand control, so collapsing
   * must be off too or rows can vanish with no way back. Default true;
   * flat grouping disables it regardless.
   */
  collapsibleGroups?: boolean;
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
   * Translator instance. Forwarded to `groupModels` so group labels +
   * hints render in the host's active locale. Omit only when the host
   * supplies no translator (tests, isolated primitives).
   */
  labels?: ModelPickerLabels;
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
  selected: DiscoveryModel | null;
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
  /**
   * False when the highlighted row is inside a collapsed section (or the
   * list is empty). The combobox must not publish an active descendant
   * that is not in the DOM.
   */
  activeVisible: boolean;
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
    valueConnectionId,
    onChange,
    groupBy: initialGroupBy = 'subscription',
    collapsibleGroups = true,
    recommendedModelIds,
    previewModelIds,
    filter,
    initiallyCollapsedGroups,
    labels,
  } = opts;

  // React-owned id: stable across SSR/hydration and concurrent renders,
  // unlike a module-level counter. Stripped of the delimiters React wraps it
  // in (":r0:" on 18, "«r0»" on 19) — they are legal in an id attribute but
  // not in a selector, and `optionDomId` sanitizes the other half of these
  // ids for exactly that reason.
  const reactId = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const id = `apollo-model-picker-${reactId}`;

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
  // The in-popup toggle owns this between renders, but a host that passes a
  // new `groupBy` is asking for a reset — the doc on the option says so.
  // Sync on change only, so the toggle's choice survives unrelated rerenders.
  const lastInitialGroupBy = useRef(initialGroupBy);
  useEffect(() => {
    if (lastInitialGroupBy.current === initialGroupBy) return;
    lastInitialGroupBy.current = initialGroupBy;
    setGroupBy(initialGroupBy);
  }, [initialGroupBy]);
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
      labels,
    });
    return groups.flatMap((g) =>
      g.models.map((m) => ({
        ...m,
        groupKey: g.key,
        groupLabel: g.label,
      }))
    );
  }, [visibleModels, groupBy, recommendedModelIds, previewModelIds, labels]);

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

  // Selection lookup prefers the visible (annotated) list but falls
  // back to the raw catalog: a stored selection the host `filter`
  // excluded must still resolve on the trigger — otherwise narrowing
  // the catalog would silently blank the field for legitimate,
  // recently-removed-from-view selections. `unknownValue` stays
  // reserved for ids missing from the catalog entirely.
  // Matches `modelId` or `modelName`: Discovery serves them equal today,
  // but hosts persist model *names*, so name matching keeps stored
  // selections resolving if the two ever diverge.
  const matchesValue = useCallback(
    (m: DiscoveryModel) => {
      if (valueConnectionId) {
        const connId = m.byomDetails?.integrationServiceConnectionId;
        if (connId !== valueConnectionId) return false;
      }
      return m.modelId === value || m.modelName === value;
    },
    [value, valueConnectionId]
  );
  // Without a connection id the value names a model, not a configuration.
  // Hosts (Flow among them) persist "no connection id" to mean the hosted
  // model, and BYO sorts first — so prefer the hosted match, else a stored
  // hosted gpt-4o would come back as the customer's BYO gpt-4o.
  const pickMatch = useCallback(
    (list: readonly DiscoveryModel[]) => {
      const hits = list.filter(matchesValue);
      if (hits.length === 0) return null;
      if (valueConnectionId) return hits[0] ?? null;
      return hits.find((m) => !isByoModel(m)) ?? hits[0] ?? null;
    },
    [matchesValue, valueConnectionId]
  );
  const selected = useMemo<DiscoveryModel | null>(
    () => pickMatch(annotated) ?? pickMatch(models),
    [annotated, models, pickMatch]
  );

  const unknownValue = useMemo<string | null>(() => {
    if (!value) return null;
    // `selected` already falls back to the raw catalog, so any resolved
    // value — visible or host-filtered — is "known".
    if (selected) return null;
    if (models.length === 0) return null;
    return value;
  }, [models, selected, value]);

  // Force every group open while searching so matches always show.
  // Once the query clears, the previously-stored collapse state returns.
  // Collapsing is only real when a header exists to undo it: off when the
  // host hides headers, in flat grouping, and while a query force-expands.
  const canCollapse = collapsibleGroups && groupBy !== 'flat' && !query.trim();
  const collapsedGroups = useMemo<ReadonlySet<string>>(
    () => (canCollapse ? collapsedSet : new Set<string>()),
    [canCollapse, collapsedSet]
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
      const sel = filtered.findIndex(matchesValue);
      setActiveIndex(sel >= 0 ? sel : 0);
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setQuery('');
    }
  }, [open]);

  // A row inside a collapsed section is filtered-in but not rendered. The
  // highlight must never rest on one: `aria-activedescendant` would point
  // at a missing element and Enter would select something invisible.
  const isHiddenAt = useCallback(
    (i: number) => {
      const g = filtered[i]?.groupKey;
      return g !== undefined && isCollapsibleGroup(g) && collapsedGroups.has(g);
    },
    [filtered, collapsedGroups]
  );
  // A collapsed section is one keyboard stop: its first row. The highlight
  // can rest there (unrendered, so not published as the active descendant)
  // so `→` has somewhere to act from and `↑`/`↓` do not skip the section.
  const isCollapsedStop = useCallback(
    (i: number) =>
      isHiddenAt(i) && (i === 0 || filtered[i - 1]?.groupKey !== filtered[i]?.groupKey),
    [filtered, isHiddenAt]
  );
  const nearestStop = useCallback(
    (from: number, dir: 1 | -1) => {
      for (let i = from; i >= 0 && i < filtered.length; i += dir) {
        if (!isHiddenAt(i) || isCollapsedStop(i)) return i;
      }
      return -1;
    },
    [filtered.length, isHiddenAt, isCollapsedStop]
  );

  useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(0);
      return;
    }
    if (!isHiddenAt(activeIndex) || isCollapsedStop(activeIndex)) return;
    // Collapsed under the highlight while it sat mid-section: back up to the
    // section's stop so the user is still "on" what they just collapsed.
    let i = activeIndex;
    while (i > 0 && filtered[i - 1]?.groupKey === filtered[i]?.groupKey) i -= 1;
    setActiveIndex(i);
  }, [filtered, activeIndex, isHiddenAt, isCollapsedStop]);
  const activeVisible = filtered.length > 0 && !isHiddenAt(activeIndex);

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
        // Step over rows hidden in a collapsed section; stay put at the end.
        setActiveIndex((i) => {
          const next = nearestStop(i + 1, 1);
          return next === -1 ? i : next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => {
          const prev = nearestStop(i - 1, -1);
          return prev === -1 ? i : prev;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const m = filtered[activeIndex];
        if (m && !isHiddenAt(activeIndex)) choose(m);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        // Collapse/expand the active option's section from the search field.
        // The section headers are deliberately not tab stops (a `<button>` in
        // a `role="listbox"` is an invalid child and steals a Tab), so without
        // this there is no keyboard path to collapsing at all. Only sections
        // the renderers can collapse respond, so the key never edits state
        // nothing on screen reflects — the same reason it is a no-op while a
        // query force-expands every section.
        const groupKey = filtered[activeIndex]?.groupKey;
        if (!groupKey || !isCollapsibleGroup(groupKey) || !canCollapse) return;
        const collapsed = collapsedGroups.has(groupKey);
        if (e.key === 'ArrowLeft' ? !collapsed : collapsed) {
          e.preventDefault();
          toggleGroup(groupKey);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    },
    [
      filtered,
      activeIndex,
      choose,
      collapsedGroups,
      canCollapse,
      toggleGroup,
      nearestStop,
      isHiddenAt,
    ]
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
    activeVisible,
  };
}
