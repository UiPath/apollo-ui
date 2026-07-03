import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Box from '@mui/material/Box';
import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useEffect, useMemo, useRef } from 'react';
import type { PickerTranslator } from '../i18n';

import { GROUP_LABELS } from '../i18n';
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
   * `customTagsFor`, `homeRegion`, and the Lingui `i18n` instance.
   */
  tagContext?: DeriveModelTagsContext;
  /**
   * Apollo MUI chip variant lookup for tag kinds the design system
   * doesn't know about. Forwarded to every row's `<ModelTagChip>`.
   */
  tagVariants?: Record<string, string>;
  /**
   * Maps a model to its friendly label. When set, the row's primary
   * line shows the returned string and the technical id renders as a
   * monospace secondary line. Returning `null`/`undefined` keeps the
   * raw `modelName`.
   */
  friendlyNameFor?: (model: DiscoveryModel) => string | null | undefined;
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
   * Tag kinds to hide from chips on each row. Tags are still derived by
   * `deriveModelTags`; this only affects rendering.
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

// Design-spec scroll height for the dropdown's list region.
const DEFAULT_LIST_MAX_HEIGHT = 362;

/**
 * Per-group decorations rendered into the header (leading icon).
 * Today only BYO carries a glyph (shield); other groups stay text-only.
 */
function groupLeadingIcon(groupKey: string): React.ReactNode {
  if (groupKey === BYO_GROUP_KEY) {
    return <ShieldOutlinedIcon sx={{ fontSize: 14 }} />;
  }
  return null;
}

const GROUP_HINT_DESCRIPTORS = {
  recommended: GROUP_LABELS.recommendedHint,
  preview: GROUP_LABELS.previewHint,
  byo: GROUP_LABELS.byoHint,
  more: GROUP_LABELS.moreHint,
  deprecating: GROUP_LABELS.deprecatingHint,
} as const;

/** Localized tooltip hint for a built-in group; unknown keys get none. */
function groupHint(groupKey: string, i18n?: PickerTranslator): string | undefined {
  const desc = GROUP_HINT_DESCRIPTORS[groupKey as keyof typeof GROUP_HINT_DESCRIPTORS];
  if (!desc) return undefined;
  return i18n ? i18n._(desc) : desc.message;
}

/** Localized "{n} model(s)" label; undefined when there's no i18n so
 *  GroupHeader falls back to its English ternary via `count`. */
function countLabel(n: number | undefined, i18n?: PickerTranslator): string | undefined {
  if (n == null || !i18n) return undefined;
  return n === 1
    ? i18n._({
        id: 'modelPicker.count.one',
        message: '{n} model',
        values: { n },
      })
    : i18n._({
        id: 'modelPicker.count.many',
        message: '{n} models',
        values: { n },
      });
}

/**
 * Build a stable DOM id for a given option, derived from the listbox
 * id + the model's id. Used by the search input's
 * `aria-activedescendant` so screen readers can announce the active
 * option without moving DOM focus.
 */
export function optionDomId(listboxId: string, modelId: string): string {
  // modelIds in production are dotted (e.g. anthropic.claude-...). DOM
  // ids are valid with dots — but consumers sometimes target them via
  // querySelector, where the dot is parsed as a class separator. Strip
  // the risk by replacing non-word characters with `-`.
  const safe = modelId.replace(/[^A-Za-z0-9_-]/g, '-');
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
  friendlyNameFor,
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
    <Box
      role="listbox"
      id={id}
      aria-label={ariaLabel}
      sx={{ maxHeight, overflowY: 'auto', py: 0.5 }}
    >
      {options.map((opt, i) => {
        const showHeader = !hideGroupHeaders && opt.groupKey !== lastGroupKey;
        const isFirstHeader = showHeader && headerCount === 0;
        if (showHeader) headerCount += 1;
        lastGroupKey = opt.groupKey;
        // BYO is the only currently collapsible group. The parent owns
        // the open/closed state via `collapsedGroups`; we just consult
        // it here to skip rendering rows + flip the header chevron.
        const isCollapsible = opt.groupKey === BYO_GROUP_KEY;
        const isCollapsed = isCollapsible && (collapsedGroups?.has(opt.groupKey) ?? false);
        return (
          <React.Fragment key={opt.modelId}>
            {showHeader && (
              <GroupHeader
                label={opt.groupLabel}
                hint={groupHint(opt.groupKey, tagContext?.i18n)}
                count={derivedCounts[opt.groupKey]}
                countLabel={countLabel(derivedCounts[opt.groupKey], tagContext?.i18n)}
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
                friendlyNameFor={friendlyNameFor}
                hideTagKinds={hideTagKinds}
                renderMeta={renderRowMeta}
                renderActions={renderRowActions}
                dense={dense}
              />
            )}
          </React.Fragment>
        );
      })}
    </Box>
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
  friendlyNameFor,
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
      const collapsed = collapsedGroups?.has(opt.groupKey) ?? false;
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
    <Box
      ref={parentRef}
      role="listbox"
      id={id}
      aria-label={ariaLabel}
      sx={{
        maxHeight,
        overflowY: 'auto',
        py: 0.5,
        position: 'relative',
      }}
    >
      <Box
        sx={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
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
            const isCollapsible = row.groupKey === BYO_GROUP_KEY;
            const isCollapsed = isCollapsible && (collapsedGroups?.has(row.groupKey) ?? false);
            return (
              <div key={row.key} style={baseStyle}>
                <GroupHeader
                  label={row.label}
                  hint={groupHint(row.groupKey, tagContext?.i18n)}
                  count={row.count}
                  countLabel={countLabel(row.count, tagContext?.i18n)}
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
                friendlyNameFor={friendlyNameFor}
                hideTagKinds={hideTagKinds}
                renderMeta={renderRowMeta}
                renderActions={renderRowActions}
                dense={dense}
              />
            </div>
          );
        })}
      </Box>
    </Box>
  );
};
