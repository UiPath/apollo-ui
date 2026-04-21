import { cn } from '@uipath/apollo-wind';
import { useMemo } from 'react';
import type { NodeShape } from '../../schema';
import type { SuggestionType } from '../../types';
import type { ElementStatusValues } from '../../types/execution';
import { ValidationErrorSeverity } from '../../types/validation';

export const getStatusBorder = (
  status?: ElementStatusValues | ValidationErrorSeverity | SuggestionType
): string => {
  switch (status) {
    case 'InProgress':
      return 'border-info animate-glow [--glow-color:var(--info)]';
    case 'Completed':
    case 'add':
      return 'border-success';
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
  shape?: NodeShape;
  interactionState?: string;
  executionStatus?: ElementStatusValues;
  validationStatus?: ValidationErrorSeverity;
  suggestionType?: SuggestionType;
  hasFooter?: boolean;
  background?: string;
  loading?: boolean;
  children: React.ReactNode;
}

export const BaseContainer = ({
  isSelected,
  isHovered,
  shape,
  interactionState,
  executionStatus,
  validationStatus,
  suggestionType,
  hasFooter,
  background,
  loading,
  children,
}: BaseContainerProps) => {
  const activeStatus = suggestionType ?? validationStatus ?? executionStatus;

  // cn() is needed here because border-color classes from getStatusBorder,
  // hover, and selection states intentionally override the base `border-border`.
  const className = useMemo(
    () =>
      cn(
        'relative flex items-center cursor-pointer bg-surface-overlay border-2 border-border',
        'w-(--node-w) h-(--node-h) rounded-(--node-radius)',
        shape === 'rectangle'
          ? 'flex-row justify-start gap-3 p-(--node-gap)'
          : 'flex-col justify-center',
        hasFooter && 'flex-wrap',
        getStatusBorder(activeStatus),
        !isSelected && isHovered && 'border-foreground-muted',
        isSelected && 'border-brand',
        isSelected && isHovered && 'border-foreground-accent-muted',
        interactionState === 'disabled' && 'opacity-50 cursor-not-allowed',
        interactionState === 'drag' && 'cursor-grabbing opacity-80'
      ),
    [shape, hasFooter, activeStatus, isSelected, isHovered, interactionState]
  );

  return (
    <div
      data-testid="base-container"
      data-execution-status={executionStatus}
      data-interaction-state={interactionState}
      data-validation-status={validationStatus}
      data-suggestion-type={suggestionType}
      className={className}
      style={background ? { background } : undefined}
      aria-busy={loading || undefined}
    >
      {children}
    </div>
  );
};
