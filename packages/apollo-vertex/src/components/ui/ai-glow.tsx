"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { useId } from "react";
import { cn } from "@/lib/utils";

// Organic blob for the group glow. The shape is mirrored (fuller lobe on the
// right) via a clip path, while the gradient lives in the unflipped root space
// so it always runs violet (left) to teal (right).
const GROUP_BLOB =
  "M124.909 87.7963L40.0002 119.001L40.0471 121.245L88.6762 130.906C132.72 132.472 223.153 135.555 232.53 135.359C244.251 135.113 315.666 133.619 447.602 128.917C579.537 124.214 504.087 109.289 446.803 90.7685C428.089 88.9151 405.086 89.6999 383 82.3956C360.914 75.0913 357.352 70.9186 338.481 61.6054C319.611 52.2922 308.392 55.8035 286.366 51.4103C264.341 47.0172 245.606 44.1934 181.911 40.9756C118.215 37.7579 138.966 43.5125 129.849 43.7033C122.556 43.8559 113.044 50.082 109.2 53.176L124.454 66.084L124.909 87.7963Z";

const aiGlowVariants = cva("pointer-events-none absolute", {
  variants: {
    variant: {
      // Soft oblong blob behind a single card.
      card: "-inset-x-4 -inset-y-3 opacity-70 blur-xl dark:opacity-60",
      // Wider amorphous wash behind a group of cards; bleeds past the edges.
      group: "-inset-y-14 -left-40 -right-44",
    },
  },
  defaultVariants: {
    variant: "card",
  },
});

interface AiGlowProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof aiGlowVariants> {}

/**
 * A decorative AI glow that sits behind a card or a group of cards. Render it as
 * the first child of a `relative` parent, with the content layered above it in a
 * `relative` wrapper:
 *
 * ```tsx
 * <div className="relative">
 *   <AiGlow />
 *   <div className="relative">{card}</div>
 * </div>
 * ```
 *
 * The `card` variant is a blurred gradient blob; the `group` variant is a wider,
 * organic SVG wash. The element is `aria-hidden` and ignores pointer events.
 */
function AiGlow({ variant = "card", className, style, ...props }: AiGlowProps) {
  const blurId = useId();
  const gradientId = useId();
  const clipId = useId();

  if (variant === "group") {
    return (
      <div
        data-slot="ai-glow"
        data-variant="group"
        aria-hidden="true"
        className={cn(aiGlowVariants({ variant }), className)}
        style={{ transform: "rotate(-6deg)", ...style }}
        {...props}
      >
        <svg
          viewBox="0 0 561 176"
          preserveAspectRatio="none"
          className="h-full w-full overflow-visible dark:opacity-60"
          aria-hidden="true"
        >
          <defs>
            <filter id={blurId} x="-60%" y="-120%" width="220%" height="340%">
              <feGaussianBlur stdDeviation="20" />
            </filter>
            <linearGradient
              id={gradientId}
              gradientUnits="userSpaceOnUse"
              x1="40"
              y1="88"
              x2="520"
              y2="88"
            >
              <stop stopColor="var(--ai-glow-start)" stopOpacity="1" />
              <stop
                offset="1"
                stopColor="var(--ai-glow-end)"
                stopOpacity="0.25"
              />
            </linearGradient>
            <clipPath id={clipId}>
              <path transform="translate(561 0) scale(-1 1)" d={GROUP_BLOB} />
            </clipPath>
          </defs>
          <g filter={`url(#${blurId})`}>
            <rect
              width="561"
              height="176"
              fill={`url(#${gradientId})`}
              fillOpacity="1"
              clipPath={`url(#${clipId})`}
            />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div
      data-slot="ai-glow"
      data-variant="card"
      aria-hidden="true"
      className={cn(aiGlowVariants({ variant }), className)}
      style={{
        backgroundImage:
          "linear-gradient(120deg, var(--ai-glow-start), var(--ai-glow-end))",
        borderRadius: "40% 60% 38% 62% / 42% 58% 42% 58%",
        transform: "rotate(-4deg)",
        ...style,
      }}
      {...props}
    />
  );
}

export { AiGlow, aiGlowVariants };
export type { AiGlowProps };
