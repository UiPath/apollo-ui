/**
 * Synthetic layout for the drag-and-drop suites.
 *
 * happy-dom runs no layout, so every element reports a zero rect. dnd-kit's collision
 * detection then cannot tell two rows apart, and the keyboard sensor finds no candidate in the
 * arrow direction, so a reorder silently does nothing. Laying the rendered rows out on a
 * vertical grid is the minimum geometry a reorder needs; it is also all of it, which is why
 * this is a fixture and not a mock of dnd-kit.
 */

import { act } from '@testing-library/react';

const ROW_HEIGHT = 48;
const ROW_WIDTH = 320;

function rectAt(top: number, height: number): DOMRect {
  const rect = {
    x: 0,
    y: top,
    top,
    left: 0,
    right: ROW_WIDTH,
    bottom: top + height,
    width: ROW_WIDTH,
    height,
  };
  return { ...rect, toJSON: () => rect } as DOMRect;
}

function stubRect(element: Element, rect: DOMRect): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () => rect,
  });
}

/**
 * Stack every rendered row into a column, and give their container a rect that spans it (the
 * `restrictToParentElement` modifier clamps the drag translation to that rect, and a zero-sized
 * parent clamps it to nothing).
 */
export function layoutRowsVertically(
  container: HTMLElement,
  selector = '[data-slot="guardrail-list-row"]'
): void {
  const rows = Array.from(container.querySelectorAll<HTMLElement>(selector));
  rows.forEach((row, index) => stubRect(row, rectAt(index * ROW_HEIGHT, ROW_HEIGHT)));

  const parents = new Set(
    rows.map((row) => row.parentElement).filter((el): el is HTMLElement => el !== null)
  );
  for (const parent of parents) {
    stubRect(parent, rectAt(0, rows.length * ROW_HEIGHT));
  }
}

/**
 * Let dnd-kit finish a step of a drag.
 *
 * It measures droppables and applies coordinate changes inside `requestAnimationFrame`, which
 * the canvas test setup implements as `setTimeout(cb, 0)`: a macrotask, so it does not flush
 * with the `act()` around a `fireEvent`. Await this between the keystrokes of a drag, or the
 * next one is computed against the geometry of the step before.
 */
export async function flushDndFrame(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}
