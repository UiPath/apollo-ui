"use client";

import {
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  type TransitionEvent,
  useLayoutEffect,
  useRef,
} from "react";

import { cn } from "@/lib/utils";

import { DetailPageResizeHandle } from "./detail-page-resize-handle";
import {
  enabledPanels,
  END_PANEL_MIN_PX,
  MAIN_MIN_OUTER_PX,
  START_PANEL_PX,
} from "./detail-page-rules";
import type { DetailPageState, PanelSide } from "./use-detail-page";

declare module "react" {
  interface CSSProperties {
    [key: `--detail-page-${string}`]: string;
  }
}

/*
 * Slot dividers are an inset shadow on an overlay, so they take no layout
 * space. Inline-edge shadows are physical, so the RTL variant flips them.
 */
const DIVIDER_OVERLAY =
  "after:pointer-events-none after:absolute after:inset-0 after:z-10 after:content-['']";
const DIVIDER_BOTTOM = "after:shadow-[inset_0_-1px_0_0_var(--border)]";
const DIVIDER_INLINE_END =
  "after:shadow-[inset_-1px_0_0_0_var(--border)] rtl:after:shadow-[inset_1px_0_0_0_var(--border)]";
const DIVIDER_INLINE_START =
  "after:shadow-[inset_1px_0_0_0_var(--border)] rtl:after:shadow-[inset_-1px_0_0_0_var(--border)]";

const PANEL_CLIP_MOTION = [
  "data-[transitioning=true]:transition-[width]",
  "data-[transitioning=true]:duration-200",
  "data-[transitioning=true]:ease-out",
  "motion-reduce:transition-none!",
].join(" ");
const PANEL_SLOT_MOTION = [
  "data-[state=closed]:invisible",
  "data-[transitioning=true]:transition-[visibility]",
  "data-[transitioning=true]:data-[state=closed]:delay-200",
  "motion-reduce:transition-none!",
].join(" ");

export interface DetailPageProps
  extends Omit<ComponentProps<"div">, "children" | "content"> {
  /** From `useDetailPage(config)`. Carries the config and open state. */
  state: DetailPageState;
  /** The page header. */
  header: ReactNode;
  /** Start sidebar. Shown when `panels` is `start` or `both`. */
  startSidebar?: ReactNode;
  /** The page content. */
  content: ReactNode;
  /** End sidebar. Shown when `panels` is `end` or `both`. */
  endSidebar?: ReactNode;
}

/**
 * Detail page frame: start sidebar, content, and end sidebar under a
 * header. A beside-header sidebar spans both rows and the header moves
 * over. Closed sidebars stay mounted at zero width.
 *
 * A "max" end width is laid out by the grid until the page is measured.
 * After that, the same split is a pixel width so it can animate.
 */
export function DetailPage({
  state,
  header,
  startSidebar,
  content,
  endSidebar,
  className,
  ...props
}: DetailPageProps) {
  const { config, open, ref, endWidth, endWidthRange, transitioning } = state;
  const enabled = enabledPanels(config.panels);
  const hasStart = enabled.start && Boolean(startSidebar);
  const hasEnd = enabled.end && Boolean(endSidebar);
  const startBeside = hasStart && config.start.placement === "beside-header";
  const endBeside = hasEnd && config.end.placement === "beside-header";
  const endAtMax =
    hasEnd && open.end && state.endWidthChosen === "max" && !state.measured;
  const startOpenPx = hasStart && open.start ? START_PANEL_PX : 0;

  const mainRef = useRef<HTMLDivElement | null>(null);
  const startSlotRef = useRef<HTMLDivElement | null>(null);
  const endSlotRef = useRef<HTMLDivElement | null>(null);

  useFocusOnClose(open, startSlotRef, endSlotRef, mainRef);

  const onClipTransitionEnd =
    (side: PanelSide) => (event: TransitionEvent<HTMLDivElement>) => {
      if (
        event.target === event.currentTarget &&
        event.propertyName === "width"
      ) {
        state.settleTransition(side);
      }
    };

  return (
    <div
      ref={ref}
      data-template="detail-page"
      style={templateStyle(startOpenPx, endAtMax)}
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
        <SidebarSlot
          slotRef={startSlotRef}
          name="start-panel"
          open={open.start}
          transitioning={transitioning === "start"}
          beside={startBeside}
          column="col-start-1"
          dividerClass={DIVIDER_INLINE_END}
          extent={open.start ? `${START_PANEL_PX}px` : "0px"}
          justify="justify-start"
          innerWidth="w-(--detail-page-start-panel-width)"
          onTransitionEnd={onClipTransitionEnd("start")}
        >
          {startSidebar}
        </SidebarSlot>
      )}
      <div
        ref={mainRef}
        data-slot="detail-page-main"
        tabIndex={-1}
        className="col-start-2 row-start-2 min-h-0 min-w-0 outline-none"
      >
        {content}
      </div>
      {hasEnd && (
        <SidebarSlot
          slotRef={endSlotRef}
          name="end-panel"
          open={open.end}
          transitioning={transitioning === "end"}
          beside={endBeside}
          column="col-start-3"
          dividerClass={DIVIDER_INLINE_START}
          extent={endExtent(open.end, endAtMax, endWidth)}
          justify="justify-end"
          innerWidth={endAtMax ? "w-full" : "w-(--detail-page-end-width)"}
          innerStyle={{
            "--detail-page-end-width": `${endWidth}px`,
          }}
          onTransitionEnd={onClipTransitionEnd("end")}
          handle={
            open.end && state.measured ? (
              <DetailPageResizeHandle
                value={endWidth}
                min={endWidthRange.min}
                max={endWidthRange.max}
                onResize={state.setEndWidth}
                onReset={state.resetEndWidth}
              />
            ) : null
          }
        >
          {endSidebar}
        </SidebarSlot>
      )}
    </div>
  );
}

