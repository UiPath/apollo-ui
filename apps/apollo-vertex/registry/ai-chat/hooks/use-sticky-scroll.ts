import {
  useEventListener,
  useMergedRef,
  useResizeObserver,
} from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";

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

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (e.deltaY < 0) setStuck(false);
    },
    [setStuck],
  );

  const handleScroll = useCallback(() => {
    if (isStuckRef.current) return;
    const el = scrollElRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
    if (atBottom) setStuck(true);
  }, [setStuck]);

  const storeRef = useCallback((node: HTMLDivElement | null) => {
    scrollElRef.current = node;
  }, []);

  const wheelRef = useEventListener("wheel", handleWheel, { passive: true });
  const scrollListenerRef = useEventListener("scroll", handleScroll, {
    passive: true,
  });
  const scrollRef = useMergedRef(storeRef, wheelRef, scrollListenerRef);

  const [contentRef, contentRect] = useResizeObserver();

  useEffect(() => {
    if (isStuckRef.current) {
      const el = scrollElRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [contentRect.height]);

  return { scrollRef, contentRef, isStuck, scrollToBottom };
}
