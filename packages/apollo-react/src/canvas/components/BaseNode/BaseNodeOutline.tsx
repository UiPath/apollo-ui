import { cn } from '@uipath/apollo-wind';
import { memo, useEffect, useRef, useState } from 'react';
import { DEFAULT_NODE_SIZE, DEFAULT_RECTANGLE_NODE_WIDTH } from '../../constants';
import type { OutlineDrawnNodeShape } from '../../schema';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';

/** Inset so the stroke sits inside the box rather than half-outside it. */
const EDGE = 0.5;
/**
 * How deep a corner cut or a bottom wave reaches, as a share of node height.
 *
 * Proportioned after the shapes DMN editors draw: a corner cut about a third of the height, and
 * a wave about a sixth of it troughing a fifth of the way across.
 */
const CUT_RATIO = 0.32;
const WAVE_RATIO = 0.16;

/**
 * Paths in the node's own pixel space.
 *
 * Deliberately measured rather than drawn in a fixed viewBox and stretched: a 45° corner cut in a
 * 100x40 box becomes a shallow diagonal once scaled to a 288x96 node, and a wave's control points
 * distort with it. Generating from the real box keeps both true at any size.
 */
export const pathFor = (shape: OutlineDrawnNodeShape, width: number, height: number): string => {
  const right = width - EDGE;
  const bottom = height - EDGE;

  if (shape === 'clipped') {
    // DMN cuts diagonally opposite corners — top-left and bottom-right — leaving the other two
    // square. Cutting both leading corners instead reads as a tag or an arrow.
    const cut = Math.min(height * CUT_RATIO, 18);
    return `M${cut} ${EDGE} H${right} V${bottom - cut} L${right - cut} ${bottom} H${EDGE} V${cut} Z`;
  }

  // Two segments: a long fall from the right into a trough about a fifth of the way across, then
  // a short rise to the left edge, which finishes lower than the right. Every control point stays
  // at or above `bottom` — reaching past it put the curve outside the SVG, where it was clipped
  // and its drop-shadow showed as a lobe beneath the node.
  const wave = Math.min(height * WAVE_RATIO, 14);
  const crest = bottom - wave;
  return [
    `M${EDGE} ${EDGE}`,
    `H${right}`,
    `V${crest}`,
    `C${width * 0.66} ${crest} ${width * 0.45} ${bottom} ${width * 0.2} ${bottom}`,
    `C${width * 0.1} ${bottom} ${width * 0.04} ${bottom - wave * 0.5} ${EDGE} ${bottom - wave * 0.8}`,
    'Z',
  ].join(' ');
};

/** The stroke counterpart of `getStatusBorder`, which paints nothing without a border. */
export const getStatusStroke = (
  status?: ElementStatusValues | ValidationErrorSeverity | SuggestionType
): string => {
  switch (status) {
    case 'InProgress':
      return 'stroke-info animate-glow [--glow-color:var(--info)]';
    case 'Completed':
    case 'add':
      return 'stroke-success';
    case 'ActionNeeded':
    case 'Paused':
    case 'Warning':
    case 'WARNING':
    case 'update':
      return 'stroke-warning animate-glow [--glow-color:var(--warning)]';
    case 'Cancelled':
    case 'Failed':
    case 'Terminated':
    case 'ERROR':
    case 'CRITICAL':
    case 'delete':
      return 'stroke-error animate-glow [--glow-color:var(--error)]';
    default:
      return '';
  }
};

/**
 * The container's `box-shadow` is cast by its rectangular box, not by this outline, so the shadow
 * is drawn here as a filter that follows the drawn path instead.
 */
const outlineShadow = (isDragging?: boolean, isHovered?: boolean) =>
  isDragging ? 'drop-shadow-lg' : isHovered ? 'drop-shadow-md' : 'drop-shadow-sm';

interface BaseNodeOutlineProps {
  shape: OutlineDrawnNodeShape;
  isSelected?: boolean;
  isHovered?: boolean;
  isDragging?: boolean;
  shadow?: boolean;
  status?: ElementStatusValues | ValidationErrorSeverity | SuggestionType;
}

/**
 * Outlines that a border-radius cannot express, drawn as an SVG behind the node's content.
 *
 * `clipped` and `document` are DMN's business-knowledge-model and knowledge-source shapes. A
 * `clip-path` would cut the container's own border away with it, so the container goes borderless
 * for these and this carries fill, stroke and shadow — which means hover, selection and status
 * have to be drawn here too.
 */
export const BaseNodeOutline = memo(
  ({ shape, isSelected, isHovered, isDragging, shadow, status }: BaseNodeOutlineProps) => {
    const ref = useRef<SVGSVGElement>(null);
    // Seeded with the wide-card default so the shape is drawn even before it is measured, and in
    // any environment without a ResizeObserver. Measurement refines it.
    const [box, setBox] = useState({
      width: DEFAULT_RECTANGLE_NODE_WIDTH,
      height: DEFAULT_NODE_SIZE,
    });

    useEffect(() => {
      const element = ref.current;
      if (!element) return;

      const measure = () => {
        const { clientWidth, clientHeight } = element;
        if (clientWidth > 0 && clientHeight > 0)
          setBox({ width: clientWidth, height: clientHeight });
      };
      measure();

      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const statusStroke = getStatusStroke(status);

    return (
      <svg
        ref={ref}
        aria-hidden
        data-testid="base-node-outline"
        className={cn(
          // `-z-10` matters: an absolutely positioned element paints above in-flow content
          // whatever the DOM order, so without it this opaque fill covers the node's icon and
          // label — and a label nobody can see is a label nobody can double-click to edit.
          'pointer-events-none absolute inset-0 -z-10 h-full w-full transition-[filter] duration-150',
          shadow && outlineShadow(isDragging, isHovered)
        )}
        viewBox={`0 0 ${box.width} ${box.height}`}
      >
        <path
          d={pathFor(shape, box.width, box.height)}
          className={cn(
            'fill-surface-overlay transition-[stroke,stroke-width] duration-150',
            statusStroke ||
              (isSelected
                ? 'stroke-foreground-accent-muted'
                : isHovered
                  ? 'stroke-border-hover'
                  : 'stroke-border')
          )}
          strokeWidth={isSelected ? 2 : 1}
        />
      </svg>
    );
  }
);

BaseNodeOutline.displayName = 'BaseNodeOutline';
