import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export function useElementsOverlap(
  obstacleRefs: ReadonlyArray<RefObject<HTMLElement | null>>,
  triggerRefs: ReadonlyArray<RefObject<HTMLElement | null>> = []
): { overlaps: boolean; targetRef: (el: HTMLElement | null) => void } {
  const [overlaps, setOverlaps] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const obstaclesRef = useRef(obstacleRefs);
  const triggersRef = useRef(triggerRefs);

  const targetRef = useCallback((el: HTMLElement | null) => {
    setTarget(el);
  }, []);

  useLayoutEffect(() => {
    obstaclesRef.current = obstacleRefs;
    triggersRef.current = triggerRefs;
  });

  useLayoutEffect(() => {
    if (!target) return;

    let baselineWidth = 0;
    let baselineHeight = 0;
    let lastOverlap = false;

    const measure = () => {
      const tRect = target.getBoundingClientRect();
      if (!lastOverlap) {
        baselineWidth = tRect.width;
        baselineHeight = tRect.height;
      }
      const left = tRect.right - baselineWidth;
      const top = tRect.bottom - baselineHeight;

      let isOverlapping = false;
      for (const ref of obstaclesRef.current) {
        const el = ref.current;
        if (!el) continue;
        const oRect = el.getBoundingClientRect();
        if (
          !(
            oRect.right <= left ||
            oRect.left >= tRect.right ||
            oRect.bottom <= top ||
            oRect.top >= tRect.bottom
          )
        ) {
          isOverlapping = true;
          break;
        }
      }
      lastOverlap = isOverlapping;
      setOverlaps(isOverlapping);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(target);
    for (const ref of obstaclesRef.current) {
      if (ref.current) ro.observe(ref.current);
    }
    for (const ref of triggersRef.current) {
      if (ref.current) ro.observe(ref.current);
    }
    measure();
    return () => ro.disconnect();
  }, [target]);

  return { overlaps, targetRef };
}
