import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DetailPageProps
  extends Omit<ComponentProps<"div">, "children"> {
  /** Fill with the page-header surface. */
  header: ReactNode;
  /** Fill with a side-panel surface (side="start"). */
  startPanel?: ReactNode;
  /** Fill with the content-area surface. */
  main: ReactNode;
  /** Fill with a side-panel surface (side="end"). */
  endPanel?: ReactNode;
}

/**
 * Detail page frame. A 3x2 grid: the header spans the top row, and the
 * start panel, main, and end panel share the row below. Empty panel slots
 * are not rendered, so their `auto` columns collapse to zero.
 *
 * The frame draws the dividers between slots as real borders on the slot
 * wrappers, so they survive forced-colors mode. Surfaces draw no outer
 * borders, which keeps their inner widths exact.
 *
 * Slots are placed by explicit row and column so later placement settings
 * (e.g. a start panel running beside the header) only need to change the
 * spans, not the markup.
 */
export function DetailPage({
  header,
  startPanel,
  main,
  endPanel,
  className,
  ...props
}: DetailPageProps) {
  return (
    <div
      data-template="detail-page"
      className={cn(
        "relative z-10 grid h-full min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)]",
        className,
      )}
      {...props}
    >
      <div
        data-slot="detail-page-header"
        className="col-span-3 col-start-1 row-start-1 min-w-0 border-b border-border"
      >
        {header}
      </div>
      {startPanel && (
        <div
          data-slot="detail-page-start-panel"
          className="col-start-1 row-start-2 min-h-0 border-e border-border"
        >
          {startPanel}
        </div>
      )}
      <div
        data-slot="detail-page-main"
        className="col-start-2 row-start-2 min-h-0 min-w-0"
      >
        {main}
      </div>
      {endPanel && (
        <div
          data-slot="detail-page-end-panel"
          className="col-start-3 row-start-2 min-h-0 border-s border-border"
        >
          {endPanel}
        </div>
      )}
    </div>
  );
}
