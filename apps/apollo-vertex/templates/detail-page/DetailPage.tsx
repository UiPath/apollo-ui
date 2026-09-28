"use client";

import type { ComponentProps, ReactNode } from "react";
import { SidePanelOpenContext } from "@/components/ui/side-panel";
import { cn } from "@/lib/utils";
import { enabledPanels } from "./detail-page.template";
import type { DetailPageState } from "./use-detail-page";

export interface DetailPageProps
  extends Omit<ComponentProps<"div">, "children" | "ref"> {
  /** From `useDetailPage(config)`. Carries the config and open state. */
  state: DetailPageState;
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
 * Detail page frame. A 3x2 grid: columns are start panel, main, end panel;
 * rows are header, body. By default the header spans all three columns and
 * the panels sit in the body row. A "beside-header" panel spans both rows
 * instead and the header starts or ends one column in. Only the spans
 * change, never the markup.
 *
 * The frame draws the dividers between slots as real borders on the slot
 * wrappers, so they survive forced-colors mode and follow the layout.
 * Surfaces draw no outer borders, which keeps their inner widths exact.
 *
 * Panels that are disabled or have no content are not rendered. Closed
 * panels stay mounted but are hidden, so they and their dividers take no
 * space and their `auto` columns collapse to zero.
 */
export function DetailPage({
  state,
  header,
  startPanel,
  main,
  endPanel,
  className,
  ...props
}: DetailPageProps) {
  const { config, open, ref } = state;
  const enabled = enabledPanels(config.panels);
  const hasStart = enabled.start && Boolean(startPanel);
  const hasEnd = enabled.end && Boolean(endPanel);
  const startBeside = hasStart && config.start.placement === "beside-header";
  const endBeside = hasEnd && config.end.placement === "beside-header";

  return (
    <div
      ref={ref}
      data-template="detail-page"
      className={cn(
        "relative z-10 grid h-full min-h-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] grid-rows-[auto_minmax(0,1fr)]",
        className,
      )}
      {...props}
    >
      <div
        data-slot="detail-page-header"
        className={cn(
          "row-start-1 min-w-0 border-b border-border",
          startBeside ? "col-start-2" : "col-start-1",
          endBeside ? "col-end-3" : "col-end-4",
        )}
      >
        {header}
      </div>
      {hasStart && (
        <div
          data-slot="detail-page-start-panel"
          data-state={open.start ? "open" : "closed"}
          className={cn(
            "col-start-1 min-h-0 border-e border-border data-[state=closed]:hidden",
            startBeside ? "row-span-2 row-start-1" : "row-start-2",
          )}
        >
          <SidePanelOpenContext.Provider value={open.start}>
            {startPanel}
          </SidePanelOpenContext.Provider>
        </div>
      )}
      <div
        data-slot="detail-page-main"
        className="col-start-2 row-start-2 min-h-0 min-w-0"
      >
        {main}
      </div>
      {hasEnd && (
        <div
          data-slot="detail-page-end-panel"
          data-state={open.end ? "open" : "closed"}
          className={cn(
            "col-start-3 min-h-0 border-s border-border data-[state=closed]:hidden",
            endBeside ? "row-span-2 row-start-1" : "row-start-2",
          )}
        >
          <SidePanelOpenContext.Provider value={open.end}>
            {endPanel}
          </SidePanelOpenContext.Provider>
        </div>
      )}
    </div>
  );
}