function templateStyle(startOpenPx: number, endAtMax: boolean): CSSProperties {
  const sharedFloor = startOpenPx + END_PANEL_MIN_PX;
  const mainTrack = endAtMax
    ? `minmax(min(${MAIN_MIN_OUTER_PX}px, calc(100% - ${sharedFloor}px)), 1fr)`
    : "minmax(0, 1fr)";
  const endTrack = endAtMax ? `minmax(${END_PANEL_MIN_PX}px, 1fr)` : "auto";
  const style: CSSProperties = {
    "--detail-page-start-panel-width": `${START_PANEL_PX}px`,
    "--detail-page-columns": `auto ${mainTrack} ${endTrack}`,
  };
  return style;
}

function endExtent(open: boolean, endAtMax: boolean, endWidth: number) {
  if (!open) return "0px";
  if (endAtMax) return "100%";
  return `${endWidth}px`;
}

function useFocusOnClose(
  open: Record<PanelSide, boolean>,
  startSlotRef: RefObject<HTMLDivElement | null>,
  endSlotRef: RefObject<HTMLDivElement | null>,
  mainRef: RefObject<HTMLDivElement | null>,
) {
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
}

interface SidebarSlotProps {
  slotRef: RefObject<HTMLDivElement | null>;
  name: "start-panel" | "end-panel";
  open: boolean;
  transitioning: boolean;
  beside: boolean;
  column: string;
  dividerClass: string;
  extent: string;
  justify: "justify-start" | "justify-end";
  innerWidth: string;
  innerStyle?: CSSProperties;
  onTransitionEnd: (event: TransitionEvent<HTMLDivElement>) => void;
  handle?: ReactNode;
  children: ReactNode;
}

function SidebarSlot({
  slotRef,
  name,
  open,
  transitioning,
  beside,
  column,
  dividerClass,
  extent,
  justify,
  innerWidth,
  innerStyle,
  onTransitionEnd,
  handle,
  children,
}: SidebarSlotProps) {
  const extentStyle: CSSProperties = {
    "--detail-page-panel-extent": extent,
  };
  return (
    <div
      ref={slotRef}
      data-slot={`detail-page-${name}`}
      data-state={open ? "open" : "closed"}
      data-transitioning={transitioning}
      inert={!open}
      className={cn(
        "relative min-h-0",
        column,
        PANEL_SLOT_MOTION,
        DIVIDER_OVERLAY,
        dividerClass,
        beside ? "row-span-2 row-start-1" : "row-start-2",
      )}
      style={extentStyle}
    >
      {handle}
      <div
        data-part="panel-clip"
        data-transitioning={transitioning}
        className={cn(
          "flex h-full w-(--detail-page-panel-extent) overflow-x-clip",
          justify,
          PANEL_CLIP_MOTION,
        )}
        onTransitionEnd={onTransitionEnd}
      >
        <div
          className={cn("flex h-full shrink-0", innerWidth)}
          style={innerStyle}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
