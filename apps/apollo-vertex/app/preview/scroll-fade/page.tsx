"use client";

import {
  SCROLL_FADE_MASK,
  SCROLL_FADE_MASK_BOTH,
  SCROLL_FADE_MASK_X,
  type ScrollFadeAxis,
  useScrollFade,
} from "@/hooks/use-scroll-fade";
import { cn } from "@/lib/utils";

const MASKS: Record<ScrollFadeAxis, string> = {
  y: SCROLL_FADE_MASK,
  x: SCROLL_FADE_MASK_X,
  both: SCROLL_FADE_MASK_BOTH,
};

// Content sizes that scroll on the box's axis only.
const CONTENT: Record<ScrollFadeAxis, string> = {
  y: "h-[900px] w-full",
  x: "h-full w-[900px]",
  both: "h-[900px] w-[900px]",
};

interface ScrollBoxProps {
  axis: ScrollFadeAxis;
}

/** A scroll container with solid content, so its fades show at each edge. */
function ScrollBox({ axis }: ScrollBoxProps) {
  const ref = useScrollFade<HTMLDivElement>(true, null, { axis });
  return (
    <div
      ref={ref}
      data-axis={axis}
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scroll region must be keyboard scrollable
      tabIndex={0}
      aria-label={`Scrolls on ${axis}`}
      className={cn("size-48 shrink-0 overflow-auto", MASKS[axis])}
    >
      <div className={cn("bg-primary", CONTENT[axis])} />
    </div>
  );
}

/** Preview only: scroll fades on each axis, for the browser tests. */
export default function ScrollFadePreview() {
  return (
    <div className="fixed inset-0 z-50 flex gap-8 bg-background p-8 not-prose">
      <ScrollBox axis="y" />
      <ScrollBox axis="x" />
      <ScrollBox axis="both" />
    </div>
  );
}
