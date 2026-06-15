import { act, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTruncationDetection } from '../../../material/components/ap-tooltip/useTruncationDetection';
import { render, screen } from '../../utils/testing';
import { CanvasTooltip } from '../CanvasTooltip';
import { NodeLabel } from './NodeLabel';

// Exercises the real (un-mocked) CanvasTooltip: ref composition, TooltipTrigger
// asChild wiring, and the truncation detection reading the actual label element.
// Radix does not portal its content in happy-dom, so the popup itself is covered
// by Storybook rather than asserted here.

// happy-dom does not evaluate the Tailwind line-clamp styles, so report a clamp
// for the element and drive scroll/client height to decide whether it overflows.
function mockLineClamp(element: HTMLElement, { overflowing }: { overflowing: boolean }) {
  const originalGetComputedStyle = window.getComputedStyle;
  vi.spyOn(window, 'getComputedStyle').mockImplementation((target) => {
    const style = originalGetComputedStyle.call(window, target);
    if (target !== element) {
      return style;
    }

    return new Proxy(style, {
      get(proxyTarget, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return (property: string) =>
            property === '-webkit-line-clamp' ? '3' : proxyTarget.getPropertyValue(property);
        }
        return Reflect.get(proxyTarget, prop, receiver);
      },
    });
  });

  Object.defineProperties(element, {
    clientHeight: { configurable: true, value: 36 },
    scrollHeight: { configurable: true, value: overflowing ? 72 : 36 },
  });
}

describe('NodeLabel tooltip integration (real CanvasTooltip)', () => {
  const detachedElements: HTMLElement[] = [];

  // Standalone elements aren't owned by Testing Library's render root, so remove
  // them explicitly to avoid leaking DOM state into later tests.
  function appendDetached() {
    const element = document.createElement('div');
    document.body.appendChild(element);
    detachedElements.push(element);
    return element;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    while (detachedElements.length) {
      detachedElements.pop()?.remove();
    }
  });

  describe('real CanvasTooltip wiring', () => {
    it('renders the label as the tooltip trigger with no wrapper element (asChild)', () => {
      render(<NodeLabel label="Long node label" subLabel="" selected />);

      const label = screen.getByTestId('node-label');
      const container = label.parentElement;

      // asChild means the label element itself is the trigger: CanvasTooltip
      // must not inject an extra wrapper into the text container.
      expect(container?.children).toHaveLength(1);
      expect(container?.firstElementChild).toBe(label);
    });

    it('composes the trigger ref onto the actual rendered element', () => {
      const ref = createRef<HTMLDivElement>();

      render(
        <CanvasTooltip content="Full label" smartTooltip>
          <div ref={ref} data-testid="trigger">
            Long label text
          </div>
        </CanvasTooltip>
      );

      // Smart truncation inspects the real label node, so CanvasTooltip must
      // forward the consumer ref to the element it actually renders.
      expect(ref.current).toBe(screen.getByTestId('trigger'));
    });
  });

  describe('smart truncation reads the actual label element', () => {
    it('reports truncated when line-clamped content overflows', () => {
      const element = appendDetached();
      mockLineClamp(element, { overflowing: true });

      const { result } = renderHook(() => useTruncationDetection({ current: element }));
      act(() => {
        result.current.check();
      });

      expect(result.current.isTruncated).toBe(true);
    });

    it('reports not truncated when line-clamped content fits', () => {
      const element = appendDetached();
      mockLineClamp(element, { overflowing: false });

      const { result } = renderHook(() => useTruncationDetection({ current: element }));
      act(() => {
        result.current.check();
      });

      expect(result.current.isTruncated).toBe(false);
    });
  });
});
