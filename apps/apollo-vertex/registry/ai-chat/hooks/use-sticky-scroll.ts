import { useCallback, useRef, useState } from "react";

export function useStickyScroll() {
  const [isStuck, setIsStuck] = useState(true);
  const isStuckRef = useRef(true);
  const scrollElRef = useRef<HTMLDivElement | null>(null);

  const setStuck = useCallback((stuck: boolean) => {
    isStuckRef.current = stuck;
    setIsStuck(stuck);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollElRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStuck(true);
  }, [setStuck]);

  const scrollRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollElRef.current = el;
      if (!el) return;

      const onWheel = (e: WheelEvent) => {
        if (e.deltaY < 0) setStuck(false);
      };

      const onScroll = () => {
        if (isStuckRef.current) return;
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
        if (atBottom) setStuck(true);
      };

      el.addEventListener("wheel", onWheel, { passive: true });
      el.addEventListener("scroll", onScroll, { passive: true });

      return () => {
        el.removeEventListener("wheel", onWheel);
        el.removeEventListener("scroll", onScroll);
      };
    },
    [setStuck],
  );

  const contentRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (isStuckRef.current) {
        const scrollEl = scrollElRef.current;
        if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
      }
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  return { scrollRef, contentRef, isStuck, scrollToBottom };
}
