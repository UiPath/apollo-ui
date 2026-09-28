import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TimelineRowLayoutProps {
  isLast: boolean;
  marker: ReactNode;
  children: ReactNode;
  compact?: boolean;
}

export function TimelineRowLayout({
  isLast,
  marker,
  children,
  compact = false,
}: TimelineRowLayoutProps) {
  const showConnector = !compact || !isLast;
  const fadesOut = !compact && isLast;
  const connectorClassName = fadesOut
    ? "mt-1 min-h-12 w-px flex-1 bg-gradient-to-b from-border to-transparent"
    : "my-1 w-px flex-1 bg-border";

  return (
    <div className={cn("flex", compact ? "gap-2" : "gap-4")}>
      <div className={cn("flex flex-col items-center", !compact && "w-7")}>
        {marker}
        {showConnector && (
          <span className={connectorClassName} aria-hidden="true" />
        )}
      </div>
      {children}
    </div>
  );
}
