import { EdgeLabelRenderer } from '@uipath/apollo-react/canvas/xyflow/react';
import { type CSSProperties, type MouseEventHandler, memo, useMemo } from 'react';
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
// Truncation lives on the pill, so callers that own their positioning clip the same way.
const EDGE_LABEL_VISUAL_CLASS =
  'react-flow__edge-label nodrag nopan whitespace-nowrap max-w-48 overflow-hidden text-ellipsis ' +
  'px-2 py-1 rounded text-xs font-medium border shadow-[0_1px_3px_0_rgba(0,0,0,0.1)] ' +
  'text-[var(--canvas-foreground,var(--color-foreground))] ' +
  'bg-[var(--canvas-background,var(--color-background))]';

export const EDGE_LABEL_DEFAULT_BORDER_COLOR = 'var(--canvas-border,var(--color-border))';

const EDGE_LABEL_PILL_CLASS = `${EDGE_LABEL_VISUAL_CLASS} border-[var(--canvas-border,var(--color-border))]`;
const EDGE_LABEL_PILL_SELECTED_CLASS = `${EDGE_LABEL_VISUAL_CLASS} border-[var(--canvas-primary,var(--color-primary))]`;
const EDGE_LABEL_TOOLTIP_CLASS = ' pointer-events-auto cursor-default';

export type EdgeLabelContentProps = Pick<
  EdgeLabelProps,
  'text' | 'onClick' | 'onMouseEnter' | 'onMouseLeave'
> & {
  selected?: boolean;
  /**
   * Full-text tooltip when truncated. Opts the pill into pointer events, so leave
   * it off when the pill must stay click-through.
   */
  tooltip?: boolean;
  /** Positioning classes from a caller that owns the pill's placement. */
  className?: string;
  style?: CSSProperties;
};

/** The label pill. `EdgeLabel` positions it on the path; a branch header positions it on a row. */
export function EdgeLabelContent({
  text,
  selected,
  tooltip,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EdgeLabelContentProps) {
  const pillClass =
    (selected ? EDGE_LABEL_PILL_SELECTED_CLASS : EDGE_LABEL_PILL_CLASS) +
    (tooltip ? EDGE_LABEL_TOOLTIP_CLASS : '') +
    (className ? ` ${className}` : '');
  const pill = (
    <div
      className={pillClass}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {text}
    </div>
  );
  if (!tooltip) return pill;
  return (
    <CanvasTooltip content={text} smartTooltip delay disableHoverableContent>
      {pill}
    </CanvasTooltip>
  );
}

/**
 * Portals into xyflow's `edgelabel-renderer` div, which is a DOM sibling that
 * always paints after every edge's own `<svg>`. Rendering the label as a plain
 * `foreignObject` inside the edge's own `<g>` (the old approach) left it
 * competing in the same per-edge z-index/DOM-order stack as every other edge's
 * stroke, so a crossing unselected edge could paint over the label.
 *
 * Memoized: the label sits at the path's arc midpoint, which is unaffected by
 * the re-renders that only restyle or reshape the stroke, and it carries a
 * tooltip subtree that is not worth reconciling for those.
 */
export const EdgeLabel = memo(function EdgeLabel({
  x,
  y,
  text,
  borderColor = EDGE_LABEL_DEFAULT_BORDER_COLOR,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: EdgeLabelProps) {
  const style = useMemo(
    () => ({ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, borderColor }),
    [x, y, borderColor]
  );

  return (
    <EdgeLabelRenderer>
      <EdgeLabelContent
        text={text}
        tooltip
        className="absolute top-0 left-0"
        style={style}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </EdgeLabelRenderer>
  );
});
