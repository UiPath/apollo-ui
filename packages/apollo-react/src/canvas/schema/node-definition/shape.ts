// Leaf module: node-manifest and toolbar both need this, and they import each other.

import { z } from 'zod';

export const nodeShapeSchema = z.enum([
  'circle',
  'square',
  'rectangle',
  'container',
  // DMN outlines. Each lays out like `rectangle` and differs only in outline, so a canvas
  // adopting one keeps the toolbar, handles, label placement and badges it already had. A pill's
  // badges sit a little further in, clear of its round ends (`getNodeBadgeInset`).
  'pill',
  'clipped',
  'document',
]);

export type NodeShape = z.infer<typeof nodeShapeSchema>;

/** Node height in px: 64 to 160 in 32px steps. */
export const nodeHeightSchema = z.number().min(64).max(160).multipleOf(32);

/** Icon tile size: `'default'` or `'compact'`. */
export const nodeIconSizeSchema = z.enum(['default', 'compact']);

export type NodeIconSize = z.infer<typeof nodeIconSizeSchema>;

/** Lines a wide node's name may take before it's cut off: a whole number, 1 or more. */
export const nodeLabelLinesSchema = z.number().int().positive();

export type NodeLabelLines = z.infer<typeof nodeLabelLinesSchema>;

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

/** Wide shapes whose short ends are fully round (`rounded-full`), as round as a circle. */
export const ROUND_ENDED_NODE_SHAPES = ['pill'] as const;

export type RoundEndedNodeShape = (typeof ROUND_ENDED_NODE_SHAPES)[number];

export const isRoundEndedShape = (shape?: NodeShape): shape is RoundEndedNodeShape =>
  !!shape && (ROUND_ENDED_NODE_SHAPES as readonly string[]).includes(shape);
