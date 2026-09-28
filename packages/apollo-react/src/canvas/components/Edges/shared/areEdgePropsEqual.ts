import type { EdgeProps } from '@uipath/apollo-react/canvas/xyflow/react';

/** Suppresses re-renders from sub-pixel coordinate jitter during pan/zoom. */
export function areEdgePropsEqual(prev: EdgeProps, next: EdgeProps): boolean {
  if (prev.id !== next.id) return false;
  if (prev.selected !== next.selected) return false;
  if (prev.animated !== next.animated) return false;
  if (prev.source !== next.source) return false;
  if (prev.target !== next.target) return false;
  if (prev.sourceHandleId !== next.sourceHandleId) return false;
  if (prev.targetHandleId !== next.targetHandleId) return false;
  if (prev.sourcePosition !== next.sourcePosition) return false;
  if (prev.targetPosition !== next.targetPosition) return false;
  if (prev.data !== next.data) return false;
  if (prev.style !== next.style) return false;

  const threshold = 0.5;
  if (Math.abs(prev.sourceX - next.sourceX) > threshold) return false;
  if (Math.abs(prev.sourceY - next.sourceY) > threshold) return false;
  if (Math.abs(prev.targetX - next.targetX) > threshold) return false;
  if (Math.abs(prev.targetY - next.targetY) > threshold) return false;

  return true;
}
