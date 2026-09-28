"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { SidePanelOpenContext } from "@/components/ui/side-panel";
import { cn } from "@/lib/utils";
import {
  DIVIDER_PX,
  detailPageTemplate,
  enabledPanels,
  MAIN_MIN_OUTER_PX,
  SIDE_PANEL_OUTER_PX,
} from "./detail-page.template";
import { PanelResizeHandle } from "./PanelResizeHandle";
import type { DetailPageState } from "./use-detail-page";

const endPanelResizable =
  detailPageTemplate.slots.find((slot) => slot.name === "end-panel")
    ?.resizable === true;

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
 *
 * The end panel is resizable. The frame sets its width through the
 * --detail-page-end-width custom property, which overrides the side
 * panel's own width variable, and turns its divider into a resize handle.
 * The side panel surface itself doesn't change.
 *
 * A "max" end width is laid out by the grid, not in px: main and the end
 * panel become equal 1fr tracks, with main's track minimum at 480px
 * (capped so the end panel keeps its own minimum). That is the 50/50 split
 * with main's floor, correct before the template is ever measured.
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
  const { config, open, ref, endWidth, endWidthRange } = state;
  const enabled = enabledPanels(config.panels);
  const hasStart = enabled.start && Boolean(startPanel);
  const hasEnd = enabled.end && Boolean(endPanel);
  const startBeside = hasStart && config.start.placement === "beside-header";
  const endBeside = hasEnd && config.end.placement === "beside-header";

  const endSlotMinPx = SIDE_PANEL_OUTER_PX + DIVIDER_PX;
  const endAtMax = hasEnd && open.end && state.endWidthChosen === "max";
  const startOpenPx = hasStart && open.start ? endSlotMinPx : 0;
  const mainTrack = endAtMax
    ? `minmax(min(${MAIN_MIN_OUTER_PX}px, calc(100% - ${startOpenPx + endSlotMinPx}px)), 1fr)`
    : "minmax(0, 1fr)";
  const endTrack = endAtMax ? `minmax(${endSlotMinPx}px, 1fr)` : "auto";
  const templateStyle: CSSProperties & Record<"--detail-page-columns", string> =
    { "--detail-page-columns": `auto ${mainTrack} ${endTrack}` };
  const endWidthStyle: CSSProperties &
    Record<"--detail-page-end-width", string> = {
    "--detail-page-end-width": endAtMax ? "100%" : `${endWidth}px`,
  };

  return (
    <div
      ref={ref}
      data-template="detail-page"
      style={templateStyle}
      className={cn(
        "relative z-10 grid h-full min-h-0 flex-1 grid-cols-(--detail-page-columns) grid-rows-[auto_minmax(0,1fr)]",
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
            "relative col-start-3 min-h-0 border-s border-border data-[state=closed]:hidden",
            "[&>[data-surface=side-panel]]:[--side-panel-width:var(--detail-page-end-width)]",
            endBeside ? "row-span-2 row-start-1" : "row-start-2",
          )}
          style={endWidthStyle}
        >
          {/* Only once measured, so the handle never reports a guessed range. */}
          {endPanelResizable && open.end && state.measured && (
            <PanelResizeHandle
              label="Resize end panel"
              value={endWidth}
              min={endWidthRange.min}
              max={endWidthRange.max}
              onResize={state.setEndWidth}
              onReset={state.resetEndWidth}
            />
          )}
          <SidePanelOpenContext.Provider value={open.end}>
            {endPanel}
          </SidePanelOpenContext.Provider>
        </div>
      )}
    </div>
  );
}
