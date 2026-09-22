// Leaf module: node-manifest and toolbar both need this, and they import each other.

import { z } from 'zod';

export const nodeShapeSchema = z.enum([
  'circle',
  'square',
  'rectangle',
  'container',
  // DMN outlines. Each lays out like `rectangle` and differs only in outline, so a canvas
  // adopting one keeps the toolbar, handles, label placement and badges it already had.
  'pill',
  'clipped',
  'document',
]);

export type NodeShape = z.infer<typeof nodeShapeSchema>;

/** Shapes that lay out as a wide card with the icon beside the label. */
export const WIDE_NODE_SHAPES = ['rectangle', 'pill', 'clipped', 'document'] as const;

export type WideNodeShape = (typeof WIDE_NODE_SHAPES)[number];

export const isWideNodeShape = (shape?: NodeShape): shape is WideNodeShape =>
  !!shape && (WIDE_NODE_SHAPES as readonly string[]).includes(shape);

/** Shapes drawn by an SVG outline rather than the container's own border and radius. */
export const OUTLINE_DRAWN_NODE_SHAPES = ['clipped', 'document'] as const;

export type OutlineDrawnNodeShape = (typeof OUTLINE_DRAWN_NODE_SHAPES)[number];

export const isOutlineDrawnShape = (shape?: NodeShape): shape is OutlineDrawnNodeShape =>
  !!shape && (OUTLINE_DRAWN_NODE_SHAPES as readonly string[]).includes(shape);
