import { EdgeLabelRenderer } from '@uipath/apollo-react/canvas/xyflow/react';
import { cn } from '@uipath/apollo-wind';
import { useMemo } from 'react';

export type EdgeLabelProps = {
  x: number;
  y: number;
  text: string;
  selected?: boolean;
};

// Falls back to --color-background when a host doesn't import canvas/styles/variables.css
// (e.g. a shadow-DOM host), so the label never renders with a transparent background.
const EDGE_LABEL_BASE_CLASS =
  'react-flow__edge-label nodrag nopan absolute top-0 left-0 whitespace-nowrap pointer-events-none ' +
  'px-2 py-1 rounded text-xs font-medium border shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] ' +
  'text-(--canvas-foreground) bg-[var(--canvas-background,var(--color-background))]';

/**
 * Portals into xyflow's `edgelabel-renderer` div, which is a DOM sibling that
 * always paints after every edge's own `<svg>`. Rendering the label as a plain
 * `foreignObject` inside the edge's own `<g>` (the old approach) left it
 * competing in the same per-edge z-index/DOM-order stack as every other edge's
 * stroke, so a crossing unselected edge could paint over the label.
 */
export function EdgeLabel({ x, y, text, selected }: EdgeLabelProps) {
  const transform = useMemo(() => `translate(-50%, -50%) translate(${x}px, ${y}px)`, [x, y]);

  return (
    <EdgeLabelRenderer>
      <div
        className={cn(
          EDGE_LABEL_BASE_CLASS,
          selected ? 'border-(--canvas-primary)' : 'border-(--canvas-border)'
        )}
        style={{ transform }}
      >
        {text}
      </div>
    </EdgeLabelRenderer>
  );
}
