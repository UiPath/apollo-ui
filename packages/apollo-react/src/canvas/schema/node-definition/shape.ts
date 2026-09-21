// Leaf module: node-manifest and toolbar both need this, and they import each other.

import { z } from 'zod';

export const nodeShapeSchema = z.enum([
  'circle',
  'square',
  'rectangle',
  'container',
  // DMN silhouettes. Each lays out like `rectangle` and differs only in outline, so a canvas
  // adopting one keeps the toolbar, handles, label placement and badges it already had.
  'stadium',
  'clipped',
  'document',
]);

export type NodeShape = z.infer<typeof nodeShapeSchema>;

/** Shapes that lay out as a wide card with the icon beside the label. */
export const WIDE_NODE_SHAPES = ['rectangle', 'stadium', 'clipped', 'document'] as const;

export type WideNodeShape = (typeof WIDE_NODE_SHAPES)[number];

export const isWideNodeShape = (shape?: NodeShape): shape is WideNodeShape =>
  !!shape && (WIDE_NODE_SHAPES as readonly string[]).includes(shape);

/** Shapes drawn by an SVG silhouette rather than the container's own border and radius. */
export const SILHOUETTE_NODE_SHAPES = ['clipped', 'document'] as const;

export type SilhouetteNodeShape = (typeof SILHOUETTE_NODE_SHAPES)[number];

export const isSilhouetteNodeShape = (shape?: NodeShape): shape is SilhouetteNodeShape =>
  !!shape && (SILHOUETTE_NODE_SHAPES as readonly string[]).includes(shape);
