import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

// Not in the toolbar barrel: an internal helper shared by the toolbar's buttons and menu items.
/**
 * Props that report an action as hovered while the pointer is over it or it has keyboard
 * focus. An unmount while hovered reports the leave, since a toolbar that closes under the
 * pointer fires no event for it.
 */
export function useActionHover(onHover: ((hovered: boolean) => void) | undefined) {
  // The latest callback, kept out of render so a render React throws away cannot leave it set.
  const latest = useRef(onHover);
  // Whoever was told `true`, so the matching `false` reaches them even if the callback changes.
  const recipient = useRef<typeof onHover>(undefined);
  const state = useRef({ pointer: false, focus: false });

  const end = () => {
    recipient.current?.(false);
    recipient.current = undefined;
  };

  useLayoutEffect(() => {
    latest.current = onHover;
    // Reporting stopped while hovered: no leave event will follow, so end the report now.
    if (!onHover && recipient.current) end();
  });

  useEffect(
    () => () => {
      end();
      state.current = { pointer: false, focus: false };
    },
    []
  );

  const reporting = !!onHover;
  return useMemo(() => {
    if (!reporting) return undefined;
    const set = (change: { pointer?: boolean; focus?: boolean }) => {
      Object.assign(state.current, change);
      const hovered = state.current.pointer || state.current.focus;
      if (hovered === !!recipient.current) return;
      if (!hovered) return end();
      recipient.current = latest.current;
      recipient.current?.(true);
    };
    return {
      onPointerEnter: () => set({ pointer: true }),
      onPointerLeave: () => set({ pointer: false }),
      onFocus: () => set({ focus: true }),
      onBlur: () => set({ focus: false }),
    };
  }, [reporting]);
}
