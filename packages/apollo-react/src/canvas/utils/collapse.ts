/**
 * Collapse/Expand Transformation Helpers
 *
 * Utilities for transforming node dimensions and shapes between collapsed and expanded states.
 * These helpers ensure consistent behavior across the codebase.
 */

import type { NodeShape } from '../schema/node-definition';

/**
 * Default dimension for collapsed nodes when no measured dimensions are available.
 */
export const COLLAPSED_NODE_SIZE = 96;

/**
 * Transform a shape to its collapsed form.
 * Rectangle nodes collapse to square, other shapes remain unchanged.
 */
export const getCollapsedShape = (originalShape: NodeShape | undefined): NodeShape => {
  const shape = originalShape ?? 'rectangle';
  return shape === 'rectangle' ? 'square' : shape;
};

/**
 * Transform a collapsed shape back to its expanded form.
 * Square nodes expand to rectangle (since rectangle → square when collapsing).
 * Other shapes remain unchanged.
 */
export const getExpandedShape = (collapsedShape: NodeShape | undefined): NodeShape => {
  const shape = collapsedShape ?? 'rectangle';
  return shape === 'square' ? 'rectangle' : shape;
};

/**
 * Calculate the collapsed size (square) from original dimensions.
 * Uses height as the basis for the square dimension.
 */
export const getCollapsedSize = (
  width: number | undefined,
  height: number | undefined,
  measured?: { width?: number; height?: number }
): number => {
  return height ?? measured?.height ?? width ?? measured?.width ?? COLLAPSED_NODE_SIZE;
};
