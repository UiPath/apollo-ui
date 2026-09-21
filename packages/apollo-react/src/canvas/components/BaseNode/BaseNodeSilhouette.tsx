import { memo } from 'react';
import type { SilhouetteNodeShape } from '../../schema';

/**
 * Outlines that a border-radius cannot express, drawn as an SVG behind the node's content.
 *
 * `clipped` and `document` are DMN's business-knowledge-model and knowledge-source shapes. A
 * `clip-path` would cut the container's own border away with it, so the container goes
 * borderless for these and the silhouette carries fill and stroke instead. The viewBox is
 * stretched to the node's box, and `non-scaling-stroke` keeps the outline an even width when it
 * does.
 */
const PATHS: Record<SilhouetteNodeShape, string> = {
  // Two clipped corners on the leading edge.
  clipped: 'M12 0 H100 V40 H0 V12 Z',
  // A wave along the bottom edge, as DMN draws a knowledge source.
  document: 'M0 0 H100 V33 C75 45 25 21 0 33 Z',
};

interface BaseNodeSilhouetteProps {
  shape: SilhouetteNodeShape;
}

export const BaseNodeSilhouette = memo(({ shape }: BaseNodeSilhouetteProps) => {
  return (
    <svg
      aria-hidden
      data-testid="base-node-silhouette"
      className="pointer-events-none absolute inset-0 h-full w-full text-border"
      viewBox="0 0 100 40"
      preserveAspectRatio="none"
    >
      <path
        d={PATHS[shape]}
        className="fill-surface-overlay stroke-current"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});

BaseNodeSilhouette.displayName = 'BaseNodeSilhouette';
