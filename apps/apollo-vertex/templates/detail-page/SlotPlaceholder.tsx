import { cn } from "@/lib/utils";

interface SlotPlaceholderProps {
  label: string;
  /** The surface this placeholder sits in, shown as a hint. */
  surface: string;
  className?: string;
}

/** Preview-only stand-in for an occupant. */
export function SlotPlaceholder({
  label,
  surface,
  className,
}: SlotPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 p-4 text-center",
        className,
      )}
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="font-mono text-xs text-muted-foreground">
        {`data-surface="${surface}"`}
      </span>
    </div>
  );
}
