"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TemplateHost } from "@/app/_components/template-hosts";
import { cn } from "@/lib/utils";
import type { SlotTarget } from "./slot-popover";

/** A slot's box on the frame, in px from the frame's top-left corner. */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * How long the pointer rests on another slot before its chip shows: long
 * enough to cross the header on the way up to a panel's chip.
 */
const SWITCH_DELAY_MS = 250;

interface StageSlotChipsProps {
  host: TemplateHost;
  /** The slot whose popover is open, if any. */
  opened: SlotTarget | null;
  onOpen: (target: SlotTarget) => void;
  onClose: () => void;
}

/**
 * Opens a slot's popover from the stage. Pointing at a slot, or focusing
 * its chip, outlines it and shows its name chip in the strip above the
 * frame, in place of the frame tag; only one shows at a time. Nothing sits
 * over the page, so every occupant stays fully interactive. Each chip is a
 * button, in slot order, so the keyboard reaches them all.
 */
export function StageSlotChips({
  host,
  opened,
  onOpen,
  onClose,
}: StageSlotChipsProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [boxes, setBoxes] = useState<Readonly<Record<string, Box>>>({});
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const switchTimer = useRef<number | null>(null);
  // What the pointer shows now, for the pointer handlers to read.
  const hoveredNow = useRef<string | null>(null);
  // The slot the pointer rests on while the switch waits.
  const pending = useRef<string | null>(null);
  // Measures every slot's box; set by the effect, for focus to call too.
  const measureAll = useRef<(() => void) | null>(null);

  const slotNames = host.spec.slots.map((slot) => slot.name);
  const frame = () =>
    ref.current?.closest<HTMLElement>("[data-slot=workbench-frame]");
  const slotElement = (slot: string) =>
    frame()?.querySelector<HTMLElement>(
      `[data-slot="${host.spec.name}-${slot}"]`,
    );

  useEffect(() => {
    const root = ref.current?.closest<HTMLElement>(
      "[data-slot=workbench-frame]",
    );
    if (!root) return;
    const name = host.spec.name;
    const slots = host.spec.slots.map((slot) => slot.name);
    const resize = new ResizeObserver(() => measure());
    const measure = () => {
      const origin = root.getBoundingClientRect();
      const next: Record<string, Box> = {};
      for (const slot of slots) {
        const element = root.querySelector(`[data-slot="${name}-${slot}"]`);
        // A slot can appear later, as when it's put back in the page.
        if (element) resize.observe(element);
        const box = element?.getBoundingClientRect();
        // A slot left out or closed has no box to point at.
        if (box && box.width > 0 && box.height > 0)
          next[slot] = {
            x: box.left - origin.left,
            y: box.top - origin.top,
            width: box.width,
            height: box.height,
          };
      }
      // Most changes are an occupant's own, and move no slot.
      setBoxes((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    const clearTimer = () => {
      if (switchTimer.current !== null)
        window.clearTimeout(switchTimer.current);
      switchTimer.current = null;
    };
    const hover = (slot: string | null) => {
      if (slot) measure();
      hoveredNow.current = slot;
      setHovered(slot);
    };
    // Which slot the pointer is over, if any; another slot after a rest.
    const onMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // Over the chip strip: keep what's shown.
      if (ref.current?.contains(target)) {
        clearTimer();
        return;
      }
      const over =
        slots.find((slot) =>
          root.querySelector(`[data-slot="${name}-${slot}"]`)?.contains(target),
        ) ?? null;
      const current = hoveredNow.current;
      if (over === current) {
        clearTimer();
        return;
      }
      if (current === null) {
        hover(over);
        return;
      }
      pending.current = over;
      if (switchTimer.current !== null) return;
      switchTimer.current = window.setTimeout(() => {
        switchTimer.current = null;
        hover(pending.current);
      }, SWITCH_DELAY_MS);
    };
    const onLeave = () => {
      clearTimer();
      hover(null);
    };
    measureAll.current = measure;
    measure();
    resize.observe(root);
    // The template draws its slots after this mounts, and redraws them as
    // its layout changes: measure once each change has rendered.
    let frameRequest = 0;
    const changed = new MutationObserver(() => {
      cancelAnimationFrame(frameRequest);
      frameRequest = requestAnimationFrame(measure);
    });
    changed.observe(root, { childList: true, subtree: true });
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      clearTimer();
      cancelAnimationFrame(frameRequest);
      changed.disconnect();
      resize.disconnect();
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
    };
  }, [host]);

  const fromStage = opened?.from === "stage" ? opened.slot : null;
  const shown = fromStage ?? focused ?? hovered;
  const shownBox = shown === null ? null : (boxes[shown] ?? null);
  return (
    <div ref={ref} data-slot="workbench-stage-chips">
      <div className="absolute start-0 bottom-full mb-1 h-6 w-full">
        {slotNames.map((slot) => {
          const box = boxes[slot];
          if (!box) return null;
          const label = host.slotLabels[slot] ?? slot;
          const isShown = shown === slot;
          const expanded = fromStage === slot;
          return (
            <button
              key={slot}
              type="button"
              data-slot="workbench-stage-chip"
              data-chip-slot={slot}
              data-shown={isShown}
              aria-haspopup="dialog"
              aria-expanded={expanded}
              aria-label={t("workbench_stage_chip", { slot: label })}
              style={{ left: `${box.x}px` }}
              className={cn(
                "absolute top-0 flex h-6 items-center gap-1 rounded-md border border-primary bg-background px-2 text-xs font-medium whitespace-nowrap text-primary shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !isShown && "pointer-events-none opacity-0",
              )}
              onFocus={() => {
                measureAll.current?.();
                setFocused(slot);
              }}
              onBlur={() => setFocused(null)}
              onClick={(event) => {
                if (expanded) {
                  onClose();
                  return;
                }
                const element = slotElement(slot);
                if (!element) return;
                onOpen({
                  slot,
                  from: "stage",
                  opener: event.currentTarget,
                  // The slot itself: the popover opens above its bottom edge.
                  anchor: element,
                });
              }}
            >
              {label}
              <ChevronDown aria-hidden className="size-3" />
            </button>
          );
        })}
      </div>
      {shownBox && (
        <div
          aria-hidden="true"
          data-slot="workbench-stage-outline"
          data-outline-slot={shown}
          style={{
            left: `${shownBox.x}px`,
            top: `${shownBox.y}px`,
            width: `${shownBox.width}px`,
            height: `${shownBox.height}px`,
          }}
          className="pointer-events-none absolute z-20 rounded-sm outline-2 -outline-offset-2 outline-primary"
        />
      )}
    </div>
  );
}
