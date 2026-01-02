import { useCallback, useEffect, useRef, useState } from 'react';

const TOOLTIP_TARGET_ELEMENT = 'tooltip-target-element';

export function useTruncationDetection(elementRef: React.RefObject<HTMLElement | null>): {
  isTruncated: boolean;
  check: () => void;
} {
  const [isTruncated, setIsTruncated] = useState(false);
  const hasCheckedRef = useRef(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const checkTruncation = useCallback(() => {
    const element = elementRef.current;
    if (!element || !(element instanceof HTMLElement)) {
      setIsTruncated(false);
      return;
    }
    let targetElement: HTMLElement = element;
    if (element.id === TOOLTIP_TARGET_ELEMENT) {
      const slot = element.querySelector('slot');
      if (slot) {
        const assignedNodes = slot.assignedNodes();
        for (const node of assignedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            targetElement = node as HTMLElement;
            break;
          }
        }
      } else if (element.firstElementChild) {
        targetElement = element.firstElementChild as HTMLElement;
      }

      // Fallback: find element in light DOM via shadow root
      if (targetElement.id === TOOLTIP_TARGET_ELEMENT) {
        const rootNode = element.getRootNode();
        if (rootNode instanceof ShadowRoot) {
          const hostElement = rootNode.host;
          const slottedElement =
            (hostElement.querySelector('div[data-slot-name="children"]') as HTMLElement) ||
            (Array.from(hostElement.children).find(
              (child) =>
                child instanceof HTMLElement &&
                window.getComputedStyle(child).textOverflow === 'ellipsis'
            ) as HTMLElement | undefined);
          if (slottedElement instanceof HTMLElement) {
            targetElement = slottedElement;
          }
        }
      }
    }
    const computedStyle = window.getComputedStyle(targetElement);
    const hasEllipsis = computedStyle.textOverflow === 'ellipsis';
    const hasOverflowHidden =
      computedStyle.overflow === 'hidden' || computedStyle.overflowX === 'hidden';
    const hasWhiteSpaceNowrap = computedStyle.whiteSpace === 'nowrap';
    if (!hasEllipsis || !hasOverflowHidden || !hasWhiteSpaceNowrap) {
      setIsTruncated(false);
      return;
    }
    const isElementTruncated = targetElement.scrollWidth > targetElement.clientWidth;
    setIsTruncated(isElementTruncated);
  }, [elementRef]);

  const setupObservers = useCallback(() => {
    if (hasCheckedRef.current) {
      return;
    }

    const element = elementRef.current;
    if (!element) {
      return;
    }

    hasCheckedRef.current = true;
    if (!resizeObserverRef.current) {
      resizeObserverRef.current = new ResizeObserver(checkTruncation);
      resizeObserverRef.current.observe(element);
      if (element.id === TOOLTIP_TARGET_ELEMENT && element.firstElementChild) {
        resizeObserverRef.current.observe(element.firstElementChild as HTMLElement);
      }
    }
    window.addEventListener('resize', checkTruncation);
  }, [checkTruncation, elementRef]);

  const check = useCallback(() => {
    checkTruncation();
    setupObservers();
  }, [checkTruncation, setupObservers]);

  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      window.removeEventListener('resize', checkTruncation);
    };
  }, [checkTruncation]);

  return {
    isTruncated,
    check,
  };
}
