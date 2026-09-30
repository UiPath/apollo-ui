"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type TransitionEvent,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { SidePanelSlotContext } from "@/components/ui/side-panel";
import { cn } from "@/lib/utils";
import {
  detailPageTemplate,
  END_PANEL_MIN_PX,
  enabledPanels,
  MAIN_MIN_OUTER_PX,
  START_PANEL_PX,
  START_PANEL_WIDTH,
} from "./detail-page.template";
import { PanelResizeHandle } from "./PanelResizeHandle";
import type { DetailPageState } from "./use-detail-page";

/*
 * Slot dividers: an inset box-shadow on an overlay, so they take no layout
 * space. Forced colors drops shadows, so there the overlay draws a border.
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

/*
 * Open and close: the panel's clip box animates its width with the panel
 * transition tokens, for user-driven opens and closes only. Reduced motion
 * turns it off.
 */
const PANEL_CLIP_MOTION = [
  "data-[transitioning=true]:[transition-property:width]",
  "data-[transitioning=true]:[transition-duration:var(--panel-transition-duration)]",
  "data-[transitioning=true]:[transition-timing-function:var(--panel-transition-easing)]",
  "motion-reduce:transition-none!",
].join(" ");
// A closed panel's slot hides once its close has finished animating.
const PANEL_SLOT_MOTION = [
  "data-[state=closed]:invisible",
  "data-[transitioning=true]:[transition-property:visibility]",
  "data-[transitioning=true]:data-[state=closed]:[transition-delay:var(--panel-transition-duration)]",
  "motion-reduce:transition-none!",
].join(" ");

