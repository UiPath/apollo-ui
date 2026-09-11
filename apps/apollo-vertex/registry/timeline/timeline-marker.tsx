import { Check, CircleAlert, UserCheck } from "lucide-react";
import type { ReactNode } from "react";
import { AiMark } from "@/components/ui/ai-mark";
import { cn } from "@/lib/utils";

export type TimelineMarkerVariant =
  | "user"
  | "completed-user"
  | "completed-ai"
  | "ai-upcoming"
  | "ai-suspended"
  | "ai-progress"
  | "ai-failed"
  | "ai-cancelled"
  | "ai-complete";

export interface TimelineMarkerProps {
  variant: TimelineMarkerVariant;
  initials?: string;
  compact?: boolean;
}

function MarkerCircle({
  compact,
  className,
  children,
}: {
  compact: boolean;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        compact ? "size-4" : "size-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

// oxlint-disable-next-line complexity consistent-return -- switch is exhaustive over TimelineMarkerVariant
export function TimelineMarker({
  variant,
  initials,
  compact = false,
}: TimelineMarkerProps) {
  const markSize = compact ? 9 : 14;

  switch (variant) {
    case "completed-ai":
    case "completed-user":
      return (
        <MarkerCircle
          compact={compact}
          className="bg-success/10 text-success shadow-sm"
        >
          {variant === "completed-ai" ? (
            <AiMark size={markSize} variant="gradient" />
          ) : (
            <UserCheck className={compact ? "size-3" : "size-4"} />
          )}
        </MarkerCircle>
      );

    case "user":
      return (
        <MarkerCircle
          compact={compact}
          className={cn(
            "bg-muted font-medium text-muted-foreground shadow-sm",
            compact ? "text-[9px]" : "text-xs",
          )}
        >
          {initials ?? "?"}
        </MarkerCircle>
      );

    case "ai-upcoming":
    case "ai-suspended":
      return (
        <MarkerCircle
          compact={compact}
          className={cn(
            "border-2 border-insight-400/80 bg-background",
            variant === "ai-upcoming" && "border-dotted",
          )}
        >
          <AiMark size={markSize} variant="gradient" />
        </MarkerCircle>
      );

    case "ai-progress":
      return (
        <MarkerCircle
          compact={compact}
          className="relative overflow-hidden bg-insight-700/25 p-0.5 shadow-sm"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full motion-reduce:animate-none"
            style={{
              background:
                "conic-gradient(from 0deg, var(--ai-gradient-end) 0deg, var(--ai-gradient-start) 72deg, var(--insight-700) 150deg, transparent 220deg, var(--ai-gradient-end) 360deg)",
            }}
          />
          <div className="relative grid size-full place-items-center rounded-full bg-background">
            <AiMark size={markSize} variant="gradient" />
          </div>
        </MarkerCircle>
      );

    case "ai-failed":
      return (
        <MarkerCircle
          compact={compact}
          className="bg-destructive text-destructive-foreground shadow-sm"
        >
          {compact ? (
            <CircleAlert className="size-3" />
          ) : (
            <AiMark size={markSize} variant="solid" />
          )}
        </MarkerCircle>
      );

    case "ai-cancelled":
      return (
        <MarkerCircle
          compact={compact}
          className="bg-muted text-muted-foreground shadow-sm"
        >
          <AiMark size={markSize} variant="solid" />
        </MarkerCircle>
      );

    case "ai-complete":
      return compact ? (
        <MarkerCircle
          compact
          className="text-foreground shadow-sm [background-image:var(--ai-gradient)]"
        >
          <Check className="size-3" />
        </MarkerCircle>
      ) : (
        <MarkerCircle
          compact={false}
          className="text-white shadow-sm [background-image:var(--ai-gradient-strong)]"
        >
          <AiMark size={markSize} variant="solid" />
        </MarkerCircle>
      );
  }
}
