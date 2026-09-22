"use client";

import { useId } from "react";

interface AiMarkProps {
  size?: number;
  className?: string;
  /** "gradient" paints the self-contained AI gradient; "solid" paints with currentColor. */
  variant?: "gradient" | "solid";
}

/**
 * The AI mark: a filled four-pointed star (Lucide's `astroid`, v1.12.0, inlined
 * because the installed lucide-react predates it). Paints with currentColor by
 * default, or with the AI gradient when `variant="gradient"`. The gradient is
 * self-contained via a `useId`-scoped def, so no external gradient def is needed.
 */
export function AiMark({
  size = 24,
  className,
  variant = "solid",
}: AiMarkProps) {
  const gradientId = useId();
  const fill = variant === "gradient" ? `url(#${gradientId})` : "currentColor";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      className={className}
      aria-hidden="true"
    >
      {variant === "gradient" && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0"
            y1="0.5"
            x2="1"
            y2="0.5"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="8.79%" stopColor="var(--ai-gradient-start)" />
            <stop offset="91.48%" stopColor="var(--ai-gradient-end)" />
          </linearGradient>
        </defs>
      )}
      <path d="M12.983 21.186a1 1 0 0 1-1.966 0 10 10 0 0 0-8.203-8.203 1 1 0 0 1 0-1.966 10 10 0 0 0 8.203-8.203 1 1 0 0 1 1.966 0 10 10 0 0 0 8.203 8.203 1 1 0 0 1 0 1.966 10 10 0 0 0-8.203 8.203" />
    </svg>
  );
}

export type { AiMarkProps };
