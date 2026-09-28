import type { OccupantSpec } from "@/lib/composition";
import { occupantPadding } from "@/lib/composition";
import { cn } from "@/lib/utils";

interface SlotPlaceholderProps {
  occupant: OccupantSpec;
  /** The surface this placeholder sits in, shown as a hint. */
  surface: string;
  className?: string;
}

/**
 * Preview-only stand-in for an occupant. It fills the surface's inner area
 * and adds no outer padding, so the surface's padding is what you see.
 */
export function SlotPlaceholder({
  occupant,
  surface,
  className,
}: SlotPlaceholderProps) {
  return (
    <div
      data-occupant={occupant.name}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 text-center",
        className,
      )}
    >
      <span className="text-sm font-medium text-foreground">
        {occupant.label}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {`data-surface="${surface}"`}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {`data-padding="${occupantPadding(occupant)}"`}
      </span>
    </div>
  );
}
