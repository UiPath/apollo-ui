"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** A page header's subtitle, capped to the title block's own max-width by
 * the caller (a plain CSS `max-w-*` on the surrounding `PageHeaderTitleGroup`
 * does the actual capping — this component only reacts to it). Wrapped in
 * the registry Tooltip only once it's actually truncated — measured after
 * layout, not assumed from string length, since the same text can fit at
 * one width and not another. A tooltip on text that already fits would
 * just repeat what's already visible, so it stays absent until truncation
 * is confirmed. Shared by the requester's and the approver's own page
 * headers so the truncation rule can't drift between them. */
export function TruncatedSubtitle({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    setIsTruncated(el != null && el.scrollWidth > el.clientWidth);
  }, [text]);

  const subtitle = (
    <p ref={ref} className="truncate text-xs text-muted-foreground">
      {text}
    </p>
  );

  if (!isTruncated) return subtitle;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{subtitle}</TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}
