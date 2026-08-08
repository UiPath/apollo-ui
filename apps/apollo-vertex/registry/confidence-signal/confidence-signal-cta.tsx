"use client";

import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ConfidenceCta } from "./confidence-signal-levels";

/**
 * Renders a confidence CTA. With `href` it is an anchor so the target is
 * navigable, middle-clickable, and copyable; without one it falls back to a
 * plain button driven by `onClick`.
 */
function ConfidenceSignalCta({
  cta,
  className,
}: {
  cta: ConfidenceCta;
  className?: string;
}) {
  const content = (
    <>
      {cta.label}
      <ArrowUpRight className="size-3" />
    </>
  );

  if (cta.href) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className={cn("w-full", className)}
      >
        <a href={cta.href} onClick={cta.onClick}>
          {content}
        </a>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("w-full", className)}
      onClick={cta.onClick}
    >
      {content}
    </Button>
  );
}

export { ConfidenceSignalCta };
