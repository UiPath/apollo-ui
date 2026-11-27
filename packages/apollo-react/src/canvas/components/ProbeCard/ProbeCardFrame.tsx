import { Button } from '@uipath/apollo-wind';
import { X } from 'lucide-react';
import { memo, type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useLatestRef } from '../../hooks/useLatestRef';
import { ProbeResizeHandles, type ResizeEdges } from './ProbeResizeHandles';
import { useDragSession } from './useDragSession';

/** User-facing text of the frame, so a host can translate it. Every key falls back to English. */
export interface ProbeCardFrameStrings {
  /** The card's accessible name, and its default title. */
  label: string;
  /** The close button's label. */
  close: string;
  /** Read by a screen reader when the card is focused, naming the keys that move, resize and remove it. */
  keyboardHint: string;
}

const DEFAULT_STRINGS: ProbeCardFrameStrings = {
  label: 'Probe',
  close: 'Remove probe',
  keyboardHint:
    'Arrow keys move the probe, Shift plus arrow keys resize it, and Delete removes it.',
};

export interface ProbeCardFrameProps {
  /** Header title. Defaults to `strings.label`. */
  title?: ReactNode;
  /** Controls placed in the header between the title and the close button. */
  headerActions?: ReactNode;
  /** The card body. It scrolls inside the frame; wheel gestures past its ends pan the canvas. */
  children: ReactNode;
  strings?: Partial<ProbeCardFrameStrings>;
  onDragStart: () => void;
  onDrag: (cumulativeDelta: { x: number; y: number }) => void;
  onDragEnd: () => void;
  onResizeStart: () => void;
  onResize: (cumulativeDelta: { x: number; y: number }, edges: ResizeEdges) => void;
  onResizeEnd: () => void;
  onClose: () => void;
  /**
   * Moves the card by a number of screen pixels. Called for the arrow keys while the card itself has
   * focus, so a card can be moved without a pointer.
   */
  onNudge?: (delta: { x: number; y: number }) => void;
  /** Grows or shrinks the card by a number of screen pixels. Called for Shift + the arrow keys. */
  onResizeBy?: (delta: { x: number; y: number }) => void;
  /**
   * Called when the user scrolls or middle-mouse-drags over the card while it is embedded in a canvas,
   * so the card pans the underlying canvas instead of swallowing the gesture.
   */
  onCanvasPan?: (delta: { x: number; y: number }) => void;
  /** Called when the user Ctrl+scrolls (pinch-to-zoom) over the card while embedded in a canvas. */
  onCanvasZoom?: (params: {
    clientX: number;
    clientY: number;
    deltaY: number;
    deltaMode: number;
    ctrlKey: boolean;
  }) => void;
}

const PAN_ON_SCROLL_SPEED = 0.5;
const NUDGE_PX = 10;

const ARROW_DELTAS: Record<string, { x: number; y: number }> = {
  ArrowLeft: { x: -NUDGE_PX, y: 0 },
  ArrowRight: { x: NUDGE_PX, y: 0 },
  ArrowUp: { x: 0, y: -NUDGE_PX },
  ArrowDown: { x: 0, y: NUDGE_PX },
};

function ProbeCardFrameComponent({
  title,
  headerActions,
  children,
  strings,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onClose,
  onNudge,
  onResizeBy,
  onCanvasPan,
  onCanvasZoom,
}: ProbeCardFrameProps) {
  const text = { ...DEFAULT_STRINGS, ...strings };
  const hintId = useId();
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useLatestRef(onClose);
  const onCanvasPanRef = useLatestRef(onCanvasPan);
  const onCanvasZoomRef = useLatestRef(onCanvasZoom);
  const isSpacePressedRef = useRef(false);
  const canvasPanCleanupRef = useRef<(() => void) | null>(null);
  const canvasPanLastPointRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const keyboardMovable = !!onNudge || !!onResizeBy;

  const handleHeaderMouseDown = useDragSession({
    onStart: onDragStart,
    onMove: onDrag,
    onEnd: onDragEnd,
  });

  // Keyboard shortcuts — capture phase so we run before ReactFlow's handlers.
  //   Escape           → dismiss the probe (always, even from an input)
  //   Delete/Backspace → dismiss when focus is inside the card and no editable is active, so a focused
  //                      button inside it cannot hand the key to the canvas, which would delete the selected node
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

  // Runs in the capture phase, ahead of the header's own mousedown (whose preventDefault would otherwise
  // keep the card from taking focus), so a press anywhere on the card's chrome focuses it.
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    const delta = ARROW_DELTAS[e.key];
    if (!delta || e.target !== e.currentTarget || !keyboardMovable) return;
    e.preventDefault();
    if (e.shiftKey && onResizeBy) onResizeBy(delta);
    else onNudge?.(delta);
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
      // Shift + wheel is a horizontal pan on Windows and Linux, so it never scrolls the body.
      const horizontalPan = !isMac() && e.shiftKey;
      const target = e.target instanceof Node ? e.target : null;
      if (
        !horizontalPan &&
        target &&
        bodyRef.current?.contains(target) &&
        canScrollVertically(bodyRef.current, e.deltaY)
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
        if (horizontalPan) {
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
      // biome-ignore lint/a11y/noNoninteractiveTabindex: card requires programmatic focus for keyboard shortcuts (Escape/Delete/arrows)
      tabIndex={0}
      role="group"
      aria-label={text.label}
      aria-describedby={keyboardMovable ? hintId : undefined}
      aria-keyshortcuts={
        keyboardMovable
          ? 'ArrowUp ArrowDown ArrowLeft ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+ArrowLeft Shift+ArrowRight Delete'
          : undefined
      }
      className="relative h-full flex flex-col rounded-[20px] border border-dashed border-border bg-surface-raised shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-foreground-accent-muted nodrag"
      onMouseDownCapture={handleMouseDownCapture}
      onClickCapture={handleClickCapture}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      // A canvas menu acts on the node it was last opened over, which is not this card's.
      onContextMenu={(e) => e.stopPropagation()}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div
        onMouseDown={handleHeaderMouseDown}
        className="flex items-center gap-2 px-3 py-2 border-b border-border-subtle bg-surface-overlay/30 cursor-move select-none shrink-0"
      >
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-foreground">
          {title ?? text.label}
        </span>
        {headerActions}
        <Button
          variant="ghost"
          size="3xs"
          icon
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onClose}
          title={text.close}
          aria-label={text.close}
        >
          <X />
        </Button>
      </div>

      {/* Body */}
      <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto">
        {children}
      </div>

      {keyboardMovable && (
        <span id={hintId} className="sr-only">
          {text.keyboardHint}
        </span>
      )}

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
 * ProbeCardFrame — the chrome of a floating probe card, without a body. It owns the drag header, the
 * close button, the resize handles, scroll-to-pan and pinch-to-zoom forwarding, focus, Escape and
 * Delete to close, and keyboard move and resize. Callers supply the title, any header actions and the
 * body, and own position, size and persistence like for {@link ProbeCard}, which is this frame with a
 * watch list inside.
 *
 * Memoized so it skips re-rendering when the parent re-renders only because the canvas viewport panned
 * or zoomed.
 */
export const ProbeCardFrame = memo(ProbeCardFrameComponent);

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
