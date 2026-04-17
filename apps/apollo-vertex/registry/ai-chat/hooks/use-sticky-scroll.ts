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

  function handleWheel(e: WheelEvent) {
    if (e.deltaY < 0) setStuck(false);
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
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [contentRect.height]);

  return { scrollRef, contentRef, isStuck, scrollToBottom };
}
