import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AUTOSCROLL_EDGE_PX, AUTOSCROLL_STEP_PX, RULE_DRAG_PREVIEW_OFFSET_PX } from './constants';
import { followPointerDrag, type PointerPoint } from './pointerDrag';
import { dropIndex } from './useDragReorder';

/** A rule drag: the dragged rule, and the boundary (`0..count`) it would drop before. */
export interface RuleDrag {
  rowId: string;
  from: number;
  boundary: number;
}

/** Where a rule drag runs: the cards' view, its scroller and header, the copy's slot, and the move. */
export interface RuleDragSurface {
  /** The view holding the rule cards. */
  container: () => HTMLElement | null;
  /** The element that scrolls the cards: the view, or the page's scrolling element. */
  scroller: () => HTMLElement | null;
  /** How much of the scroller's top the sticky header covers. */
  stickyTopPx: () => number;
  previewRef: React.RefObject<HTMLElement | null>;
  onMoveRule: ((from: number, to: number) => void) | undefined;
}

/** The boundary at the edge nearest `y` of the mounted card under it, by row index. */
const boundaryAt = (
  container: HTMLElement,
  indexOf: ReadonlyMap<string, number>,
  y: number
): number | null => {
  let boundary: number | null = null;
  for (const card of container.querySelectorAll<HTMLElement>('li[data-row-id]')) {
    const index = indexOf.get(card.dataset.rowId ?? '');
    if (index === undefined) continue;
    const { top, height } = card.getBoundingClientRect();
    if (y < top + height / 2) return boundary ?? index;
    boundary = index + 1;
  }
  return boundary;
};

const visibleRowsOf = (scroller: HTMLElement): { top: number; bottom: number } =>
  scroller === scroller.ownerDocument.scrollingElement
    ? { top: 0, bottom: scroller.ownerDocument.defaultView?.innerHeight ?? 0 }
    : scroller.getBoundingClientRect();

const copyOf = (card: HTMLElement): Node => {
  const copy = card.cloneNode(true);
  if (copy instanceof HTMLElement) {
    for (const element of [copy, ...copy.querySelectorAll('[id], [data-testid], [data-row-id]')]) {
      element.removeAttribute('id');
      element.removeAttribute('data-testid');
      element.removeAttribute('data-row-id');
    }
  }
  return copy;
};

/** Drag-reorder of rule cards on the grid's pointer drag: the drop is the edge of the card under the pointer, read from live card rects; the rules changing cancels it. */
export const useRuleDrag = (rowIds: readonly string[]) => {
  const [drag, setDrag] = useState<RuleDrag | null>(null);
  const rowIdsRef = useRef(rowIds);
  rowIdsRef.current = rowIds;
  const dragRef = useRef<RuleDrag | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  const start = useCallback(
    (rowId: string, event: React.PointerEvent<HTMLElement>, surface: RuleDragSurface): boolean => {
      const { container, scroller, stickyTopPx, previewRef, onMoveRule } = surface;
      const rowIds = rowIdsRef.current;
      const view = container();
      const from = rowIds.indexOf(rowId);
      const card =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>('li[data-row-id]')
          : null;
      if (!onMoveRule || !view || from < 0 || !card) return false;
      cancelRef.current?.();
      event.preventDefault();
      const indexOf = new Map(rowIds.map((id, index) => [id, index]));
      const preview = previewRef.current;
      if (preview) {
        preview.style.width = `${card.getBoundingClientRect().width}px`;
        preview.replaceChildren(copyOf(card));
      }
      const retarget = ({ x, y }: PointerPoint) => {
        preview?.style.setProperty(
          'transform',
          `translate(${x + RULE_DRAG_PREVIEW_OFFSET_PX}px, ${y + RULE_DRAG_PREVIEW_OFFSET_PX}px)`
        );
        const state = dragRef.current;
        const boundary = boundaryAt(view, indexOf, y);
        if (!state || boundary === null || boundary === state.boundary) return;
        dragRef.current = { ...state, boundary };
        setDrag(dragRef.current);
      };
      dragRef.current = { rowId, from, boundary: from };
      setDrag(dragRef.current);
      const pointer = { x: event.clientX, y: event.clientY };
      retarget(pointer);
      const target = scroller();
      cancelRef.current = followPointerDrag({
        container: target,
        pointerId: event.pointerId,
        pointer,
        edgeScroll: ({ y }) => {
          if (!target) return false;
          const { top, bottom } = visibleRowsOf(target);
          const before = target.scrollTop;
          if (y > bottom - AUTOSCROLL_EDGE_PX) {
            target.scrollTop += AUTOSCROLL_STEP_PX;
          } else if (y < top + stickyTopPx() + AUTOSCROLL_EDGE_PX) {
            target.scrollTop -= AUTOSCROLL_STEP_PX;
          }
          return target.scrollTop !== before;
        },
        onPointer: retarget,
        onDrop: (at) => {
          retarget(at);
          const state = dragRef.current;
          if (!state) return;
          const to = dropIndex(state.from, state.boundary);
          if (to !== state.from) onMoveRule(state.from, to);
        },
        onEnd: () => {
          preview?.replaceChildren();
          preview?.style.removeProperty('transform');
          dragRef.current = null;
          cancelRef.current = null;
          setDrag(null);
        },
      });
      return true;
    },
    []
  );

  const rulesKey = rowIds.join('\n');
  // biome-ignore lint/correctness/useExhaustiveDependencies: `rulesKey` is the signal, not a value this reads
  useEffect(() => {
    cancelRef.current?.();
  }, [rulesKey]);
  useEffect(() => () => cancelRef.current?.(), []);

  return { drag, start };
};
