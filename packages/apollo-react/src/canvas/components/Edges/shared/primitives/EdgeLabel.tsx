import { EdgeLabelRenderer } from '@uipath/apollo-react/canvas/xyflow/react';
import type { MouseEventHandler } from 'react';
import { useMemo } from 'react';
import { CanvasTooltip } from '../../../CanvasTooltip';

export type EdgeLabelProps = {
  x: number;
  y: number;
  text: string;
  borderColor?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

// Falls back to --color-background when a host doesn't import canvas/styles/variables.css
// (e.g. a shadow-DOM host), so the label never renders with a transparent background.
const EDGE_LABEL_BASE_CLASS =
  'react-flow__edge-label nodrag nopan absolute top-0 left-0 max-w-48 overflow-hidden text-ellipsis ' +
  'whitespace-nowrap pointer-events-auto cursor-default ' +
  'px-2 py-1 rounded text-xs font-medium border shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] ' +
  'text-(--canvas-foreground) bg-[var(--canvas-background,var(--color-background))]';

/**
 * Portals into xyflow's `edgelabel-renderer` div, which is a DOM sibling that
 * always paints after every edge's own `<svg>`. Rendering the label as a plain
 * `foreignObject` inside the edge's own `<g>` (the old approach) left it
 * competing in the same per-edge z-index/DOM-order stack as every other edge's
 * stroke, so a crossing unselected edge could paint over the label.
 */
export function EdgeLabel({
  x,
  y,
  text,
  borderColor = 'var(--canvas-border)',
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EdgeLabelProps) {
  const transform = useMemo(() => `translate(-50%, -50%) translate(${x}px, ${y}px)`, [x, y]);

  return (
    <EdgeLabelRenderer>
      <CanvasTooltip content={text} smartTooltip delay disableHoverableContent>
        <div
          className={EDGE_LABEL_BASE_CLASS}
          style={{ transform, borderColor }}
          onClick={onClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {text}
        </div>
      </CanvasTooltip>
    </EdgeLabelRenderer>
  );
}
