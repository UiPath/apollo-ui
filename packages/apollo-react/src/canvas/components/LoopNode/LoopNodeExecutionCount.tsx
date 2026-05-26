import { cn } from '@uipath/apollo-wind';
import { useRef, useState } from 'react';
import { useSafeLingui } from '../../../i18n';
import { ElementStatusValues } from '../../types/execution';
import { CanvasIcon } from '../../utils/icon-registry';
import { clamp } from '../../utils/NodeUtils';
import type { LoopNodeExecutionCountState } from './LoopNode.types';

function stopEvent(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function getIterationStatusColor(status: ElementStatusValues | undefined): string {
  switch (status) {
    case ElementStatusValues.Completed:
      return '#22c55e';
    case ElementStatusValues.Failed:
      return '#ef4444';
    case ElementStatusValues.InProgress:
      return '#f59e0b';
    case ElementStatusValues.Paused:
      return '#a855f7';
    case ElementStatusValues.Cancelled:
      return '#94a3b8';
    default:
      return 'currentColor';
  }
}

export function LoopNodeExecutionCount({
  state,
  size = 'full',
}: {
  state: LoopNodeExecutionCountState;
  size?: 'full' | 'compact' | 'minimal';
}) {
  const {
    activeIndex,
    total,
    onActiveIndexChange,
    disabled,
    isAll,
    onAllChange,
    iterationStatuses,
  } = state;

  const { _ } = useSafeLingui();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const safeTotal = Number.isFinite(total) && total > 0 ? total : 1;
  const safeActiveIndex = clamp(
    Number.isFinite(activeIndex) && activeIndex >= 0 ? activeIndex : 0,
    0,
    safeTotal - 1
  );

  const canInteract = !disabled && typeof onActiveIndexChange === 'function';
  const visibleIndex = safeActiveIndex + 1;

  const currentStatus = iterationStatuses?.get(safeActiveIndex);
  const firstFailedIndex = iterationStatuses
    ? [...iterationStatuses.entries()].find(([, s]) => s === ElementStatusValues.Failed)?.[0]
    : undefined;
  const completedCount = iterationStatuses
    ? [...iterationStatuses.values()].filter((s) => s === ElementStatusValues.Completed).length
    : undefined;
  const failedCount = iterationStatuses
    ? [...iterationStatuses.values()].filter((s) => s === ElementStatusValues.Failed).length
    : 0;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll && safeActiveIndex > 0) onActiveIndexChange?.(safeActiveIndex - 1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canInteract && !isAll && safeActiveIndex < safeTotal - 1)
      onActiveIndexChange?.(safeActiveIndex + 1);
  };

  const toggleAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onAllChange(!isAll);
  };

  const handleJumpToFailed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (firstFailedIndex !== undefined) onActiveIndexChange?.(firstFailedIndex);
  };

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canInteract || isAll || isEditing) return;
    setInputValue(String(visibleIndex));
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const commitEdit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!Number.isNaN(parsed)) onActiveIndexChange?.(clamp(parsed, 1, safeTotal) - 1);
    setIsEditing(false);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') setIsEditing(false);
  };

  const canGoPrev = canInteract && !isAll && safeActiveIndex > 0;
  const canGoNext = canInteract && !isAll && safeActiveIndex < safeTotal - 1;

  // Minimal tier — read-only count chip
  if (size === 'minimal') {
    return (
      <div
        className="nodrag nopan pointer-events-auto flex items-center"
        onPointerDown={stopEvent}
        onMouseDown={stopEvent}
      >
        <div className="flex h-6 items-center gap-0.5 rounded-full border border-border bg-surface px-2 text-[11px] font-semibold leading-none shadow-sm">
          {isAll ? (
            completedCount !== undefined ? (
              <>
                <span style={{ color: getIterationStatusColor(ElementStatusValues.Completed) }}>
                  ✓{completedCount}
                </span>
                {failedCount > 0 && (
                  <span style={{ color: getIterationStatusColor(ElementStatusValues.Failed) }}>
                    {' '}
                    ✗{failedCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="opacity-60">Σ</span>
                <span className="ml-0.5">{safeTotal}</span>
              </>
            )
          ) : (
            <>
              {currentStatus && (
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: getIterationStatusColor(currentStatus) }}
                />
              )}
              <span>{visibleIndex}</span>
              <span className="px-0.5 opacity-60">/</span>
              <span>{safeTotal}</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // Full and compact tiers — unified segmented pill
  return (
    <div
      className="nodrag nopan pointer-events-auto flex items-center gap-1.5"
      onPointerDown={stopEvent}
      onMouseDown={stopEvent}
      onDoubleClick={stopEvent}
    >
      {/* Single unified pill */}
      <div className="nodrag nopan flex h-6 items-stretch overflow-hidden rounded-full border border-border bg-surface shadow-sm">
        {/* Left segment — All toggle */}
        <button
          type="button"
          onClick={toggleAll}
          onPointerDown={stopEvent}
          onMouseDown={stopEvent}
          disabled={disabled}
          aria-pressed={isAll}
          aria-label={_({
            id: 'loop-node.execution-count.show-aggregate',
            message: 'Show aggregate across all iterations',
          })}
          className={cn(
            'nodrag nopan select-none px-2.5 text-[11px] font-semibold leading-none transition-colors',
            isAll ? 'bg-surface-overlay text-foreground' : 'text-foreground hover:bg-surface-hover',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          All
        </button>

        {/* Divider */}
        <div className="w-px shrink-0 bg-border" />

        {/* Right segment — aggregate or navigation */}
        {isAll ? (
          <button
            type="button"
            onClick={toggleAll}
            onPointerDown={stopEvent}
            onMouseDown={stopEvent}
            disabled={disabled}
            className={cn(
              'nodrag nopan flex items-center gap-1.5 px-2.5 text-[11px] font-semibold leading-none transition-colors hover:bg-surface-overlay',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            aria-label={_({
              id: 'loop-node.execution-count.return-to-individual',
              message: 'Return to individual iteration view',
            })}
            title={_({
              id: 'loop-node.execution-count.click-to-return',
              message: 'Click to return to individual iteration view',
            })}
          >
            {completedCount !== undefined ? (
              <>
                <span style={{ color: getIterationStatusColor(ElementStatusValues.Completed) }}>
                  ✓ {completedCount}
                </span>
                {failedCount > 0 && (
                  <span style={{ color: getIterationStatusColor(ElementStatusValues.Failed) }}>
                    ✗ {failedCount}
                  </span>
                )}
              </>
            ) : (
              <>
                <span aria-hidden className="opacity-60">
                  Σ
                </span>
                <span>{safeTotal}</span>
              </>
            )}
          </button>
        ) : (
          <div className="flex items-stretch">
            {/* Prev — hidden in compact */}
            {size === 'full' && (
              <button
                type="button"
                className={cn(
                  'nodrag nopan flex w-5 items-center justify-center text-foreground transition-opacity',
                  !canGoPrev
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:bg-surface-overlay'
                )}
                disabled={!canGoPrev}
                aria-label={_({
                  id: 'loop-node.execution-count.previous-iteration',
                  message: 'Previous iteration',
                })}
                onClick={handlePrev}
                onPointerDown={stopEvent}
                onMouseDown={stopEvent}
              >
                <CanvasIcon icon="chevron-left" size={12} />
              </button>
            )}

            {/* Editable fraction with status dot */}
            <span
              className={cn(
                'flex min-w-10 select-none items-center justify-center gap-0.5 text-[11px] font-semibold leading-none',
                size === 'full' ? 'px-1' : 'px-2.5',
                canInteract && !isEditing && 'cursor-pointer hover:text-foreground-accent'
              )}
              onClick={startEdit}
              title={
                canInteract
                  ? _({
                      id: 'loop-node.execution-count.click-to-jump',
                      message: 'Click to jump to a specific iteration',
                    })
                  : undefined
              }
            >
              {isEditing ? (
                <>
                  <input
                    ref={inputRef}
                    type="number"
                    min={1}
                    max={safeTotal}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleInputKeyDown}
                    onPointerDown={stopEvent}
                    className="w-7 appearance-none bg-transparent text-center text-[11px] font-semibold leading-none outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-b border-foreground-accent"
                  />
                  <span className="px-0.5 opacity-60">/</span>
                  <span>{safeTotal}</span>
                </>
              ) : (
                <>
                  {currentStatus && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: getIterationStatusColor(currentStatus) }}
                    />
                  )}
                  <span>{visibleIndex}</span>
                  <span className="px-0.5 opacity-60">/</span>
                  <span>{safeTotal}</span>
                </>
              )}
            </span>

            {/* Next — hidden in compact */}
            {size === 'full' && (
              <button
                type="button"
                className={cn(
                  'nodrag nopan flex w-5 items-center justify-center text-foreground transition-opacity',
                  !canGoNext
                    ? 'cursor-not-allowed opacity-40'
                    : 'cursor-pointer hover:bg-surface-overlay'
                )}
                disabled={!canGoNext}
                aria-label={_({
                  id: 'loop-node.execution-count.next-iteration',
                  message: 'Next iteration',
                })}
                onClick={handleNext}
                onPointerDown={stopEvent}
                onMouseDown={stopEvent}
              >
                <CanvasIcon icon="chevron-right" size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Jump-to-failed shortcut */}
      {firstFailedIndex !== undefined && !isAll && canInteract && (
        <button
          type="button"
          className="nodrag nopan inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface shadow-sm transition-colors hover:border-red-400"
          onClick={handleJumpToFailed}
          onPointerDown={stopEvent}
          onMouseDown={stopEvent}
          aria-label={_({
            id: 'loop-node.execution-count.jump-to-failed',
            message: 'Jump to first failed iteration',
          })}
          title={_({
            id: 'loop-node.execution-count.jump-to-iteration',
            message: 'Jump to iteration {iterationNumber} (failed)',
            values: { iterationNumber: firstFailedIndex + 1 },
          })}
        >
          <CanvasIcon
            icon="crosshair"
            size={12}
            color={getIterationStatusColor(ElementStatusValues.Failed)}
          />
        </button>
      )}
    </div>
  );
}
