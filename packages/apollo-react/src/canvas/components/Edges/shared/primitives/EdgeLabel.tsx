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

// Falls back to core color tokens when canvas-specific tokens are unavailable,
// such as in a host that doesn't import canvas/styles/variables.css.
const EDGE_LABEL_VISUAL_CLASS =
  'react-flow__edge-label nodrag nopan whitespace-nowrap ' +
  'px-2 py-1 rounded text-xs font-medium border shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] ' +
  'text-[var(--canvas-foreground,var(--color-foreground))] ' +
  'bg-[var(--canvas-background,var(--color-background))]';

const EDGE_LABEL_BASE_CLASS =
  `${EDGE_LABEL_VISUAL_CLASS} absolute top-0 left-0 max-w-48 overflow-hidden text-ellipsis ` +
  'pointer-events-auto cursor-default';

export const EDGE_LABEL_DEFAULT_BORDER_COLOR = 'var(--canvas-border,var(--color-border))';

export type EdgeLabelContentProps = Pick<EdgeLabelProps, 'text'> & {
  selected?: boolean;
};

/**
 * Shared visual treatment for callers that own their own positioning, such as
 * a branch header anchored to a row rather than to a point on the edge path.
 */
export function EdgeLabelContent({ text, selected }: EdgeLabelContentProps) {
  return (
    <div
      className={
        selected
          ? `${EDGE_LABEL_VISUAL_CLASS} border-[var(--canvas-primary,var(--color-primary))]`
          : `${EDGE_LABEL_VISUAL_CLASS} border-[var(--canvas-border,var(--color-border))]`
      }
    >
      {text}
    </div>
  );
}

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
  borderColor = EDGE_LABEL_DEFAULT_BORDER_COLOR,
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
