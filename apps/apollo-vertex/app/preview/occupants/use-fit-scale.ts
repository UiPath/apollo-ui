import { type RefObject, useEffect, useState } from "react";

interface FitScaleOptions {
  /** The frame's real size, in px. */
  width: number;
  height: number;
  /** Stage space the frame can't use, in px: padding, and the dock below it. */
  reservedX: number;
  reservedY: number;
  /** False at 100%: the scale is 1 and the stage scrolls. */
  enabled: boolean;
}

/**
 * How much the frame shrinks to fit the stage: 1 when it already fits, and
 * never more than 1. Follows the stage's size as the window or the side
 * columns change.
 */
export function useFitScale(
  stageRef: RefObject<HTMLElement | null>,
  { width, height, reservedX, reservedY, enabled }: FitScaleOptions,
): number {
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
  if (!enabled || stage.width === 0 || width === 0 || height === 0) return 1;
  return Math.min(
    1,
    Math.max(0, stage.width - reservedX) / width,
    Math.max(0, stage.height - reservedY) / height,
  );
}
