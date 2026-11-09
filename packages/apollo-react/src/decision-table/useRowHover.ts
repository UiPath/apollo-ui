import { type RefObject, useEffect, useRef } from 'react';

/**
 * Keeps the row hover overlay under the pointer's row: one composited element moved per row change,
 * in place of a style change on every cell of the row entered and the row left. Hidden while `active`
 * is false (a drag, whose rows slide out of their index positions), and back over the row under the
 * pointer once it is true again, without waiting for the pointer to move.
 */
export const useRowHover = (
  containerRef: RefObject<HTMLElement | null>,
  overlayRef: RefObject<HTMLElement | null>,
  rowTopPx: (index: number) => number,
  active: boolean
): void => {
  // Outlives the effect, which re-runs when `active` flips under a pointer that has not moved.
  const hoveredRowRef = useRef<Element | null>(null);
  useEffect(() => {
    const container = containerRef.current;
    const overlay = overlayRef.current;
    if (!container || !overlay) {
      return;
    }
    let shownTop: number | null = null;
    const place = (top: number | null) => {
      if (top === shownTop) {
        return;
      }
      shownTop = top;
      overlay.style.display = top === null ? 'none' : '';
      if (top !== null) {
        overlay.style.transform = `translateY(${top}px)`;
      }
    };
    const refresh = () => {
      const row = hoveredRowRef.current;
      // A data row only, and not one with an open editor: the editor is the user's focus.
      const cell = row?.isConnected ? row.querySelector(':scope > [data-row]') : null;
      place(
        active && cell instanceof HTMLElement && !row?.querySelector('[data-editing]')
          ? rowTopPx(Number(cell.dataset.row))
          : null
      );
    };
    const onPointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !(event.target instanceof Element)) {
        return;
      }
      hoveredRowRef.current = event.target.closest('tbody > tr');
      refresh();
    };
    const onPointerOut = (event: PointerEvent) => {
      if (!(event.relatedTarget instanceof Node) || !container.contains(event.relatedTarget)) {
        hoveredRowRef.current = null;
        place(null);
      }
    };
    overlay.style.display = 'none';
    refresh();
    // An editor opened or closed from the keyboard, under a pointer that has not moved.
    const editing = new MutationObserver(refresh);
    editing.observe(container, { subtree: true, attributeFilter: ['data-editing'] });
    container.addEventListener('pointerover', onPointerOver);
    container.addEventListener('pointerout', onPointerOut);
    return () => {
      editing.disconnect();
      container.removeEventListener('pointerover', onPointerOver);
      container.removeEventListener('pointerout', onPointerOut);
      place(null);
    };
  }, [containerRef, overlayRef, rowTopPx, active]);
};
