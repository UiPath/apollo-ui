import { EDGE_COLORS } from './constants';

export type EdgeColorState = {
  selected?: boolean;
  isHovered?: boolean;
  isInvalid?: boolean;
  isDiffAdded?: boolean;
  isDiffRemoved?: boolean;
  /** True when the edge represents a transient connection preview. */
  previewEdge?: boolean;
  /** Optional execution status color override (already resolved to a CSS var). */
  statusColor?: string;
};

/** Priority: diff > invalid > preview/selected > hover > status > default. */
export function resolveEdgeColor(state: EdgeColorState): string {
  const { selected, isHovered, isInvalid, isDiffAdded, isDiffRemoved, previewEdge, statusColor } =
    state;

  if (isDiffAdded) return EDGE_COLORS.diffAdded;
  if (isDiffRemoved) return EDGE_COLORS.diffRemoved;
  if (isInvalid) return EDGE_COLORS.invalid;
  if (previewEdge || selected) return EDGE_COLORS.selected;
  if (isHovered) return EDGE_COLORS.hover;
  if (statusColor) return statusColor;
  return EDGE_COLORS.default;
}
