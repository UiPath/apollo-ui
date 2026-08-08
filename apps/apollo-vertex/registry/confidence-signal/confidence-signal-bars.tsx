"use client";

import { cn } from "@/lib/utils";
import { type ConfidenceLevel, LEVEL_CONFIG } from "./confidence-signal-levels";

// ---------------------------------------------------------------------------
// Signal bars icon — three rounded pills, graduated height, left to right.
// Unfilled bars keep a faded tint of the level hue so the icon shape always
// reads, and unknown honestly shows no filled bars at all.
// ---------------------------------------------------------------------------

const BAR_HEIGHTS = [8, 13, 18];

const ACQUIRE_DELAYS = [0, 0.09, 0.18];

// The animation is applied inline per bar so each one can carry its own delay.
// The reduced-motion override therefore needs `!important` to win over it.
const ACQUIRE_STYLES = `
@keyframes confidence-signal-acquire {
  0%   { transform: scaleY(1); }
  30%  { transform: scaleY(0.05); }
  100% { transform: scaleY(1); }
}
@media (prefers-reduced-motion: reduce) {
  [data-slot="confidence-signal-bar"] { animation: none !important; }
}
`;

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
      {animateIn && <style>{ACQUIRE_STYLES}</style>}
      {animateIn &&
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
        <rect
          key={h}
          data-slot="confidence-signal-bar"
          x={9 * i}
          y={18 - h}
          width={6}
          height={h}
          rx={3}
          fill={i < filled ? solid : faded}
          style={
            animateIn
              ? {
                  transformBox: "fill-box",
                  transformOrigin: "bottom",
                  animation: `confidence-signal-acquire 0.42s ease-in-out ${ACQUIRE_DELAYS[i]}s both`,
                }
              : {}
          }
        />
      ))}
    </svg>
  );
}

export { SignalBars };
