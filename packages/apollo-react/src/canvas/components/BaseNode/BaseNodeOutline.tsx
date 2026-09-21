import { cn } from '@uipath/apollo-wind';
import { memo } from 'react';
import type { OutlineDrawnNodeShape } from '../../schema';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';

/**
 * Outlines that a border-radius cannot express, drawn as an SVG behind the node's content.
 *
 * `clipped` and `document` are DMN's business-knowledge-model and knowledge-source shapes. A
 * `clip-path` would cut the container's own border away with it, so the container goes
 * borderless for these and the outline carries fill and stroke instead. That means hover,
 * selection and status have to be drawn here too — on a borderless container the `border-*`
 * classes those normally use paint nothing.
 */
const PATHS: Record<OutlineDrawnNodeShape, string> = {
  clipped: 'M12 0.5 H99.5 V39.5 H12 L0.5 28 V12 Z',
  document: 'M0.5 0.5 H99.5 V33 C75 45 25 21 0.5 33 Z',
};

/**
 * The stroke counterpart of `getStatusBorder`, which paints nothing without a border.
 *
 * Mirrors its colours and keeps the glow, so a status reads the same on an outlined node as on a
 * bordered one.
 */
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

interface BaseNodeOutlineProps {
  shape: OutlineDrawnNodeShape;
  isSelected?: boolean;
  isHovered?: boolean;
  status?: ElementStatusValues | ValidationErrorSeverity | SuggestionType;
}

export const BaseNodeOutline = memo(
  ({ shape, isSelected, isHovered, status }: BaseNodeOutlineProps) => {
    const statusStroke = getStatusStroke(status);

    return (
      <svg
        aria-hidden
        data-testid="base-node-outline"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <path
          d={PATHS[shape]}
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
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }
);

BaseNodeOutline.displayName = 'BaseNodeOutline';
