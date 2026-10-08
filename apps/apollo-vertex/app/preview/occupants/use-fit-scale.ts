import { type RefObject, useEffect, useState } from "react";

interface FitScaleOptions {
  /** The frame's real width, in px. */
  width: number;
  /** The page's shortest height, in px: it grows past it to fill the stage. */
  minHeight: number;
  /** Stage space the frame can't use, in px: padding, and the dock below it. */
  reservedX: number;
  reservedY: number;
  /** False at 100%: the scale is 1 and the stage scrolls. */
  enabled: boolean;
}

interface FitScale {
  /** How much the frame shrinks: 1 when it already fits, never more than 1. */
  scale: number;
  /** The page's real height, so the scaled frame fills the stage's height. */
  height: number;
}

/**
 * How much the frame shrinks to fit the stage, and how tall the page is so
 * the frame fills the stage's height instead of leaving a gap above and
 * below it. Follows the stage's size as the window or the side columns
 * change.
 */
export function useFitScale(
  stageRef: RefObject<HTMLElement | null>,
  { width, minHeight, reservedX, reservedY, enabled }: FitScaleOptions,
): FitScale {
  const [stage, setStage] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;
    const observer = new ResizeObserver(() =>
      setStage({ width: node.clientWidth, height: node.clientHeight }),
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [stageRef]);
  if (stage.width === 0 || width === 0 || minHeight === 0)
    return { scale: 1, height: minHeight };
  const roomX = Math.max(0, stage.width - reservedX);
  const roomY = Math.max(0, stage.height - reservedY);
  const scale = enabled ? Math.min(1, roomX / width, roomY / minHeight) : 1;
  if (scale === 0) return { scale, height: minHeight };
  return { scale, height: Math.max(minHeight, Math.floor(roomY / scale)) };
}
