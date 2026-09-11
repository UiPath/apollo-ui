"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * The success cue: a ring pulses out from the circle as it scales in with a
 * slight overshoot, then the check mark draws in (stroke-dashoffset via
 * `pathLength`, not a fade). Runs once via imperative controls in a
 * mount-only effect — re-renders never replay it. Shared between the
 * catalog submission's Done screen and the request detail's delivery-receipt
 * confirmation — both are one-time completion moments.
 */
export function ConfirmCheck({
  reduceMotion,
}: {
  reduceMotion: boolean | null;
}) {
  const ring = useAnimation();
  const circle = useAnimation();
  const check = useAnimation();

  useEffect(() => {
    if (reduceMotion) {
      ring.set({ opacity: 0 });
      circle.set({ scale: 1 });
      check.set({ pathLength: 1 });
      return;
    }
    ring.start({
      scale: [1, 1.7],
      opacity: [0.55, 0],
      transition: { duration: 0.6, delay: 0.1, ease: "easeOut" },
    });
    circle.start({
      scale: [0, 1.15, 1],
      transition: { duration: 0.5, ease: EASE },
    });
    check.start({
      pathLength: 1,
      transition: { duration: 0.4, delay: 0.26, ease: EASE },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // play once, on mount only — not on re-render

  return (
    <div className="relative mx-auto flex size-10 items-center justify-center">
      <motion.span
        className="absolute inset-0 rounded-full bg-(--primary)"
        initial={{ opacity: 0 }}
        animate={ring}
        aria-hidden
      />
      <motion.span
        className="relative flex size-10 items-center justify-center rounded-full bg-(--primary) text-white"
        initial={{ scale: 0 }}
        animate={circle}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
          <motion.path
            d="M20 6 9 17l-5-5"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={check}
          />
        </svg>
      </motion.span>
    </div>
  );
}
