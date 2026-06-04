/**
 * React.memo comparator for canvas node components.
 *
 * XYFlow v12 passes `positionAbsoluteX` / `positionAbsoluteY` to every custom
 * node component on each render. When a container node (loop, group, stage) is
 * dragged, the absolute position of every descendant updates on every animation
 * frame, so React's default shallow compare sees changed props and re-renders
 * each child ~60fps for the whole drag — even though our node components never
 * read the absolute position (XYFlow's NodeWrapper applies the transform, not
 * the node body). The result is observable lag that scales with the number of
 * nodes inside the container.
 *
 * This comparator shallow-compares all props EXCEPT the absolute-position
 * fields, so position-only updates no longer re-render the node body.
 *
 * IMPORTANT: Any node component that genuinely needs the live absolute position
 * inside its render/handlers (e.g. BlankCanvasNode) must NOT use this comparator.
 */
export function areNodePropsEqualIgnoringPosition(prevProps: object, nextProps: object): boolean {
  if (prevProps === nextProps) {
    return true;
  }

  const prev = prevProps as Record<string, unknown>;
  const next = nextProps as Record<string, unknown>;

  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (key === 'positionAbsoluteX' || key === 'positionAbsoluteY') {
      continue;
    }
    if (!Object.is(prev[key], next[key])) {
      return false;
    }
  }

  return true;
}
