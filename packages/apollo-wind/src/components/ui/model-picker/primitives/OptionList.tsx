'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { Shield } from 'lucide-react';
import React, { useEffect, useMemo, useRef } from 'react';
import { DEFAULT_MODEL_PICKER_LABELS, type ModelPickerLabels } from '../labels';
import type { DiscoveryModel } from '../types';
import type { DeriveModelTagsContext } from '../utils';
import { GroupHeader } from './GroupHeader';
import { DENSE_OPTION_HEIGHT, FULL_OPTION_HEIGHT, ModelOptionRow } from './ModelOptionRow';

export interface AnnotatedModel extends DiscoveryModel {
  groupKey: string;
  groupLabel: string;
}

export interface OptionListProps {
  id: string;
  options: AnnotatedModel[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  selectedId: string | null;
  onSelect: (m: DiscoveryModel) => void;
  /**
   * Forwarded to every row's `deriveModelTags` call. Use for
   * `recommendedModelIds`, `previewModelIds`, `costTierFor`,
   * `customTagsFor`, `homeRegion`, and the translator.
   */
  tagContext?: DeriveModelTagsContext;
  /**
   * Variant lookup for tag kinds the design system doesn't know
   * about. Forwarded to every row's `<ModelTagChip>`.
   */
  tagVariants?: Record<string, string>;
  /**
   * Group counts used by GroupHeader to render the right-aligned count
   * (e.g. "3 models"). Keyed by `groupKey`. When omitted, the
   * counter is derived from the visible options.
   */
  groupCounts?: Record<string, number>;
  /** Override the BYO edit/delete row actions. Return null to suppress. */
  renderRowActions?: (m: DiscoveryModel) => React.ReactNode;
  /** Per-row meta column (cost, context window, etc.). */
  renderRowMeta?: (m: DiscoveryModel) => React.ReactNode;
  /** Reduced row + header sizes. */
  dense?: boolean;
  /** Maximum height of the scroll region. Default 362 (design spec). */
  maxHeight?: number;
  /**
   * Suppress group header rows. Options are still grouped + ordered as
   * usual; only the visual section labels are hidden. Use for compact /
   * inline pickers where headers add too much chrome.
   */
  hideGroupHeaders?: boolean;
  /**
   * Tag kinds to hide from chips on a row **whose own group already conveys
   * them** — a "Recommended" chip inside the Recommended section is noise.
   * Matching is by group key, so a kind is only suppressed where it is
   * genuinely redundant: a Recommended model filed under Custom Models (BYO)
   * keeps its chip, because that section says nothing about lifecycle.
   *
   * Tags are still derived by `deriveModelTags`; this only affects rendering.
   *
   * Opt-in: `ModelPicker` passes nothing, so every chip renders everywhere.
   */
  hideTagKinds?: readonly string[];
  /**
   * Accessible name for the listbox. Defaults to "Models". Screen
   * readers announce this when focus enters the picker so users know
   * what they're selecting from.
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  'aria-label'?: string;
  /**
   * Set of group keys currently rendered as collapsed (header visible,
   * options hidden). Today only the BYO group ('byo') is supported as
   * collapsible; the parent ModelPicker owns this state.
   */
  collapsedGroups?: ReadonlySet<string>;
  /** Click handler for collapsible group headers. */
  onGroupToggle?: (groupKey: string) => void;
}

const BYO_GROUP_KEY = 'byo';

/**
 * Which sections can collapse. One rule for both renderers and for the
 * keyboard handler in `useModelPickerState`, so a key in `collapsedGroups`
 * never hides rows in one renderer and not the other. Today: BYO only.
 */
export function isCollapsibleGroup(groupKey: string): boolean {
  return groupKey === BYO_GROUP_KEY;
}

// Design-spec scroll height for the dropdown's list region.
const DEFAULT_LIST_MAX_HEIGHT = 362;

/**
 * Per-group decorations rendered into the header (leading icon).
 * Today only BYO carries a glyph (shield); other groups stay text-only.
 */
function groupLeadingIcon(groupKey: string): React.ReactNode {
  if (groupKey === BYO_GROUP_KEY) {
    return <Shield className="size-3.5" />;
  }
  return null;
}

const GROUP_HINT_KEYS = {
  recommended: 'recommendedGroupHint',
  preview: 'previewGroupHint',
  byo: 'byoGroupHint',
  more: 'moreGroupHint',
  deprecating: 'deprecatingGroupHint',
} as const satisfies Record<string, keyof ModelPickerLabels>;

/** Tooltip hint for a built-in group; unknown keys get none. */
function groupHint(groupKey: string, labels: ModelPickerLabels): string | undefined {
  const key = GROUP_HINT_KEYS[groupKey as keyof typeof GROUP_HINT_KEYS];
  return key ? labels[key] : undefined;
}

/** The "{n} models" count on a section header. */
function countLabel(n: number | undefined, labels: ModelPickerLabels): string | undefined {
  return n == null ? undefined : labels.modelCount(n);
}

/**
 * Build a stable DOM id for a given option, derived from the listbox
 * id + the model's id. Used by the search input's
 * `aria-activedescendant` so screen readers can announce the active
 * option without moving DOM focus.
 */
export function optionDomId(listboxId: string, modelId: string): string {
  // modelIds in production are dotted (e.g. anthropic.claude-...). DOM
  // ids are valid with dots, but consumers sometimes target them via
  // querySelector, where a dot is a class separator. The encoding must
  // also be injective: mapping every odd character to `-` gave `a.b` and
  // `a-b` the same id, so `aria-activedescendant` could resolve the wrong
  // row. Letters, digits and `-` pass through; everything else, `_`
  // included, becomes `_<hex>_`, so a literal `_` never appears raw and
  // each encoded id decodes to exactly one modelId.
  const safe = modelId.replace(/[^A-Za-z0-9-]/g, (c) => `_${c.codePointAt(0)?.toString(16)}_`);
  return `${listboxId}-opt-${safe}`;
}

export const GroupedOptionList: React.FC<OptionListProps> = ({
  id,
  options,
  activeIndex,
  setActiveIndex,
  selectedId,
  onSelect,
  tagContext,
  tagVariants,
  groupCounts,
  renderRowActions,
  renderRowMeta,
  dense,
  maxHeight = DEFAULT_LIST_MAX_HEIGHT,
  hideGroupHeaders,
  hideTagKinds,
  collapsedGroups,
  onGroupToggle,
  'aria-label': ariaLabel = 'Models',
}) => {
  const labels = tagContext?.labels ?? DEFAULT_MODEL_PICKER_LABELS;
  let lastGroupKey: string | undefined;
  let headerCount = 0;
  // Compute counts up front when the parent didn't supply them — useful
  // for standalone primitive composition.
  const derivedCounts = useMemo(() => {
    if (groupCounts) return groupCounts;
    const out: Record<string, number> = {};
    for (const o of options) {
      out[o.groupKey] = (out[o.groupKey] ?? 0) + 1;
    }
    return out;
  }, [groupCounts, options]);

  return (
    <div
      aria-label={ariaLabel}
      className="overflow-y-auto py-1"
      data-slot="model-picker-listbox"
      id={id}
      role="listbox"
      style={{ maxHeight }}
    >
      {options.map((opt, i) => {
        const showHeader = !hideGroupHeaders && opt.groupKey !== lastGroupKey;
        const isFirstHeader = showHeader && headerCount === 0;
        if (showHeader) headerCount += 1;
        lastGroupKey = opt.groupKey;
        // BYO is the only currently collapsible group. The parent owns
        // the open/closed state via `collapsedGroups`; we just consult
        // it here to skip rendering rows + flip the header chevron.
        const isCollapsible = isCollapsibleGroup(opt.groupKey);
        const isCollapsed = isCollapsible && (collapsedGroups?.has(opt.groupKey) ?? false);
        return (
          <React.Fragment key={opt.modelId}>
            {showHeader && (
              <GroupHeader
                label={opt.groupLabel}
                hint={groupHint(opt.groupKey, labels)}
                count={derivedCounts[opt.groupKey]}
                countLabel={countLabel(derivedCounts[opt.groupKey], labels)}
                dense={dense}
                isFirst={isFirstHeader}
                leadingIcon={groupLeadingIcon(opt.groupKey)}
                collapsible={isCollapsible}
                collapsed={isCollapsed}
                onToggle={isCollapsible ? () => onGroupToggle?.(opt.groupKey) : undefined}
              />
            )}
            {!isCollapsed && (
              <ModelOptionRow
                id={optionDomId(id, opt.modelId)}
                model={opt}
                index={i}
                active={i === activeIndex}
                selected={opt.modelId === selectedId}
                onSelect={onSelect}
                onActivate={setActiveIndex}
                tagContext={tagContext}
                tagVariants={tagVariants}
                hideTagKinds={hideTagKinds?.filter((k) => k === opt.groupKey)}
                renderMeta={renderRowMeta}
                renderActions={renderRowActions}
                dense={dense}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const VirtualOptionList: React.FC<OptionListProps> = ({
  id,
  options,
  activeIndex,
  setActiveIndex,
  selectedId,
  onSelect,
  tagContext,
  tagVariants,
  groupCounts,
  renderRowActions,
  renderRowMeta,
  dense,
  maxHeight = DEFAULT_LIST_MAX_HEIGHT,
  hideGroupHeaders,
  hideTagKinds,
  collapsedGroups,
  onGroupToggle,
  'aria-label': ariaLabel = 'Models',
}) => {
  const labels = tagContext?.labels ?? DEFAULT_MODEL_PICKER_LABELS;
  type Row =
    | {
        kind: 'header';
        key: string;
        groupKey: string;
        label: string;
        isFirst: boolean;
        count: number;
      }
    | {
        kind: 'option';
        key: string;
        model: AnnotatedModel;
        index: number;
      };

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastGroupKey: string | undefined;
    let headerCount = 0;
    const counts: Record<string, number> = groupCounts ?? {};
    if (!groupCounts) {
      for (const o of options) counts[o.groupKey] = (counts[o.groupKey] ?? 0) + 1;
    }
    options.forEach((opt, i) => {
      const collapsed =
        isCollapsibleGroup(opt.groupKey) && (collapsedGroups?.has(opt.groupKey) ?? false);
      if (!hideGroupHeaders && opt.groupKey !== lastGroupKey) {
        out.push({
          kind: 'header',
          key: `h-${opt.groupKey}`,
          groupKey: opt.groupKey,
          label: opt.groupLabel,
          isFirst: headerCount === 0,
          count: counts[opt.groupKey] ?? 0,
        });
        headerCount += 1;
      }
      lastGroupKey = opt.groupKey;
      if (!collapsed) {
        out.push({ kind: 'option', key: opt.modelId, model: opt, index: i });
      }
    });
    return out;
  }, [options, hideGroupHeaders, groupCounts, collapsedGroups]);

  const headerHeight = dense ? 32 : 48;
  const optionHeight = dense ? DENSE_OPTION_HEIGHT : FULL_OPTION_HEIGHT;

  const parentRef = useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i]?.kind === 'header' ? headerHeight : optionHeight),
    overscan: 10,
  });

  useEffect(() => {
    const rowIdx = rows.findIndex((r) => r.kind === 'option' && r.index === activeIndex);
    if (rowIdx >= 0) virtualizer.scrollToIndex(rowIdx, { align: 'auto' });
  }, [activeIndex, rows, virtualizer]);

  return (
    <div
      aria-label={ariaLabel}
      className="relative overflow-y-auto py-1"
      data-slot="model-picker-listbox"
      id={id}
      ref={parentRef}
      role="listbox"
      style={{ maxHeight }}
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const row = rows[vi.index];
          // `rows` length is the source of truth for virtualizer.count,
          // so `vi.index` is always in range — but `noUncheckedIndexedAccess`
          // can't prove that. Guard once at the top of the render
          // function rather than every property access below.
          if (!row) return null;
          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${vi.start}px)`,
          };
          if (row.kind === 'header') {
            const isCollapsible = isCollapsibleGroup(row.groupKey);
            const isCollapsed = isCollapsible && (collapsedGroups?.has(row.groupKey) ?? false);
            return (
              <div key={row.key} style={baseStyle}>
                <GroupHeader
                  label={row.label}
                  hint={groupHint(row.groupKey, labels)}
                  count={row.count}
                  countLabel={countLabel(row.count, labels)}
                  dense={dense}
                  isFirst={row.isFirst}
                  leadingIcon={groupLeadingIcon(row.groupKey)}
                  collapsible={isCollapsible}
                  collapsed={isCollapsed}
                  onToggle={isCollapsible ? () => onGroupToggle?.(row.groupKey) : undefined}
                />
              </div>
            );
          }
          return (
            <div key={row.key} style={baseStyle}>
              <ModelOptionRow
                id={optionDomId(id, row.model.modelId)}
                model={row.model}
                index={row.index}
                active={row.index === activeIndex}
                selected={row.model.modelId === selectedId}
                onSelect={onSelect}
                onActivate={setActiveIndex}
                tagContext={tagContext}
                tagVariants={tagVariants}
                hideTagKinds={hideTagKinds?.filter((k) => k === row.model.groupKey)}
                renderMeta={renderRowMeta}
                renderActions={renderRowActions}
                dense={dense}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
