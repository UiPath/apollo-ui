import { useLayoutEffect, useRef, useState } from 'react';

/** Whether an element's content is wider than its box, measured again as it or any child resizes and as children come and go. */
export const useHorizontalOverflow = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null);
  const [overflows, setOverflows] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setOverflows(element.scrollWidth > element.clientWidth);
    const resizes = new ResizeObserver(measure);
    const observe = () => {
      resizes.disconnect();
      resizes.observe(element);
      for (const child of element.children) resizes.observe(child);
      measure();
    };
    const mutations = new MutationObserver(observe);
    observe();
    mutations.observe(element, { childList: true });
    return () => {
      mutations.disconnect();
      resizes.disconnect();
    };
  }, []);
  return { ref, overflows };
};
