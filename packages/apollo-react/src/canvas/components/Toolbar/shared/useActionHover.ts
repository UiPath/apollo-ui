import { useEffect, useMemo, useRef } from 'react';

// Not in the toolbar barrel: an internal helper shared by the toolbar's buttons and menu items.
/**
 * Props that report an action as hovered while the pointer is over it or it has keyboard
 * focus. An unmount while hovered reports the leave, since a toolbar that closes under the
 * pointer fires no event for it.
 */
export function useActionHover(onHover: ((hovered: boolean) => void) | undefined) {
  const latest = useRef(onHover);
  latest.current = onHover;
  const state = useRef({ pointer: false, focus: false, reported: false });

  useEffect(
    () => () => {
      if (state.current.reported) latest.current?.(false);
      state.current = { pointer: false, focus: false, reported: false };
    },
    []
  );

  const reporting = !!onHover;
  return useMemo(() => {
    if (!reporting) return undefined;
    const set = (change: { pointer?: boolean; focus?: boolean }) => {
      Object.assign(state.current, change);
      const hovered = state.current.pointer || state.current.focus;
      if (hovered === state.current.reported) return;
      state.current.reported = hovered;
      latest.current?.(hovered);
    };
    return {
      onPointerEnter: () => set({ pointer: true }),
      onPointerLeave: () => set({ pointer: false }),
      onFocus: () => set({ focus: true }),
      onBlur: () => set({ focus: false }),
    };
  }, [reporting]);
}
