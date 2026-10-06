import { type RefObject, useEffect, useState } from "react";
import type { TemplateHost } from "@/app/_components/template-hosts";

/** A box on the stage frame, in px from the frame's top-left corner. */
export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The frame an element is in, if any. */
export const frameOf = (element: Element | null) =>
  element?.closest<HTMLElement>("[data-slot=workbench-frame]") ?? null;

/** A template slot's element in the frame, by the slot's data-slot. */
export const slotElement = (
  frame: Element | null,
  host: TemplateHost,
  slot: string,
) =>
  frame?.querySelector<HTMLElement>(
    `[data-slot="${host.spec.name}-${slot}"]`,
  ) ?? null;

/** An element's box on the frame. */
export const boxOn = (frame: Element, element: Element): Box => {
  const origin = frame.getBoundingClientRect();
  const box = element.getBoundingClientRect();
  return {
    x: box.left - origin.left,
    y: box.top - origin.top,
    width: box.width,
    height: box.height,
  };
};

/** The middle of a span. */
const middle = (start: number, size: number) => start + size / 2;

/** A slot this much of the page's width or more opens its popover above or below it. */
const WIDE = 0.6;

/**
 * The side of a slot its popover opens on: toward the page's center, so
 * it's beside the slot, never over it. A slot as wide as most of the page,
 * like a header, opens it below, or above when it's in the lower half.
 */
export const sideTowardCenter = (
  slot: Box,
  page: Box,
): "top" | "right" | "bottom" | "left" => {
  if (slot.width >= page.width * WIDE)
    return middle(slot.y, slot.height) < middle(page.y, page.height)
      ? "bottom"
      : "top";
  return middle(slot.x, slot.width) < middle(page.x, page.width)
    ? "right"
    : "left";
};

/** The key of the template's own box among the slots' boxes. */
export const TEMPLATE_BOX = "@template";

/**
 * Each of the template's slots' boxes on the frame that `ref` is in, kept
 * current as the page resizes and the template redraws. A slot left out
 * or closed has none.
 */
export function useSlotBoxes(
  host: TemplateHost,
  ref: RefObject<HTMLElement | null>,
): Readonly<Record<string, Box>> {
  const [boxes, setBoxes] = useState<Readonly<Record<string, Box>>>({});
  useEffect(() => {
    const frame = frameOf(ref.current);
    if (!frame) return;
    const slots = host.spec.slots.map((slot) => slot.name);
    const resize = new ResizeObserver(() => measure());
    const measure = () => {
      const next: Record<string, Box> = {};
      for (const slot of slots) {
        const element = slotElement(frame, host, slot);
        // A slot can appear later, as when it's put back in the page.
        if (element) resize.observe(element);
        const box = element ? boxOn(frame, element) : null;
        if (box && box.width > 0 && box.height > 0) next[slot] = box;
      }
      // The template's own box, under its name, for left-out slots' ghosts.
      const template = frame.querySelector(
        `[data-template="${host.spec.name}"]`,
      );
      if (template) next[TEMPLATE_BOX] = boxOn(frame, template);
      // Most changes are an occupant's own, and move no slot.
      setBoxes((current) =>
        JSON.stringify(current) === JSON.stringify(next) ? current : next,
      );
    };
    measure();
    resize.observe(frame);
    // The template draws its slots after this mounts, and redraws them as
    // its layout changes: measure once each change has rendered.
    let request = 0;
    const changed = new MutationObserver(() => {
      cancelAnimationFrame(request);
      request = requestAnimationFrame(measure);
    });
    changed.observe(frame, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(request);
      changed.disconnect();
      resize.disconnect();
    };
  }, [host, ref]);
  return boxes;
}
