import type { Ref, RefCallback } from "react";
import { attachRef } from "@/lib/surface-context";

/** The fade length when --scroll-fade-size can't be read, in px. */
const FALLBACK_FADE_PX = 24;

function fadeSize(node: HTMLElement): number {
  const value = Number.parseFloat(
    getComputedStyle(node).getPropertyValue("--scroll-fade-size"),
  );
  return Number.isFinite(value) ? value : FALLBACK_FADE_PX;
}

/** Which way a container scrolls, so which edges can fade. */
export type ScrollFadeAxis = "y" | "x" | "both";

export interface ScrollFadeOptions {
  /** Defaults to "y". */
  axis?: ScrollFadeAxis;
  /**
   * Make the container keyboard focusable (tabindex="0") while its content
   * scrolls, so keyboard users can scroll it. Leave off when the content has
   * its own focusable elements or the container sets its own tabindex.
   */
  focusable?: boolean;
}

/**
 * Scroll fades for a scroll container. Returns a ref for the container;
 * pair it with the mask for its axis on the same element: SCROLL_FADE_MASK
 * ("y", the default), SCROLL_FADE_MASK_X ("x"), or SCROLL_FADE_MASK_BOTH
 * ("both"). Pass the component's own `ref` prop as `forwarded` and it is
 * attached too.
 *
 * A mask hides anything painted outside the element, focus rings included,
 * so draw a focusable container's ring on an unmasked parent.
 *
 * Each edge fades only while there's more content that way, growing with
 * the distance left to scroll, up to --scroll-fade-size. It tracks the
 * scroll position directly: no animation, and no re-render.
 */
export function useScrollFade<T extends HTMLElement>(
  enabled = true,
  forwarded?: Ref<T>,
  { axis = "y", focusable = false }: ScrollFadeOptions = {},
): RefCallback<T> {
  return (node: T | null) => {
    if (!node) return;
    const detachForwarded = attachRef(forwarded, node);
    if (!enabled) return detachForwarded;
    let size = fadeSize(node);

    const vertical = axis !== "x";
    const horizontal = axis !== "y";
    const clamp = (distance: number) =>
      `${Math.min(Math.max(distance, 0), size)}px`;

    const update = () => {
      if (vertical) {
        const below = node.scrollHeight - node.clientHeight - node.scrollTop;
        node.style.setProperty("--scroll-fade-top", clamp(node.scrollTop));
        node.style.setProperty("--scroll-fade-bottom", clamp(below));
      }
      if (horizontal) {
        const range = node.scrollWidth - node.clientWidth;
        // In RTL, scrollLeft runs from 0 (at the right) down to -range.
        const fromLeft =
          getComputedStyle(node).direction === "rtl"
            ? range + node.scrollLeft
            : node.scrollLeft;
        node.style.setProperty("--scroll-fade-left", clamp(fromLeft));
        node.style.setProperty("--scroll-fade-right", clamp(range - fromLeft));
      }
      if (focusable) {
        const scrolls =
          (vertical && node.scrollHeight > node.clientHeight + 1) ||
          (horizontal && node.scrollWidth > node.clientWidth + 1);
        if (scrolls) node.tabIndex = 0;
        else node.removeAttribute("tabindex");
      }
    };

    // Content can grow without the container resizing, so watch the direct
    // children too, and re-watch them when they change.
    const resize = new ResizeObserver(() => {
      size = fadeSize(node);
      update();
    });
    const watchChildren = () => {
      resize.disconnect();
      resize.observe(node);
      for (const child of Array.from(node.children)) resize.observe(child);
    };
    const mutations = new MutationObserver(() => {
      watchChildren();
      update();
    });

    watchChildren();
    mutations.observe(node, { childList: true });
    node.addEventListener("scroll", update, { passive: true });
    update();

    return () => {
      detachForwarded();
      node.removeEventListener("scroll", update);
      resize.disconnect();
      mutations.disconnect();
      for (const edge of ["top", "bottom", "left", "right"]) {
        node.style.removeProperty(`--scroll-fade-${edge}`);
      }
      if (focusable) node.removeAttribute("tabindex");
    };
  };
}

/**
 * The mask for a scroll container using useScrollFade: fully opaque except
 * a gradient to transparent at each edge that has more content. A mask,
 * not an overlay, so it works over any background, including the ambient
 * layer and the side panel tint.
 */
export const SCROLL_FADE_MASK =
  "[mask-image:linear-gradient(to_bottom,transparent,#000_var(--scroll-fade-top,0px),#000_calc(100%-var(--scroll-fade-bottom,0px)),transparent)]";

/** The mask for useScrollFade with axis "x": a fade at each side with more content. */
export const SCROLL_FADE_MASK_X =
  "[mask-image:linear-gradient(to_right,transparent,#000_var(--scroll-fade-left,0px),#000_calc(100%-var(--scroll-fade-right,0px)),transparent)]";

/**
 * The mask for useScrollFade with axis "both": the vertical and horizontal
 * gradients intersected, so a corner fades on both edges at once.
 */
export const SCROLL_FADE_MASK_BOTH = [
  "[mask-image:linear-gradient(to_bottom,transparent,#000_var(--scroll-fade-top,0px),#000_calc(100%-var(--scroll-fade-bottom,0px)),transparent),linear-gradient(to_right,transparent,#000_var(--scroll-fade-left,0px),#000_calc(100%-var(--scroll-fade-right,0px)),transparent)]",
  "[mask-composite:intersect]",
].join(" ");
