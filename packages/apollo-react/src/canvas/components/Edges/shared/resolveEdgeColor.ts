import type { SuggestionType } from '../../../types';
import { EDGE_COLORS } from './constants';

export type EdgeColorState = {
  selected?: boolean;
  isHovered?: boolean;
  isInvalid?: boolean;
  /** @deprecated Use `suggestionType: 'add'` instead. */
  isDiffAdded?: boolean;
  /** @deprecated Use `suggestionType: 'delete'` instead. */
  isDiffRemoved?: boolean;
  /** Suggestion affordance. Takes precedence over `isDiffAdded`/`isDiffRemoved` when set. */
  suggestionType?: SuggestionType;
  /** True when the edge represents a transient connection preview. */
  previewEdge?: boolean;
  /** Optional execution status color override (already resolved to a CSS var). */
  statusColor?: string;
};

/** Priority: suggestion/diff > invalid > preview/selected > hover > status > default. */
export function resolveEdgeColor(state: EdgeColorState): string {
  const {
    selected,
    isHovered,
    isInvalid,
    isDiffAdded,
    isDiffRemoved,
    suggestionType,
    previewEdge,
    statusColor,
  } = state;

  if (suggestionType === 'add') return EDGE_COLORS.diffAdded;
  if (suggestionType === 'update') return EDGE_COLORS.diffUpdated;
  if (suggestionType === 'delete') return EDGE_COLORS.diffRemoved;
  if (isDiffAdded) return EDGE_COLORS.diffAdded;
  if (isDiffRemoved) return EDGE_COLORS.diffRemoved;
  if (isInvalid) return EDGE_COLORS.invalid;
  if (previewEdge || selected) return EDGE_COLORS.selected;
  if (isHovered) return EDGE_COLORS.hover;
  if (statusColor) return statusColor;
  return EDGE_COLORS.default;
}
