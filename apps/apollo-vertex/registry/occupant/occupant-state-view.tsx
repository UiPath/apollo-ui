import { CircleAlert, Inbox } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineMarker } from "@/components/ui/timeline";
import { useSurface } from "@/lib/surface-context";
import { cn } from "@/lib/utils";
import type { OccupantState } from "./occupant-states";

interface OccupantStateViewProps {
  state: OccupantState;
  /** What the occupant shows, translated and in lowercase: "activity". */
  subject: string;
  /** The empty state's message, translated. */
  emptyDescription: string;
  /** Loading placeholders shaped like the content. Defaults to three rows. */
  skeleton?: ReactNode;
  /** Shows a Retry button in the error state. */
  onRetry?: () => void;
  /**
   * For a flush occupant, which pads its own parts: gives the messages and
   * the agent line the surface inset, and leaves the content edge to edge.
   */
  flush?: boolean;
  /** The content, shown when ready and while an agent updates it. */
  children: ReactNode;
}

function DefaultSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

/**
 * One view for the standard occupant states. It adapts to the surface's
 * orientation, never its name: messages stack in a vertical surface and sit
 * in one row in a horizontal one. It adds no outer padding.
 */
function OccupantStateView({
  state,
  subject,
  emptyDescription,
  skeleton,
  onRetry,
  flush = false,
  children,
}: OccupantStateViewProps) {
  const { t } = useTranslation();
  const { orientation } = useSurface();
  const inset = flush && "p-(--surface-inset)";
  const message = cn(
    "flex min-w-0 gap-3 text-sm wrap-anywhere",
    inset,
    orientation === "horizontal"
      ? "items-center"
      : "flex-1 flex-col items-center justify-center py-6 text-center",
  );

  switch (state) {
    case "ready":
      return children;
    case "loading":
      return (
        <div
          role="status"
          aria-label={t("occupant_loading", { subject })}
          aria-busy="true"
          className={cn(inset)}
        >
          {skeleton ?? <DefaultSkeleton />}
        </div>
      );
    case "empty":
      return (
        <div data-occupant-state="empty" className={message}>
          <Inbox
            className="size-5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-medium text-foreground">
              {t("occupant_empty_title", { subject })}
            </p>
            <p className="text-xs text-muted-foreground">{emptyDescription}</p>
          </div>
        </div>
      );
    case "error":
      return (
        <div data-occupant-state="error" role="alert" className={message}>
          <CircleAlert
            className="size-5 shrink-0 text-destructive"
            aria-hidden
          />
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="font-medium text-foreground">
              {t("occupant_error_title", { subject })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("occupant_error_description")}
            </p>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              {t("retry")}
            </Button>
          )}
        </div>
      );
    case "agent-updating":
      return (
        <div
          data-occupant-state="agent-updating"
          className="flex min-h-0 flex-1 flex-col gap-4"
        >
          <div
            role="status"
            className={cn(
              "flex items-center gap-2 text-xs text-muted-foreground",
              flush && "px-(--surface-inset) pt-(--surface-inset)",
            )}
          >
            <span aria-hidden className="shrink-0">
              <TimelineMarker variant="ai-progress" compact />
            </span>
            {t("occupant_agent_updating", { subject })}
          </div>
          <div aria-busy="true" className="flex min-h-0 flex-1 flex-col">
            {children}
          </div>
        </div>
      );
  }
}

export { OccupantStateView };
export type { OccupantStateViewProps };
