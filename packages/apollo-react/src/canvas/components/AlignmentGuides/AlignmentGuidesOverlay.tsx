import { useViewport } from '@uipath/apollo-react/canvas/xyflow/react';
import type { AlignmentGuideLine, NodeBounds } from './AlignmentGuides.types';

export interface AlignmentGuidesOverlayProps {
  guides: AlignmentGuideLine[];
  /** Optional bounds for the active multi-selection, using the same snapped geometry as the guides. */
  draggedBounds?: NodeBounds | null;
}

/**
 * Renders alignment guide lines as a screen-space overlay. Must be rendered
 * as a child of ReactFlow (inside a ReactFlowProvider) so useViewport can
 * convert the guides' flow-space coordinates to screen pixels.
 */
export function AlignmentGuidesOverlay({ guides, draggedBounds }: AlignmentGuidesOverlayProps) {
  const { x: viewportX, y: viewportY, zoom } = useViewport();

  if (guides.length === 0 && !draggedBounds) return null;

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
      {draggedBounds && (
        <div
          className="absolute rounded-md border border-dashed"
          style={{
            left: draggedBounds.x1 * zoom + viewportX - 8,
            top: draggedBounds.y1 * zoom + viewportY - 8,
            width: (draggedBounds.x2 - draggedBounds.x1) * zoom + 16,
            height: (draggedBounds.y2 - draggedBounds.y1) * zoom + 16,
            borderColor: 'var(--canvas-selection-indicator)',
          }}
        />
      )}
    </div>
  );
}
