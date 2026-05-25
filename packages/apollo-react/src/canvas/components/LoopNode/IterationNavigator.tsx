import { cn } from '@uipath/apollo-wind';
import type { SyntheticEvent } from 'react';
import { useCallback } from 'react';
import { useSafeLingui } from '../../../i18n';
import { clamp } from '../../utils';
import { CanvasIcon } from '../../utils/icon-registry';
import type { LoopIterationState } from './LoopNode.types';

interface IterationNavigatorProps {
  iterationState: LoopIterationState;
}

function resolveState(iterationState: LoopIterationState): LoopIterationState | undefined {
  if (!Number.isFinite(iterationState.total)) {
    return undefined;
  }

  const total = Math.trunc(iterationState.total);

  if (total <= 0) {
    return undefined;
  }

  const rawActiveIndex = Number.isFinite(iterationState.activeIndex)
    ? Math.trunc(iterationState.activeIndex)
    : 0;

  return {
    ...iterationState,
    total,
    activeIndex: clamp(rawActiveIndex, 0, total - 1),
  };
}

function stopCanvasControlEvent(event: SyntheticEvent) {
  event.stopPropagation();
}

export function IterationNavigator({ iterationState }: IterationNavigatorProps) {
  const resolvedState = resolveState(iterationState);

  if (!resolvedState) {
    return null;
  }

  return <NavigatorContent iterationState={resolvedState} />;
}

function NavigatorContent({ iterationState }: { iterationState: LoopIterationState }) {
  const { _ } = useSafeLingui();
  const { activeIndex, total, onActiveIndexChange, disabled, ariaLabel } = iterationState;
  const canInteract = !disabled && typeof onActiveIndexChange === 'function';
  const canGoPrevious = canInteract && activeIndex > 0;
  const canGoNext = canInteract && activeIndex < total - 1;
  const label = ariaLabel ?? _({ id: 'loop-node.iteration.label', message: 'Loop iteration' });
  const visibleIndex = activeIndex + 1;
  const statusLabel = _({
    id: 'loop-node.iteration.status',
    message: '{label}: {visibleIndex} of {total}',
    values: { label, visibleIndex, total },
  });
  const previousLabel = _({
    id: 'loop-node.iteration.previous',
    message: 'Previous loop iteration',
  });
  const nextLabel = _({ id: 'loop-node.iteration.next', message: 'Next loop iteration' });

  const handlePrevious = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation();

      if (!canGoPrevious) return;
      onActiveIndexChange?.(activeIndex - 1);
    },
    [activeIndex, canGoPrevious, onActiveIndexChange]
  );

  const handleNext = useCallback(
    (event: SyntheticEvent) => {
      event.stopPropagation();

      if (!canGoNext) return;
      onActiveIndexChange?.(activeIndex + 1);
    },
    [activeIndex, canGoNext, onActiveIndexChange]
  );

  return (
    <fieldset
      className={cn(
        'nodrag nopan pointer-events-auto m-0 flex h-6 min-w-0 shrink-0 items-center gap-1 rounded-full px-1 py-0',
        'border border-border bg-surface text-foreground shadow-sm'
      )}
      data-testid="loop-iteration-navigator"
      onPointerDown={stopCanvasControlEvent}
      onMouseDown={stopCanvasControlEvent}
      onDoubleClick={stopCanvasControlEvent}
    >
      <legend className="sr-only">{statusLabel}</legend>
      <button
        type="button"
        className={cn(
          'nodrag nopan inline-flex h-4 w-4 items-center justify-center rounded-full',
          'text-foreground transition-opacity',
          canGoPrevious ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'
        )}
        disabled={!canGoPrevious}
        aria-label={previousLabel}
        onClick={handlePrevious}
        onPointerDown={stopCanvasControlEvent}
        onMouseDown={stopCanvasControlEvent}
        data-testid="loop-iteration-previous"
      >
        <CanvasIcon icon="chevron-left" size={12} />
      </button>
      <span
        className="min-w-8 select-none px-1 text-center text-[11px] font-semibold leading-4"
        data-testid="loop-iteration-label"
      >
        {visibleIndex} / {total}
      </span>
      <button
        type="button"
        className={cn(
          'nodrag nopan inline-flex h-4 w-4 items-center justify-center rounded-full',
          'text-foreground transition-opacity',
          canGoNext ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-40'
        )}
        disabled={!canGoNext}
        aria-label={nextLabel}
        onClick={handleNext}
        onPointerDown={stopCanvasControlEvent}
        onMouseDown={stopCanvasControlEvent}
        data-testid="loop-iteration-next"
      >
        <CanvasIcon icon="chevron-right" size={12} />
      </button>
    </fieldset>
  );
}
