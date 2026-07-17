/**
 * Node sizing helpers.
 *
 * Default pixel dimensions for a node based on its shape, used when a node has
 * no measured size yet (creation, layout).
 */

import type { NodeShape } from '../schema/node-definition';
import { DEFAULT_CONTAINER_HEIGHT, DEFAULT_CONTAINER_WIDTH } from './container';

/**
 * Default square dimension for a node with no explicit size.
 */
export const COLLAPSED_NODE_SIZE = 96;

/**
 * Default width for a rectangle (pill) node.
 */
export const EXPANDED_RECTANGLE_WIDTH = 288;

/**
 * Default size for a node of the given shape.
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
