import { Button } from '@uipath/apollo-wind';
import { ChevronDown, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLatestRef } from '../../hooks/useLatestRef';
import { ProbeResizeHandles, type ResizeEdges } from './ProbeResizeHandles';
import { useDragSession } from './useDragSession';

// ============================================================================
// Public types
// ============================================================================

/** Iteration cycler shown for a node inside a loop. */
export interface IterationControl {
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}

/** A watch expression with its evaluated value. */
export interface WatchResult {
  id: string;
  expression: string;
  value: unknown;
  /** True once a debug snapshot exists and the expression is non-empty. */
  hasValue: boolean;
}

export interface ProbeCardProps {
  watches: readonly WatchResult[];
  iterationControl?: IterationControl;
  onAddWatch: () => void;
  onUpdateWatch: (watchId: string, expression: string) => void;
  onRemoveWatch: (watchId: string) => void;
  onDragStart: () => void;
  onDrag: (cumulativeDelta: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onResizeStart: () => void;
  onResize: (cumulativeDelta: { x: number; y: number }, edges: ResizeEdges) => void;
  onResizeEnd: () => void;
  onClose: () => void;
  /**
   * Called when the user scrolls or middle-mouse-drags over the card while
   * it is embedded in a canvas — allows the card to pan the underlying canvas
   * instead of swallowing the gesture silently.
   */
  onCanvasPan?: (delta: { x: number; y: number }) => void;
  /**
   * Called when the user Ctrl+scrolls (pinch-to-zoom) over the card while
   * embedded in a canvas — forwards the gesture to the canvas zoom handler.
   */
  onCanvasZoom?: (params: {
    clientX: number;
    clientY: number;
    deltaY: number;
    deltaMode: number;
    ctrlKey: boolean;
  }) => void;
}

// ============================================================================
// Inline value renderer (no external dependencies)
// ============================================================================

function WatchValueView({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null) {
    return <span className="text-[11px] font-mono text-foreground-subtle italic">null</span>;
  }
  if (value === undefined) {
    return <span className="text-[11px] font-mono text-foreground-subtle italic">undefined</span>;
  }
  if (typeof value === 'string') {
    return (
      <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
        &quot;{value}&quot;
      </span>
    );
  }
  if (typeof value === 'number') {
    return (
      <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'boolean') {
    return (
      <span className="text-[11px] font-mono text-violet-600 dark:text-violet-400">
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'object') {
    const isArray = Array.isArray(value);
    const entries = isArray
      ? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
      : Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return (
        <span className="text-[11px] font-mono text-foreground-subtle">
          {isArray ? '[]' : '{}'}
        </span>
      );
    }

    if (depth >= 3) {
      return (
        <span className="text-[11px] font-mono text-foreground-subtle">
          {isArray ? `[…${entries.length}]` : '{…}'}
        </span>
      );
    }

    return (
      <div className="pl-2 space-y-0.5">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-1 text-[11px] font-mono min-w-0">
            <span className="text-foreground-muted shrink-0">{k}:</span>
            <WatchValueView value={v} depth={depth + 1} />
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-[11px] font-mono text-foreground-muted">{String(value)}</span>;
}

// ============================================================================
// Sub-components
// ============================================================================

function RemoveButton({ onRemove, label }: { onRemove: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="3xs"
      icon
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onRemove}
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity shrink-0 self-center"
      title={label}
      aria-label={label}
    >
      <X />
    </Button>
  );
}

function DisclosureButton({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Button
      variant="ghost"
      size="3xs"
      icon
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onToggle}
      title={label}
      aria-label={label}
      aria-expanded={expanded}
    >
      {expanded ? <ChevronDown /> : <ChevronRight />}
    </Button>
  );
}

function WatchRow({
  watch,
  onChange,
  onRemove,
}: {
  watch: WatchResult;
  onChange: (expression: string) => void;
  onRemove: () => void;
}) {
  const [expr, setExpr] = useState(watch.expression);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    setExpr(watch.expression);
  }, [watch.expression]);

