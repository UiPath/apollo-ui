"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { SidePanelSlotContext } from "@/components/ui/side-panel";
import { cn } from "@/lib/utils";
import {
  detailPageTemplate,
  enabledPanels,
  END_PANEL_MIN_PX,
  END_PANEL_WIDTH,
  MAIN_MIN_OUTER_PX,
  START_PANEL_PX,
  START_PANEL_WIDTH,
} from "./detail-page.template";
import { PanelResizeHandle } from "./PanelResizeHandle";
import type { DetailPageState } from "./use-detail-page";

/*
 * Slot dividers match the Shell sidebar's edge: an inset box-shadow in
 * --divider on a pointer-events-none overlay (::after), so they take no
 * layout space. --slot-divider-width is the line's thickness. Box-shadows
 * are dropped in forced-colors mode, so there the overlay draws a real 1px
 * border in CanvasText instead, still without taking layout space.
 */
const DIVIDER_OVERLAY =
  "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:content-[''] forced-colors:after:shadow-none forced-colors:after:border-[CanvasText]";
const DIVIDER_BOTTOM =
  "after:shadow-[inset_0_calc(-1*var(--slot-divider-width))_0_0_var(--divider)] forced-colors:after:border-b";
// box-shadow offsets are physical, so the inline-edge dividers flip in RTL.
const DIVIDER_INLINE_END =
  "after:shadow-[inset_calc(-1*var(--slot-divider-width))_0_0_0_var(--divider)] rtl:after:shadow-[inset_var(--slot-divider-width)_0_0_0_var(--divider)] forced-colors:after:border-e";
const DIVIDER_INLINE_START =
  "after:shadow-[inset_var(--slot-divider-width)_0_0_0_var(--divider)] rtl:after:shadow-[inset_calc(-1*var(--slot-divider-width))_0_0_0_var(--divider)] forced-colors:after:border-s";

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
 * The frame draws the dividers between slots as overlays on the slot
 * wrappers (see DIVIDER_OVERLAY), so they follow the layout and take no
 * space: panels are exactly their width. Surfaces draw no outer borders.
 *
 * Panels that are disabled or have no content are not rendered. Closed
 * panels stay mounted but are hidden, so they and their dividers take no
 * space and their `auto` columns collapse to zero.
 *
 * The start panel renders at START_PANEL_WIDTH.default through the
 * --detail-page-start-panel-width variable. The end panel is resizable. The frame sets its width through the
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

  const endSlotMinPx = END_PANEL_MIN_PX;
  const endAtMax = hasEnd && open.end && state.endWidthChosen === "max";
  const startOpenPx = hasStart && open.start ? START_PANEL_PX : 0;
  const mainTrack = endAtMax
    ? `minmax(min(${MAIN_MIN_OUTER_PX}px, calc(100% - ${startOpenPx + endSlotMinPx}px)), 1fr)`
    : "minmax(0, 1fr)";
  const endTrack = endAtMax ? `minmax(${endSlotMinPx}px, 1fr)` : "auto";
  // The Detail page's own widths, from its spec, as CSS variables on the
  // template root: one source for CSS and TypeScript.
  const templateStyle: CSSProperties &
    Record<`--detail-page-${string}`, string> = {
    "--detail-page-start-panel-width": `${START_PANEL_WIDTH.default}px`,
    "--detail-page-start-panel-width-min": `${START_PANEL_WIDTH.min}px`,
    "--detail-page-start-panel-width-max": `${START_PANEL_WIDTH.max}px`,
    "--detail-page-end-panel-width": `${END_PANEL_WIDTH.default}px`,
    "--detail-page-end-panel-width-min": `${END_PANEL_WIDTH.min}px`,
    "--detail-page-main-width-min": `${MAIN_MIN_OUTER_PX}px`,
    "--detail-page-columns": `auto ${mainTrack} ${endTrack}`,
  };
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
          "relative row-start-1 min-w-0",
          DIVIDER_OVERLAY,
          DIVIDER_BOTTOM,
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
            "relative col-start-1 min-h-0 data-[state=closed]:hidden",
            DIVIDER_OVERLAY,
            DIVIDER_INLINE_END,
            "[&>[data-surface=side-panel]]:[--side-panel-width:var(--detail-page-start-panel-width)]",
            startBeside ? "row-span-2 row-start-1" : "row-start-2",
          )}
        >
          <SidePanelSlotContext.Provider
            value={{ open: open.start, placement: config.start.placement }}
          >
            {startPanel}
          </SidePanelSlotContext.Provider>
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
            "relative col-start-3 min-h-0 data-[state=closed]:hidden",
            DIVIDER_OVERLAY,
            DIVIDER_INLINE_START,
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
          <SidePanelSlotContext.Provider
            value={{ open: open.end, placement: config.end.placement }}
          >
            {endPanel}
          </SidePanelSlotContext.Provider>
        </div>
      )}
    </div>
  );
}
