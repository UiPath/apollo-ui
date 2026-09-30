"use client";

import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

interface StageFrameProps extends ComponentProps<"div"> {
  /** The frame's name, like an artboard's: "Side panel · 288px". */
  tag: string;
}

/**
 * The page's ground under what's on the stage, with its edge drawn, and its
 * tag above its top-left corner, never over it. The tag is decorative: the
 * dock and the slider's value text say the same.
 */
export function StageFrame({
  tag,
  className,
  children,
  ...props
}: StageFrameProps) {
  return (
    <div
      data-workbench-frame
      className={cn(
        "relative bg-background outline-1 outline-border",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-workbench-frame-tag
        className="pointer-events-none absolute start-0 bottom-full mb-1.5 whitespace-nowrap text-xs text-muted-foreground select-none"
      >
        {tag}
      </span>
      {children}
    </div>
  );
}
