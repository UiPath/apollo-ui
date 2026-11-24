/**
 * Node sizing helpers.
 *
 * Default pixel dimensions for a node based on its shape, used when a node has
 * no measured size yet (creation, layout).
 */

import type { Node } from '@uipath/apollo-react/canvas/xyflow/react';
import { GRID_SPACING } from '../constants';
import {
  type HandleGroupManifest,
  isWideNodeShape,
  type NodeManifest,
  type NodeShape,
} from '../schema/node-definition';
import { DEFAULT_CONTAINER_HEIGHT, DEFAULT_CONTAINER_WIDTH } from './container';
import {
  type ResolutionContext,
  type ResolvedHandleGroup,
  resolveDisplay,
  resolveHandles,
} from './manifest-resolver';

/**
 * Default square dimension for a node with no explicit size.
 */
export const COLLAPSED_NODE_SIZE = 96;

/**
 * Default width for a rectangle (pill) node.
 */
export const EXPANDED_RECTANGLE_WIDTH = 288;

/**
 * Default size for a node of the given shape. A wide shape takes its `display.height` when it
 * sets one; other shapes and containers ignore it.
 */
export const getExpandedSize = (
  shape?: NodeShape,
  height?: number
): { width: number; height: number } => {
  if (shape === 'container') {
    return {
      width: DEFAULT_CONTAINER_WIDTH,
      height: DEFAULT_CONTAINER_HEIGHT,
    };
  }

  const isWide = isWideNodeShape(shape);
  return {
    width: isWide ? EXPANDED_RECTANGLE_WIDTH : COLLAPSED_NODE_SIZE,
    height: (isWide ? height : undefined) ?? COLLAPSED_NODE_SIZE,
  };
};

/**
 * The height a node's side handles need: two grid spaces per visible handle on its busier side
 * (left or right), plus one grid space of padding at the top and at the bottom.
 */
export const getSideHandleFloor = (
  handleGroups: readonly (HandleGroupManifest | ResolvedHandleGroup)[]
): number => {
  const count = (position: 'left' | 'right') =>
    handleGroups
      .filter((group) => group.position === position && group.visible !== false)
      .reduce((n, group) => n + group.handles.filter((h) => h.visible !== false).length, 0);
  return (Math.max(count('left'), count('right')) * 2 + 2) * GRID_SPACING;
};

/**
 * Default size for a node not yet measured, as BaseNode will render it: its resolved shape and
 * `display.height`, made taller when its side handles need more. A footer's height and handles
 * overridden through `BaseNodeOverrideConfig` aren't known here.
 */
export const getNodeFallbackSize = (
  node: Node,
  manifest: NodeManifest | undefined
): { width: number; height: number } => {
  const context = { ...node.data, nodeId: node.id } as ResolutionContext;
  const { shape, height } = resolveDisplay(manifest?.display, context);
  const size = getExpandedSize(shape, height);
  if (shape === 'container') return size;

  const instanceHandles = node.data?.handleConfigurations;
  const handles = Array.isArray(instanceHandles)
    ? (instanceHandles as HandleGroupManifest[])
    : manifest
      ? resolveHandles(manifest.handleConfiguration, context)
      : [];
  return { ...size, height: Math.max(size.height, getSideHandleFloor(handles)) };
};
