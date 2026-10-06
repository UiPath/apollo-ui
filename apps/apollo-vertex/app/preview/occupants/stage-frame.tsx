"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface StageFrameProps extends ComponentProps<"div"> {
  /** The frame's name, like an artboard's: "Side panel · 288px". */
  tag: string;
}

/**
 * The page's ground under what's on the stage: no border, the card's
 * radius, and a faint lift off the recessed canvas, so it reads as the
 * thing on the bench. Its content is clipped to the rounded corners, the
 * Shell's sidebar included; clipping moves nothing, so every measured
 * width stays the same. Its tag sits above its top-left corner, outside
 * the clip, never over it. The tag is decorative: the dock and the
 * slider's value text say the same.
 */
export function StageFrame({
  tag,
  className,
  children,
  ...props
}: StageFrameProps) {
  return (
    <div
      data-slot="workbench-frame"
      className={cn("relative rounded-xl shadow-sm", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="workbench-frame-tag"
        className="pointer-events-none absolute start-0 bottom-full mb-1.5 whitespace-nowrap text-xs text-muted-foreground select-none"
      >
        {tag}
      </span>
      <div
        data-slot="workbench-frame-clip"
        className="relative h-full w-full overflow-hidden rounded-xl bg-background"
      >
        {children}
      </div>
    </div>
  );
}
