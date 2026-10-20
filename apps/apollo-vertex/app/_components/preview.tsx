import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bordered frame around a live example in the docs. Pass layout classes
 * (flex, gap, max-width, ...) through `className`.
 */
export function Preview({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("not-prose mt-4 rounded-lg border p-4", className)}>
      {children}
    </div>
  );
}
