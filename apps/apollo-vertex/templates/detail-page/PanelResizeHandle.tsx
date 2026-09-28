"use client";

import { type KeyboardEvent, type PointerEvent, useRef } from "react";

const STEP_PX = 16;
const LARGE_STEP_PX = 64;

interface PanelResizeHandleProps {
  /** The panel's current width in px. */
  value: number;
  min: number;
  max: number;
  /** Receives the requested width; the owner clamps it. */
  onResize: (width: number) => void;
  onReset: () => void;
  label: string;
}

function isRtl(element: Element) {
  return getComputedStyle(element).direction === "rtl";
}

/**
 * The draggable divider on an end panel's start edge. The template owns it;
 * the panel surface doesn't change. It sits over the 1px divider with an
 * 8px grab area that takes no layout space.
 *
 * Moving toward the start edge widens the panel. Keys follow logical
 * direction, so they flip in RTL: the arrow toward start widens by 16px
 * (64px with Shift), the arrow toward end narrows, Home and End jump to the
 * minimum and maximum. Double-click resets to the default width.
 */
export function PanelResizeHandle({
  value,
  min,
  max,
  onResize,
  onReset,
  label,
}: PanelResizeHandleProps) {
  const drag = useRef<{ x: number; width: number; rtl: boolean } | null>(null);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      x: event.clientX,
      width: value,
      rtl: isRtl(event.currentTarget),
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;
    const moved = event.clientX - start.x;
    // Toward start is left in LTR and right in RTL.
    onResize(start.width + (start.rtl ? moved : -moved));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const rtl = isRtl(event.currentTarget);
    const towardStart = rtl ? "ArrowRight" : "ArrowLeft";
    const towardEnd = rtl ? "ArrowLeft" : "ArrowRight";
    const step = event.shiftKey ? LARGE_STEP_PX : STEP_PX;
    let next: number;
    if (event.key === towardStart) next = value + step;
    else if (event.key === towardEnd) next = value - step;
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    else return;
    event.preventDefault();
    onResize(next);
  };

  return (
    // A focusable separator is the ARIA pattern for a resize handle.
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-slot="detail-page-resize-handle"
      className="group absolute inset-y-0 -start-1 z-10 flex w-2 cursor-col-resize touch-none select-none justify-center outline-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      onKeyDown={onKeyDown}
    >
      <div className="h-full w-0.5 bg-transparent transition-colors group-hover:bg-ring group-focus-visible:bg-ring" />
    </div>
  );
}
