import { act, renderHook } from '@testing-library/react';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useRuleDrag } from './useRuleDrag';

const CARD_PX = 100;

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe('useRuleDrag', () => {
  it.each([
    ['upper half of card r100', CARD_PX + 20, [[0, 99]]],
    ['lower half of card r0', 80, []],
  ])("drops in the %s of a sparse window at that card's own edge", (_, y, calls) => {
    const rowIds = Array.from({ length: 102 }, (_, index) => `r${index}`);
    const view = document.body.appendChild(document.createElement('ul'));
    const mounted = [0, 100, 101];
    for (const [slot, index] of mounted.entries()) {
      const card = view.appendChild(document.createElement('li'));
      card.dataset.rowId = `r${index}`;
      card.appendChild(document.createElement('span')).dataset.ruleAction = 'drag';
      vi.spyOn(card, 'getBoundingClientRect').mockReturnValue(
        DOMRect.fromRect({ x: 0, y: slot * CARD_PX, width: 400, height: CARD_PX })
      );
    }
    const onMoveRule = vi.fn();
    const { result } = renderHook(() => useRuleDrag(rowIds, onMoveRule));
    const handle = view.querySelector<HTMLElement>('li[data-row-id="r0"] span');
    act(() => {
      result.current.start(
        'r0',
        {
          target: handle,
          button: 0,
          clientX: 10,
          clientY: 50,
          pointerId: 1,
          preventDefault: () => undefined,
        } as unknown as React.PointerEvent<HTMLElement>,
        {
          container: () => view,
          scroller: () => null,
          stickyTopPx: () => 0,
          previewRef: { current: null },
        }
      );
    });
    act(() => {
      document.dispatchEvent(
        new PointerEvent('pointermove', { clientX: 10, clientY: y, pointerId: 1, buttons: 1 })
      );
      document.dispatchEvent(
        new PointerEvent('pointerup', { clientX: 10, clientY: y, pointerId: 1 })
      );
    });
    expect(onMoveRule.mock.calls).toEqual(calls);
  });
});
