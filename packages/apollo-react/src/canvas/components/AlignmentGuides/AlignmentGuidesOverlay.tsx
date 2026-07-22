import { useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import type { AlignmentGuideLine } from './AlignmentGuides.types';

export interface AlignmentGuidesOverlayProps {
  guides: AlignmentGuideLine[];
}

/**
 * Renders alignment guide lines as a screen-space overlay. Must be rendered
 * as a child of ReactFlow (inside a ReactFlowProvider) so useViewport can
 * convert the guides' flow-space coordinates to screen pixels.
 */
export function AlignmentGuidesOverlay({ guides }: AlignmentGuidesOverlayProps) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  if (guides.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 overflow-hidden">
      {guides.map((guide) => {
        const isVertical = guide.orientation === 'vertical';
        const style = isVertical
          ? {
              left: guide.position * zoom + viewportX,
              top: guide.start * zoom + viewportY,
              height: (guide.end - guide.start) * zoom,
            }
          : {
              top: guide.position * zoom + viewportY,
              left: guide.start * zoom + viewportX,
              width: (guide.end - guide.start) * zoom,
            };

        return (
          <div
            key={guide.id}
            className={
              isVertical
                ? 'absolute border-l border-dashed'
                : 'absolute border-t border-dashed'
            }
            style={{ ...style, borderColor: 'var(--canvas-selection-indicator)' }}
          />
        );
      })}
    </div>
  );
}
