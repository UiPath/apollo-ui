"use client";

import { type RefObject, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import type {
  SlotStatus,
  TemplateHost,
} from "@/app/_components/template-hosts";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import type { LayoutChoices } from "@/lib/layout";
import { SlotContentsSection } from "./slot-contents";
import { SlotLayoutSection } from "./slot-layout-section";
import type { ContentsChange, SlotContents } from "./workbench-compose";
import { hasLayout, leftOut } from "./workbench-layout";

/** Anything the popover can be placed against: an element, or a box of one. */
interface Measurable {
  getBoundingClientRect: () => DOMRect;
}

/** The least room above a slot for its popover; with less, it opens above the dock. */
const MIN_ROOM_PX = 360;

/**
 * Where the popover opens above: the anchor's bottom edge (a dock chip,
 * or a slot in Edit mode), never lower than the dock's top, so it never
 * covers the dock. A slot with too little room above its bottom, like a
 * header, opens above the dock instead.
 */
const above = (anchor: Measurable): Measurable => ({
  getBoundingClientRect: () => {
    const box = anchor.getBoundingClientRect();
    const dockTop =
      document
        .querySelector("[data-slot=workbench-dock]")
        ?.getBoundingClientRect().top ?? window.innerHeight;
    const bottom = Math.min(box.bottom, dockTop);
    const y = bottom < MIN_ROOM_PX ? dockTop : bottom;
    return new DOMRect(box.x, y, box.width, 0);
  },
});

/** The slot a popover is open for, what opened it, and what it's placed against. */
export interface SlotTarget {
  slot: string;
  /** Focus goes back here when it closes. */
  opener: HTMLElement;
  anchor: Measurable;
  /**
   * The side of the anchor it opens on, beside a slot on the stage. Left
   * out, it opens above the anchor (a dock chip).
   */
  side?: "top" | "right" | "bottom" | "left";
}

/** The room the dock takes at the bottom of the window, so the popover stays clear of it. */
const dockRoom = () => {
  const dock = document.querySelector("[data-slot=workbench-dock]");
  return dock ? window.innerHeight - dock.getBoundingClientRect().top + 8 : 8;
};

interface SlotPopoverProps {
  host: TemplateHost;
  /** The slot it's open for, or null when it's closed. */
  target: SlotTarget | null;
  onClose: () => void;
  layout: LayoutChoices;
  onLayout: (layout: LayoutChoices) => void;
  status: Readonly<Record<string, SlotStatus>> | null;
  contents: SlotContents;
  onContents: ContentsChange;
}

/**
 * One slot's settings, in one popover for the whole template view, so only
 * one is ever open: the slot's contents first, then its layout, only what
 * it declares. Escape or a click outside closes it, and focus goes back to
 * whatever opened it.
 */
export function SlotPopover({
  host,
  target,
  onClose,
  layout,
  onLayout,
  status,
  contents,
  onContents,
}: SlotPopoverProps) {
  const { t } = useTranslation();
  const headingId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The opener outlives the target, so focus can go back to it on close.
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (target) opener.current = target.opener;
  }, [target]);
  const anchor: RefObject<Measurable | null> = {
    current: target
      ? target.side
        ? target.anchor
        : above(target.anchor)
      : null,
  };
  const slot = target?.slot ?? "";
  const slotName = host.slotLabels[slot] ?? slot;
  const out = leftOut(layout, slot);
  const layoutProps = { host, slot, layout, onLayout, status };
  return (
    <Popover
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- Radix reads only getBoundingClientRect */}
      <PopoverAnchor virtualRef={anchor as RefObject<Measurable>} />
      {target && (
        <PopoverContent
          side={target.side ?? "top"}
          align="start"
          sideOffset={8}
          collisionPadding={
            target.side ? { top: 8, left: 8, right: 8, bottom: dockRoom() } : 8
          }
          aria-labelledby={headingId}
          data-slot="workbench-slot-popover"
          data-popover-slot={slot}
          // Its own scroll, so all of it, down to the layout, stays reachable.
          className="flex max-h-[min(40rem,var(--radix-popover-content-available-height))] w-80 flex-col gap-4 overflow-y-auto overscroll-contain"
          // Its own opener toggles it, so a press there isn't "outside".
          onInteractOutside={(event) => {
            if (
              event.target instanceof Node &&
              target.opener.contains(event.target)
            )
              event.preventDefault();
          }}
          // Focus starts on its heading, not on the first control in it.
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            headingRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            // Back to its opener, unless focus has already moved on: this
            // comes a moment after it closes.
            const now = document.activeElement;
            if (!now || now === document.body) opener.current?.focus();
          }}
        >
          <h2
            id={headingId}
            ref={headingRef}
            tabIndex={-1}
            className="text-sm font-semibold outline-none"
          >
            {slotName}
          </h2>
          <section
            aria-label={t("workbench_compose")}
            className="flex flex-col gap-3"
          >
            <h3 className="text-xs font-medium text-muted-foreground uppercase">
              {t("workbench_compose")}
            </h3>
            {out ? (
              <>
                <p className="text-sm" data-slot="workbench-slot-left-out">
                  {t("workbench_slot_include_first", {
                    slot: slotName.toLowerCase(),
                  })}
                </p>
                <SlotLayoutSection {...layoutProps} parts={["present"]} />
              </>
            ) : (
              <SlotContentsSection
                host={host}
                slot={slot}
                contents={contents}
                onContents={onContents}
              />
            )}
          </section>
          {hasLayout(host.spec, slot) && !out && (
            <section
              aria-label={t("workbench_layout")}
              className="flex flex-col gap-3 border-t border-border pt-3"
            >
              <h3 className="text-xs font-medium text-muted-foreground uppercase">
                {t("workbench_layout")}
              </h3>
              <SlotLayoutSection {...layoutProps} />
            </section>
          )}
        </PopoverContent>
      )}
    </Popover>
  );
}
