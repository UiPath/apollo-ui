import { cn } from '@uipath/apollo-wind';
import { useMemo } from 'react';
import type { NodeShape } from '../../schema';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import type { ValidationErrorSeverity } from '../../types/validation';

export const getStatusBorder = (
  status?: ElementStatusValues | ValidationErrorSeverity | SuggestionType
): string => {
  switch (status) {
    case 'InProgress':
      return 'border-info animate-glow [--glow-color:var(--info)]';
    case 'Completed':
    case 'add':
      return 'border-success';
    case 'ActionNeeded':
    case 'Paused':
    case 'Warning':
    case 'WARNING':
    case 'update':
      return 'border-warning animate-glow [--glow-color:var(--warning)]';
    case 'Cancelled':
    case 'Failed':
    case 'Terminated':
    case 'ERROR':
    case 'CRITICAL':
    case 'delete':
      return 'border-error animate-glow [--glow-color:var(--error)]';
    default:
      return '';
  }
};

interface BaseContainerProps {
  isSelected?: boolean;
  isHovered?: boolean;
  isStacked?: boolean;
  shape?: NodeShape;
  interactionState?: string;
  executionStatus?: ElementStatusValues;
  validationStatus?: ValidationErrorSeverity;
  suggestionType?: SuggestionType;
  hasFooter?: boolean;
  background?: string;
  loading?: boolean;
  shadow?: boolean;
  children: React.ReactNode;
}

export const BaseContainer = ({
  isSelected,
  isHovered,
  isStacked,
  shape,
  interactionState,
  executionStatus,
  validationStatus,
  suggestionType,
  hasFooter,
  background,
  loading,
  shadow = true,
  children,
}: BaseContainerProps) => {
  const activeStatus = suggestionType ?? validationStatus ?? executionStatus;

  // cn() is needed here because border-color classes from getStatusBorder,
  // hover, and selection states intentionally override the base `border-border`.
  const className = useMemo(() => {
    const statusBorder = getStatusBorder(activeStatus);
    const hasStatusBorder = statusBorder.length > 0;

    return cn(
      'relative flex items-center cursor-pointer bg-surface-overlay border border-border',
      'w-(--node-w) min-h-(--node-h) h-auto rounded-(--node-radius)',
      'outline-offset-0 transition-[box-shadow,border-color] duration-150',
      shadow && 'shadow-(--canvas-node-shadow-rest)',
      shape === 'rectangle'
        ? 'flex-row justify-start gap-3 p-(--node-gap)'
        : 'flex-col justify-center',
      hasFooter && 'flex-wrap',
      statusBorder,
      shadow && isHovered && 'shadow-(--canvas-node-shadow-hover)',
      isHovered && !hasStatusBorder && 'border-border-hover',
      isSelected && 'outline outline-2 outline-foreground-accent-muted',
      interactionState === 'disabled' && 'opacity-50 cursor-not-allowed',
      interactionState === 'drag' &&
        cn('cursor-grabbing', shadow && 'shadow-(--canvas-node-shadow-lifted)'),
      // Decorative stacked layer for drillable / collapsed nodes. Purely visual:
      // a ::before pseudo inherits the container's radius/size, sits behind at
      // -z-10, and is offset down so only a thin arc peeks out below the card.
      isStacked &&
        'before:content-[""] before:absolute before:inset-x-0 before:top-0 before:h-full before:rounded-[inherit] before:bg-surface-overlay before:border before:border-brand before:translate-y-[6px] before:-z-10 before:pointer-events-none'
    );
  }, [shape, hasFooter, activeStatus, isSelected, isHovered, isStacked, interactionState, shadow]);

  return (
    <div
      data-testid="base-container"
      data-execution-status={executionStatus}
      data-interaction-state={interactionState}
      data-validation-status={validationStatus}
      data-suggestion-type={suggestionType}
      data-stacked={isStacked || undefined}
      className={className}
      style={background ? { background } : undefined}
      aria-busy={loading || undefined}
    >
      {children}
    </div>
  );
};
