"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";
import { type ConfidenceLevel, LEVEL_CONFIG } from "./confidence-signal-levels";

// ---------------------------------------------------------------------------
// Signal bars icon — three rounded pills, graduated height, left to right.
// Unfilled bars keep a faded tint of the level hue so the icon shape always
// reads, and unknown honestly shows no filled bars at all.
// ---------------------------------------------------------------------------

const BAR_HEIGHTS = [8, 13, 18];

// "Acquire": each bar collapses and springs back, staggered left to right, so
// the icon reads as a value landing rather than as decoration. Plays once.
const ACQUIRE_KEYFRAMES = { scaleY: [1, 0.05, 1] };
const ACQUIRE_TIMES = [0, 0.3, 1];
const ACQUIRE_DURATION = 0.42;
const ACQUIRE_STAGGER = 0.09;

// SVG rects scale from their own box, anchored at the baseline, so the bars
// grow upward out of the track instead of from their centre.
const BAR_TRANSFORM_ORIGIN = {
  transformBox: "fill-box",
  transformOrigin: "bottom",
} as const;

function SignalBars({
  level,
  size = 14,
  animateIn = false,
  className,
}: {
  level: ConfidenceLevel;
  size?: number;
  animateIn?: boolean;
  className?: string;
}) {
  const { filled, solid, faded } = LEVEL_CONFIG[level];
  const prefersReducedMotion = useReducedMotion();
  const animate = animateIn && !prefersReducedMotion;
  const scale = size / 18;

  return (
    <svg
      width={24 * scale}
      height={size}
      viewBox="0 0 24 18"
      fill="none"
      overflow="visible"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      {/* Track bars sit behind the animation so the icon's full shape is
          visible before the value resolves, avoiding a layout shift. */}
      {animate &&
        BAR_HEIGHTS.map((h, i) => (
          <rect
            key={`track-${h}`}
            x={9 * i}
            y={18 - h}
            width={6}
            height={h}
            rx={3}
            fill={faded}
          />
        ))}
      {BAR_HEIGHTS.map((h, i) => (
        <motion.rect
          key={h}
          data-slot="confidence-signal-bar"
          x={9 * i}
          y={18 - h}
          width={6}
          height={h}
          rx={3}
          fill={i < filled ? solid : faded}
          {...(animate
            ? {
                style: BAR_TRANSFORM_ORIGIN,
                animate: ACQUIRE_KEYFRAMES,
                transition: {
                  duration: ACQUIRE_DURATION,
                  times: ACQUIRE_TIMES,
                  delay: i * ACQUIRE_STAGGER,
                  ease: "easeInOut" as const,
                },
              }
            : {})}
        />
      ))}
    </svg>
  );
}

export { SignalBars };
