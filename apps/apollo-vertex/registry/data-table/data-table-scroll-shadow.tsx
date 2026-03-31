"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";

const edgeFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};
const fastFadeTransition = { duration: 0.15 };

function useScrollShadow() {
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const containerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (!node) return;

    const el = node.querySelector<HTMLElement>('[data-slot="table-container"]');
    if (!el) return;

    let rafId = 0;
    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
      });
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, []);

  return { containerRef, canScrollLeft, canScrollRight };
}

interface DataTableScrollShadowProps {
  canScrollLeft: boolean;
  canScrollRight: boolean;
}

function DataTableScrollShadow({
  canScrollLeft,
  canScrollRight,
}: DataTableScrollShadowProps) {
  return (
    <AnimatePresence>
      {canScrollLeft && (
        <motion.div
          data-slot="data-table-scroll-shadow"
          key="shadow-left"
          className="pointer-events-none absolute inset-y-0 left-0 w-3 z-10 bg-gradient-to-r from-black/10 to-transparent"
          variants={edgeFadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={fastFadeTransition}
          style={{ originX: 0 }}
        />
      )}
      {canScrollRight && (
        <motion.div
          data-slot="data-table-scroll-shadow"
          key="shadow-right"
          className="pointer-events-none absolute inset-y-0 right-0 w-3 z-10 bg-gradient-to-l from-black/10 to-transparent"
          variants={edgeFadeVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={fastFadeTransition}
          style={{ originX: 1 }}
        />
      )}
    </AnimatePresence>
  );
}

export { DataTableScrollShadow, useScrollShadow };