/** Fallback for a transition that never reports its end, in ms. */
function transitionFallbackMs(element: Element | null): number {
  const value = element
    ? getComputedStyle(element).getPropertyValue("--panel-transition-duration")
    : "";
  const ms = Number.parseFloat(value);
  return (Number.isFinite(ms) ? ms : 350) + 150;
}

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
 * Detail page frame: a grid of start panel, main, and end panel columns,
 * under a header row. A beside-header panel spans both rows and the header
 * moves over; only the spans change, never the markup. Closed panels stay
 * mounted, 0 wide, inert, and invisible.
 *
 * A "max" end width is laid out by the grid: main and the end panel become
 * equal tracks, with main's floor, correct before the template is measured.
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
  const { t } = useTranslation();
  const { config, open, ref, endWidth, endWidthRange } = state;
  const enabled = enabledPanels(config.panels);
  const hasStart = enabled.start && Boolean(startPanel);
  const hasEnd = enabled.end && Boolean(endPanel);
  const startBeside = hasStart && config.start.placement === "beside-header";
  const endBeside = hasEnd && config.end.placement === "beside-header";

  // Before measurement, a "max" end width is laid out by the grid. Once
  // measured, its px value is the same, and px can animate.
  const endAtMax =
    hasEnd && open.end && state.endWidthChosen === "max" && !state.measured;
  const startOpenPx = hasStart && open.start ? START_PANEL_PX : 0;
  const mainTrack = endAtMax
    ? `minmax(min(${MAIN_MIN_OUTER_PX}px, calc(100% - ${startOpenPx + END_PANEL_MIN_PX}px)), 1fr)`
    : "minmax(0, 1fr)";
  const endTrack = endAtMax ? `minmax(${END_PANEL_MIN_PX}px, 1fr)` : "auto";
  // The Detail page's own widths, from its spec, as CSS variables on the
  // template root: one source for CSS and TypeScript.
  const templateStyle: CSSProperties &
    Record<`--detail-page-${string}`, string> = {
    "--detail-page-start-panel-width": `${START_PANEL_WIDTH.default}px`,
    "--detail-page-columns": `auto ${mainTrack} ${endTrack}`,
  };
  // Each panel's clip box width: its width when open, 0 when closed.
  const startExtentStyle: CSSProperties &
    Record<"--detail-page-panel-extent", string> = {
    "--detail-page-panel-extent": open.start ? `${START_PANEL_PX}px` : "0px",
  };
  const endExtentStyle: CSSProperties &
    Record<"--detail-page-panel-extent" | "--detail-page-end-width", string> = {
    "--detail-page-end-width": endAtMax ? "100%" : `${endWidth}px`,
    "--detail-page-panel-extent": open.end
      ? endAtMax
        ? "100%"
        : `${endWidth}px`
      : "0px",
  };

  const templateRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const startSlotRef = useRef<HTMLDivElement | null>(null);
  const endSlotRef = useRef<HTMLDivElement | null>(null);

  // A panel that closes becomes inert at once, even while it animates out.
  // If focus was inside it, move focus to main first, so it isn't lost.
  const wasOpen = useRef(open);
  useLayoutEffect(() => {
    for (const [side, slot] of [
      ["start", startSlotRef.current],
      ["end", endSlotRef.current],
    ] as const) {
      const closing = wasOpen.current[side] && !open[side];
      if (closing && slot?.contains(document.activeElement)) {
        mainRef.current?.focus({ preventScroll: true });
      }
    }
    wasOpen.current = open;
  });

  // Settle a transition when it ends, or after a fallback if it never
  // reports (reduced motion, a hidden tab, an interrupted transition).
  const { transitioning, settleTransition } = state;
  useEffect(() => {
    if (!transitioning) return;
    const timer = setTimeout(
      () => settleTransition(transitioning),
      transitionFallbackMs(templateRef.current),
    );
    return () => clearTimeout(timer);
  }, [transitioning, settleTransition]);
  const onClipTransitionEnd =
    (side: "start" | "end") => (event: TransitionEvent<HTMLDivElement>) => {
      if (
        event.target === event.currentTarget &&
        event.propertyName === "width"
      ) {
        settleTransition(side);
      }
    };

  return (
    <div
      ref={(node) => {
        templateRef.current = node;
        return ref(node);
      }}
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
          ref={startSlotRef}
          data-slot="detail-page-start-panel"
          data-state={open.start ? "open" : "closed"}
          data-transitioning={transitioning === "start"}
          inert={!open.start}
          className={cn(
            "relative col-start-1 min-h-0",
            PANEL_SLOT_MOTION,
            DIVIDER_OVERLAY,
            DIVIDER_INLINE_END,
            "[&_[data-surface=side-panel]]:[--side-panel-width:var(--detail-page-start-panel-width)]",
            startBeside ? "row-span-2 row-start-1" : "row-start-2",
          )}
          style={startExtentStyle}
        >
          <div
            data-slot="detail-page-panel-clip"
            data-transitioning={transitioning === "start"}
            className={cn(
              "flex h-full w-(--detail-page-panel-extent) justify-start overflow-x-clip",
              PANEL_CLIP_MOTION,
            )}
            onTransitionEnd={onClipTransitionEnd("start")}
          >
            <SidePanelSlotContext.Provider
              value={{ open: open.start, placement: config.start.placement }}
            >
              {startPanel}
            </SidePanelSlotContext.Provider>
          </div>
        </div>
      )}
      <div
        ref={mainRef}
        data-slot="detail-page-main"
        // Focus lands here when a closing panel had it.
        tabIndex={-1}
        className="col-start-2 row-start-2 min-h-0 min-w-0 outline-none"
      >
        {main}
      </div>
      {hasEnd && (
        <div
          ref={endSlotRef}
          data-slot="detail-page-end-panel"
          data-state={open.end ? "open" : "closed"}
          data-transitioning={transitioning === "end"}
          inert={!open.end}
          className={cn(
            "relative col-start-3 min-h-0",
            PANEL_SLOT_MOTION,
            DIVIDER_OVERLAY,
            DIVIDER_INLINE_START,
            "[&_[data-surface=side-panel]]:[--side-panel-width:var(--detail-page-end-width)]",
            endBeside ? "row-span-2 row-start-1" : "row-start-2",
          )}
          style={endExtentStyle}
        >
          {/* Only once measured, so the handle never reports a guessed range. */}
          {endPanelResizable && open.end && state.measured && (
            <PanelResizeHandle
              label={t("detail_page_resize_end_panel")}
              value={endWidth}
              min={endWidthRange.min}
              max={endWidthRange.max}
              onResize={state.setEndWidth}
              onReset={state.resetEndWidth}
            />
          )}
          <div
            data-slot="detail-page-panel-clip"
            data-transitioning={transitioning === "end"}
            className={cn(
              // Anchored at the end edge, so the panel reveals from there.
              "flex h-full w-(--detail-page-panel-extent) justify-end overflow-x-clip",
              PANEL_CLIP_MOTION,
            )}
            onTransitionEnd={onClipTransitionEnd("end")}
          >
            <SidePanelSlotContext.Provider
              value={{ open: open.end, placement: config.end.placement }}
            >
              {endPanel}
            </SidePanelSlotContext.Provider>
          </div>
        </div>
      )}
    </div>
  );
}
