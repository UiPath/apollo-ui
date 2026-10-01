import type { OccupantSpec } from "@/lib/composition";
import { occupantPadding } from "@/lib/composition";
import { useSurface } from "@/lib/surface-context";
import { cn } from "@/lib/utils";

const LONG_ROWS = 40;

interface SlotPlaceholderProps {
  occupant: OccupantSpec;
  /** The surface this placeholder sits in, shown as a hint. */
  surface: string;
  /** Fill with enough rows to scroll. */
  long?: boolean;
  className?: string;
}

/**
 * Preview-only stand-in for an occupant. It fills the surface's inner area
 * and adds no outer padding, so the surface's padding is what you see.
 *
 * With long content it grows past the surface. If the occupant owns
 * scrolling (requires.scroll "occupant"), it is its own scroll container
 * with a sticky label row, like a table with a sticky header, and draws no
 * fades; otherwise the surface scrolls and fades it.
 */
export function SlotPlaceholder({
  occupant,
  surface,
  long = false,
  className,
}: SlotPlaceholderProps) {
  const ownsScroll = occupant.requires.scroll === "occupant";
  const space = useSurface();
  const hints = (
    <>
      <span className="text-sm font-medium text-foreground">
        {occupant.label}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {`data-surface="${surface}"`}
      </span>
      <span className="font-mono text-xs text-muted-foreground">
        {`data-padding="${occupantPadding(occupant)}"`}
      </span>
      <span
        data-slot="placeholder-space"
        className="font-mono text-xs text-muted-foreground"
      >
        {`${space.orientation}, ${space.width ?? "?"}px`}
      </span>
    </>
  );

  if (!long) {
    return (
      <div
        data-occupant={occupant.name}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/40 text-center",
          // A band across the page header's grid, not a column.
          surface === "page-header" &&
            "col-span-full min-h-11 flex-row gap-3 self-stretch",
          className,
        )}
      >
        {hints}
      </div>
    );
  }

  return (
    <div
      data-occupant={occupant.name}
      data-content="long"
      className={cn(
        "flex flex-col rounded-md border border-dashed border-border bg-muted/40",
        ownsScroll ? "min-h-0 flex-1 overflow-y-auto" : "flex-none",
        className,
      )}
    >
      <div
        data-slot="placeholder-label"
        className={cn(
          "flex flex-col items-center gap-1 border-b border-dashed border-border px-3 py-3 text-center",
          ownsScroll && "sticky top-0 bg-muted",
        )}
      >
        {hints}
        <span className="font-mono text-xs text-muted-foreground">
          {`scroll: ${ownsScroll ? "occupant" : "surface"}`}
        </span>
      </div>
      {Array.from({ length: LONG_ROWS }, (_, index) => (
        <div
          // Static rows; the index is the identity.
          // oxlint-disable-next-line react/no-array-index-key
          key={index}
          data-slot="placeholder-row"
          className="border-b border-dashed border-border px-3 py-2 text-sm text-foreground last:border-b-0"
        >
          {`Row ${index + 1}`}
        </div>
      ))}
    </div>
  );
}