  const commit = () => {
    if (expr !== watch.expression) onChange(expr);
  };

  return (
    <div className="group px-2 py-1 border-b border-border-subtle last:border-b-0">
      <div className="flex items-center gap-1 min-w-0">
        <DisclosureButton
          expanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
          label="Toggle value"
        />
        <input
          value={expr}
          onChange={(e) => setExpr(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commit();
          }}
          placeholder="e.g. output.items[0].id"
          aria-label="Watch expression"
          data-probe-watch-input="true"
          className="flex-1 min-w-0 text-sm font-mono text-foreground-secondary bg-transparent outline-none border-b border-transparent focus:border-foreground-accent"
        />
        <RemoveButton onRemove={onRemove} label="Remove watch" />
      </div>
      {expanded && watch.hasValue && (
        <div className="pl-2 pt-0.5">
          <WatchValueView value={watch.value} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ProbeCard
// ============================================================================

const PAN_ON_SCROLL_SPEED = 0.5;

function ProbeCardComponent({
  watches,
  iterationControl,
  onAddWatch,
  onUpdateWatch,
  onRemoveWatch,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onClose,
  onCanvasPan,
  onCanvasZoom,
}: ProbeCardProps) {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const watchListRef = useRef<HTMLDivElement>(null);
  const pendingFocusNewWatchRef = useRef(false);
  const previousWatchCountRef = useRef(watches.length);
  const onCloseRef = useLatestRef(onClose);
  const onCanvasPanRef = useLatestRef(onCanvasPan);
  const onCanvasZoomRef = useLatestRef(onCanvasZoom);
  const isSpacePressedRef = useRef(false);
  const canvasPanCleanupRef = useRef<(() => void) | null>(null);
  const canvasPanLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);

  const handleHeaderMouseDown = useDragSession({
    onStart: onDragStart,
    onMove: onDrag,
    onEnd: onDragEnd,
  });

  const handleAddWatch = () => {
    pendingFocusNewWatchRef.current = true;
    onAddWatch();
  };

  useLayoutEffect(() => {
    const previousCount = previousWatchCountRef.current;
    previousWatchCountRef.current = watches.length;
    if (!pendingFocusNewWatchRef.current || watches.length <= previousCount) return;
    pendingFocusNewWatchRef.current = false;
    const inputs = watchListRef.current?.querySelectorAll<HTMLInputElement>(
      '[data-probe-watch-input="true"]'
    );
    const input = inputs?.[inputs.length - 1];
    if (!input) return;
    input.scrollIntoView({ block: 'nearest' });
    input.focus({ preventScroll: true });
  }, [watches.length]);

  // Keyboard shortcuts — capture phase so we run before ReactFlow's handlers.
  //   Escape          → dismiss the probe (always, even from an input)
  //   Delete/Backspace → dismiss when card has focus but no editable is active
  //   ArrowUp/Down    → move focus between watch expression inputs
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const card = cardRef.current;
      if (!card || !card.contains(document.activeElement)) return;

      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const inputs = Array.from(
          card.querySelectorAll<HTMLInputElement>('[data-probe-watch-input="true"]')
        );
        const idx = inputs.indexOf(document.activeElement as HTMLInputElement);
        if (idx === -1) return;
        const next = inputs[e.key === 'ArrowDown' ? idx + 1 : idx - 1];
        if (next) {
          e.preventDefault();
          e.stopPropagation();
          next.focus();
          next.select();
        }
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const active = document.activeElement as HTMLElement | null;
      const isEditable =
        !!active &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (isEditable) return;
      e.stopPropagation();
      e.preventDefault();
      onCloseRef.current();
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [onCloseRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') isSpacePressedRef.current = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') isSpacePressedRef.current = false;
    };
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      canvasPanCleanupRef.current?.();
    };
  }, []);

  const startCanvasPan = (e: React.MouseEvent) => {
    if (!onCanvasPanRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    suppressNextClickRef.current = true;
    canvasPanCleanupRef.current?.();
    canvasPanLastPointRef.current = { x: e.clientX, y: e.clientY };

    const handleMove = (ev: MouseEvent) => {
      const last = canvasPanLastPointRef.current;
      if (!last) return;
      const next = { x: ev.clientX, y: ev.clientY };
      canvasPanLastPointRef.current = next;
      onCanvasPanRef.current?.({ x: next.x - last.x, y: next.y - last.y });
    };
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      canvasPanCleanupRef.current = null;
      canvasPanLastPointRef.current = null;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    };
    canvasPanCleanupRef.current = handleUp;
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const handleMouseDownCapture = (e: React.MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const startedMiddlePan = e.button === 1;
    const startedSpacePan =
      e.button === 0 && isSpacePressedRef.current && !isInteractiveTarget(target);
    if (startedMiddlePan || startedSpacePan) {
      startCanvasPan(e);
      return;
    }
    if (e.button === 0 && !isInteractiveTarget(target)) cardRef.current?.focus();
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (!suppressNextClickRef.current) return;
    suppressNextClickRef.current = false;
    e.stopPropagation();
    e.preventDefault();
  };

  // Non-passive wheel listener so we can preventDefault on pinch-to-zoom
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        if (onCanvasZoomRef.current) {
          e.stopPropagation();
          e.preventDefault();
          onCanvasZoomRef.current({
            clientX: e.clientX,
            clientY: e.clientY,
            deltaY: e.deltaY,
            deltaMode: e.deltaMode,
            ctrlKey: e.ctrlKey,
          });
        }
        return;
      }
      const target = e.target instanceof Node ? e.target : null;
      if (
        target &&
        watchListRef.current?.contains(target) &&
        canScrollVertically(watchListRef.current, e.deltaY)
      ) {
        e.stopPropagation();
        return;
      }
      if (onCanvasPanRef.current) {
        e.stopPropagation();
        e.preventDefault();
        const deltaNormalize = e.deltaMode === 1 ? 20 : 1;
        let deltaX = e.deltaX * deltaNormalize;
        let deltaY = e.deltaY * deltaNormalize;
        if (!isMac() && e.shiftKey) {
          deltaX = e.deltaY * deltaNormalize;
          deltaY = 0;
        }
        onCanvasPanRef.current({
          x: -deltaX * PAN_ON_SCROLL_SPEED,
          y: -deltaY * PAN_ON_SCROLL_SPEED,
        });
      }
    };

    card.addEventListener('wheel', onWheel, { passive: false });
    return () => card.removeEventListener('wheel', onWheel);
  }, [onCanvasZoomRef, onCanvasPanRef]);

  return (
    // biome-ignore lint/a11y/useSemanticElements: no semantic element maps to a focusable probe card container; <fieldset> would add form semantics and unwanted styles
    <div
      ref={cardRef}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: card requires programmatic focus for keyboard shortcuts (Escape/Delete/ArrowUp/ArrowDown)
      tabIndex={0}
      role="group"
      aria-label="Probe"
      className="relative h-full flex flex-col rounded-[20px] border border-dashed border-border bg-surface-raised shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground-accent-muted nodrag"
      onMouseDownCapture={handleMouseDownCapture}
      onClickCapture={handleClickCapture}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-surface-overlay/30 cursor-move select-none shrink-0"
      >
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">Probe</span>

        {iterationControl && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost"
              size="3xs"
              icon
              disabled={iterationControl.current === 0}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={iterationControl.onPrev}
              title="Previous iteration"
              aria-label="Previous iteration"
            >
              <ChevronLeft />
            </Button>
            <span className="text-[10px] font-mono text-foreground-subtle tabular-nums select-none">
              {iterationControl.current + 1}/{iterationControl.total}
            </span>
            <Button
              variant="ghost"
              size="3xs"
              icon
              disabled={iterationControl.current === iterationControl.total - 1}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={iterationControl.onNext}
              title="Next iteration"
              aria-label="Next iteration"
            >
              <ChevronRight />
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          size="3xs"
          icon
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleAddWatch}
          title="Add watch"
          aria-label="Add watch"
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="3xs"
          icon
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          title="Remove probe"
          aria-label="Remove probe"
        >
          <X />
        </Button>
      </div>

      {/* Watch list */}
      <div ref={watchListRef} className="flex-1 min-h-0 overflow-y-auto">
        {watches.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <span className="text-[11px] text-foreground-subtle text-center leading-relaxed">
              No watches — use + to add one
            </span>
          </div>
        ) : (
          watches.map((w) => (
            <WatchRow
              key={w.id}
              watch={w}
              onChange={(expr) => onUpdateWatch(w.id, expr)}
              onRemove={() => onRemoveWatch(w.id)}
            />
          ))
        )}
      </div>

      <ProbeResizeHandles
        active={hovered}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
      />
    </div>
  );
}

