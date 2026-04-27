import {
  useEventListener,
  useMergedRef,
  useResizeObserver,
} from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";

export function useStickyScroll() {
  const [isStuck, setIsStuck] = useState(true);
  const isStuckRef = useRef(true);
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef(0);

  function setStuck(stuck: boolean) {
    isStuckRef.current = stuck;
    setIsStuck(stuck);
  }

  function scrollToBottom() {
    const el = scrollElRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setStuck(true);
  }

  function unstickIfScrolled() {
    const el = scrollElRef.current;
    if (!el) return;
    const before = el.scrollTop;
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = requestAnimationFrame(() => {
      const after = el.scrollTop;
      if (after < before - 0.5) setStuck(false);
    });
  }

  useEffect(() => {
    return () => cancelAnimationFrame(rafIdRef.current);
  }, []);

  function handleWheel(e: WheelEvent) {
    if (e.deltaY >= 0) return;
    if (!isStuckRef.current) return;
    unstickIfScrolled();
  }

  function handleScroll() {
    if (isStuckRef.current) return;
    const el = scrollElRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
    if (atBottom) setStuck(true);
  }

  function storeRef(node: HTMLDivElement | null) {
    scrollElRef.current = node;
  }

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
