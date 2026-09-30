import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/** How a status reads: its dot's color. Never the only signal: the label says it. */
export type OccupantTone = "neutral" | "info" | "success" | "warning" | "error";

/** A status in a view model: its label, tone, and how many more it has. */
export interface OccupantStatusValue {
  label: string;
  tone: OccupantTone;
  /** How many more statuses the item has, shown as "+2". */
  more?: number;
}

const DOT: Record<OccupantTone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-destructive",
};

interface OccupantStatusProps {
  status: OccupantStatusValue;
  className?: string;
}

/**
 * A status: a colored dot, its label, and a count of any more. The label
 * wraps; the dot stays on its first line and the count follows its text.
 */
function OccupantStatus({ status, className }: OccupantStatusProps) {
  const { t } = useTranslation();
  return (
    <span
      data-slot="occupant-status"
      className={cn(
        "flex min-w-0 items-baseline gap-2 text-sm text-muted-foreground",
        className,
      )}
    >
      {/* A line tall, so the dot sits on the label's first line when it wraps. */}
      <span className="flex h-[1lh] shrink-0 items-center self-start">
        <span className={cn("size-2 rounded-full", DOT[status.tone])} />
      </span>
      <span className="min-w-0 wrap-anywhere">
        {status.label}
        {/* Inline, so the count follows the label's last word when it wraps. */}
        {status.more ? (
          <span className="ms-2 whitespace-nowrap">
            <span aria-hidden="true">
              {t("occupant_more_short", { count: status.more })}
            </span>
            <span className="sr-only">
              {t("occupant_more", { count: status.more })}
            </span>
          </span>
        ) : null}
      </span>
    </span>
  );
}

export { OccupantStatus };
export type { OccupantStatusProps };