/**
 * ProbeCard — a floating debug card for inspecting canvas node output values.
 *
 * Memoized so it skips re-rendering when the parent re-renders only because
 * the canvas viewport panned or zoomed — all props are referentially stable
 * across those frames.
 *
 * The card is fully controlled: the caller owns position, size, and the watch
 * list. ProbeCard handles all interactions internally (drag, resize, keyboard
 * shortcuts, scroll-to-pan, and pinch-to-zoom forwarding).
 *
 * ### Integration pattern
 *
 * 1. **State** — maintain `offset`, `size`, and `watches` in your own store.
 * 2. **Position** — render the card `position: absolute` inside a container
 *    that covers the canvas viewport. Calculate `left`/`top` from the anchor
 *    node's canvas-to-screen coordinates and the stored `offset`.
 * 3. **Connector** — draw an SVG dashed line from the anchor node's edge to
 *    the card's center using the same coordinate conversion.
 * 4. **Watch values** — evaluate `watch.expression` against the node's runtime
 *    output snapshot and pass results as `WatchResult[]`. Set `hasValue: true`
 *    only when a snapshot is available so the value row is shown.
 * 5. **Canvas pan/zoom** — pass `onCanvasPan` and `onCanvasZoom` so scroll and
 *    middle-mouse gestures over the card are forwarded to the canvas viewport
 *    instead of being swallowed.
 *
 * @example
 * ```tsx
 * import { ProbeCard } from '@uipath/apollo-react/canvas';
 *
 * <div style={{ position: 'absolute', left: cardLeft, top: cardTop, width, height }}>
 *   <ProbeCard
 *     watches={watches}
 *     onAddWatch={() => addWatch(probeId)}
 *     onUpdateWatch={(id, expr) => updateWatch(probeId, id, expr)}
 *     onRemoveWatch={(id) => removeWatch(probeId, id)}
 *     onDragStart={() => captureOffset()}
 *     onDrag={(delta) => setOffset(prev => ({ x: prev.x + delta.x / zoom, y: prev.y + delta.y / zoom }))}
 *     onDragEnd={() => persistOffset()}
 *     onResizeStart={() => captureSize()}
 *     onResize={(delta, edges) => applyResize(delta, edges)}
 *     onResizeEnd={() => persistSize()}
 *     onClose={() => removeProbe(probeId)}
 *     onCanvasPan={(delta) => panBy(delta)}
 *     onCanvasZoom={(params) => zoomAtPoint(params)}
 *   />
 * </div>
 * ```
 */
export const ProbeCard = memo(ProbeCardComponent);

// ============================================================================
// Helpers
// ============================================================================

function isInteractiveTarget(target: Element | null): boolean {
  return !!target?.closest(
    'input, textarea, select, button, a, [contenteditable], [role="button"], [role="menuitem"]'
  );
}

function isMac(): boolean {
  return typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
}

function canScrollVertically(element: HTMLElement, deltaY: number): boolean {
  if (deltaY === 0) return false;
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 0) return false;
  return deltaY < 0 ? element.scrollTop > 0 : element.scrollTop < maxScrollTop;
}
