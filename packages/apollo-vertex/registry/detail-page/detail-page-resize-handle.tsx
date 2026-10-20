"use client";

import { type KeyboardEvent, type PointerEvent, useRef } from "react";

import { useVertexTranslation } from "@/lib/vertex-translation";

const STEP_PX = 16;
const LARGE_STEP_PX = 64;

interface DetailPageResizeHandleProps {
  value: number;
  min: number;
  max: number;
  onResize: (width: number) => void;
  onReset: () => void;
}

function isRtl(element: Element) {
  return getComputedStyle(element).direction === "rtl";
}

/**
 * Divider on the end sidebar's start edge. The page owns it. The 8px grab
 * area is centered on that edge and takes no layout space.
 *
 * Moving toward the start edge widens the sidebar. Arrow keys follow
 * logical direction, so they flip in RTL. Home and End jump to the ends of
 * the range. Double-click resets to the default width.
 */
export function DetailPageResizeHandle({
  value,
  min,
  max,
  onResize,
  onReset,
}: DetailPageResizeHandleProps) {
  const { t } = useVertexTranslation();
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
    onResize(start.width + (start.rtl ? moved : -moved));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const next = keyWidth(event, value, min, max);
    if (next === null) return;
    event.preventDefault();
    onResize(next);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t("detail_page_resize_end_panel")}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      data-part="resize-handle"
      className="group absolute inset-y-0 start-[-4px] z-20 flex w-2 cursor-col-resize touch-none select-none justify-center outline-none"
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

function keyWidth(
  event: KeyboardEvent<HTMLDivElement>,
  value: number,
  min: number,
  max: number,
): number | null {
  const rtl = isRtl(event.currentTarget);
  const towardStart = rtl ? "ArrowRight" : "ArrowLeft";
  const towardEnd = rtl ? "ArrowLeft" : "ArrowRight";
  const step = event.shiftKey ? LARGE_STEP_PX : STEP_PX;
  if (event.key === towardStart) return value + step;
  if (event.key === towardEnd) return value - step;
  if (event.key === "Home") return min;
  if (event.key === "End") return max;
  return null;
}
