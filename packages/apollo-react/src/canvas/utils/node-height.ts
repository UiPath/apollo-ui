/**
 * Node height computation.
 *
 * The canonical height rule for BaseNode-style nodes: the maximum of the
 * intrinsic height (default, or the fixed footer-variant height) and the
 * handle floor derived from the densest left/right handle rail.
 *
 * BaseNode uses this internally and writes the result to `node.height`.
 * Consumers creating nodes can call `computeBaseNodeHeight` up front to seed
 * `height` on the node object; a correctly seeded node skips the height
 * write-back entirely on mount (no store write, at any canvas size).
 */
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type { FooterVariant } from '../components/BaseNode/BaseNode.types';
import {
  GRID_SPACING,
  NODE_HEIGHT_DEFAULT,
  NODE_HEIGHT_FOOTER_BUTTON,
  NODE_HEIGHT_FOOTER_DOUBLE,
  NODE_HEIGHT_FOOTER_SINGLE,
} from '../constants';
import type { HandleGroupManifest } from '../schema/node-definition';

/** Intrinsic height: the fixed footer height when a footer is present, else the default. */
export const getIntrinsicNodeHeight = (
  hasFooter: boolean,
  footerVariant: FooterVariant | undefined
): number => {
  if (hasFooter) {
    switch (footerVariant) {
      case 'button':
        return NODE_HEIGHT_FOOTER_BUTTON;
      case 'single':
        return NODE_HEIGHT_FOOTER_SINGLE;
      case 'double':
        return NODE_HEIGHT_FOOTER_DOUBLE;
    }
  }
  return NODE_HEIGHT_DEFAULT;
};

const countVisibleSideHandles = (
  handleGroups: readonly HandleGroupManifest[],
  side: Position
): number => {
  let count = 0;
  for (const group of handleGroups) {
    if (group.position !== side || group.visible === false) continue;
    for (const handle of group.handles) {
      if (handle.visible !== false) count++;
    }
  }
  return count;
};

export interface ComputeBaseNodeHeightOptions {
  hasFooter?: boolean;
  footerVariant?: FooterVariant;
}

/**
 * Computed node height: max of the handle-count floor and the intrinsic
 * default/footer height. Pure function of handle configuration and footer;
 * it never reads a measured height, so it is stable across renders.
 */
export function computeBaseNodeHeight(
  handleGroups: readonly HandleGroupManifest[],
  { hasFooter = false, footerVariant }: ComputeBaseNodeHeightOptions = {}
): number {
  const leftHandles = countVisibleSideHandles(handleGroups, Position.Left);
  const rightHandles = countVisibleSideHandles(handleGroups, Position.Right);
  const leftRightHandles = Math.max(leftHandles, rightHandles);

  // Each handle gets a 2-grid-space lane (32px), plus 2-grid-space padding at top + bottom of node.
  const handleFloor = (leftRightHandles * 2 + 2) * GRID_SPACING;

  return Math.max(getIntrinsicNodeHeight(hasFooter, footerVariant), handleFloor);
}
