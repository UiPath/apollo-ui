/**
 * Collapse/Expand Transformation Helpers
 *
 * Utilities for transforming node dimensions and shapes between collapsed and expanded states.
 * These helpers ensure consistent behavior across the codebase.
 */

import type { NodeShape } from '../schema/node-definition';
import { DEFAULT_CONTAINER_HEIGHT, DEFAULT_CONTAINER_WIDTH } from './container';

/**
 * Default dimension for collapsed nodes when no measured dimensions are available.
 */
export const COLLAPSED_NODE_SIZE = 96;

/**
 * Default width for expanded rectangle nodes.
 */
export const EXPANDED_RECTANGLE_WIDTH = 288;

/**
 * Transform a collapsed shape back to its expanded form.
 * Square nodes expand to rectangle (since rectangle → square when collapsing).
 * Other shapes remain unchanged.
 */
export const getExpandedShape = (collapsedShape?: NodeShape): NodeShape | undefined => {
  return collapsedShape === 'square' ? 'rectangle' : (collapsedShape ?? undefined);
};

/**
 * Calculate the collapsed size (square) from original dimensions.
 * Uses height as the basis for the square dimension.
 */
export const getCollapsedSize = (): { width: number; height: number } => {
  return {
    width: COLLAPSED_NODE_SIZE,
    height: COLLAPSED_NODE_SIZE,
  };
};

/**
 * Calculate the expanded size from original dimensions stored in ui.size.
 * This is the inverse of getCollapsedSize - it restores the original dimensions
 * when expanding a collapsed node.
 */
export const getExpandedSize = (shape?: NodeShape): { width: number; height: number } => {
  if (shape === 'container') {
    return {
      width: DEFAULT_CONTAINER_WIDTH,
      height: DEFAULT_CONTAINER_HEIGHT,
    };
  }

  return {
    width: shape === 'rectangle' ? EXPANDED_RECTANGLE_WIDTH : COLLAPSED_NODE_SIZE,
    height: COLLAPSED_NODE_SIZE,
  };
};
