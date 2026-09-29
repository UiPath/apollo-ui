import type { Ref, RefCallback } from "react";

/** The fade length when --scroll-fade-size can't be read, in px. */
const FALLBACK_FADE_PX = 24;

function fadeSize(node: HTMLElement): number {
  const value = Number.parseFloat(
    getComputedStyle(node).getPropertyValue("--scroll-fade-size"),
  );
  return Number.isFinite(value) ? value : FALLBACK_FADE_PX;
}

/** Attaches a ref of either kind, returning how to detach it. */
function attach<T>(ref: Ref<T> | undefined, node: T): () => void {
  if (typeof ref === "function") {
    const cleanup = ref(node);
    return () => (typeof cleanup === "function" ? cleanup() : ref(null));
  }
  if (ref) {
    ref.current = node;
    return () => {
      ref.current = null;
    };
  }
  // Nothing to detach.
  return () => null;
}

/** Which way a container scrolls, so which edges can fade. */
export type ScrollFadeAxis = "y" | "x" | "both";

/**
 * Scroll fades for a scroll container. Returns a ref for the container;
 * pair it with the mask for its axis on the same element: SCROLL_FADE_MASK
 * ("y", the default), SCROLL_FADE_MASK_X ("x"), or SCROLL_FADE_MASK_BOTH
 * ("both"). Pass the component's own `ref` prop as `forwarded` and it is
 * attached too.
 *
 * Each edge fades only while there is more content in that direction, and
 * the fade grows with the distance left to scroll, up to --scroll-fade-size.
 * Nothing animates: the fade tracks the scroll position directly, so there
 * is no motion to reduce.
 *
 * The values are written straight to the element as custom properties
 * (--scroll-fade-top and --scroll-fade-bottom for "y", --scroll-fade-left and
 * --scroll-fade-right for "x"), not React state, so scrolling
 * never re-renders. Updates come from scroll events and ResizeObserver, with
 * no requestAnimationFrame, so they also run in hidden tabs.
 *
 * Left and right are physical edges. In a right-to-left container the
 * content starts at the right, and the fades follow where content remains.
 */
export function useScrollFade<T extends HTMLElement>(
  enabled = true,
  forwarded?: Ref<T>,
  axis: ScrollFadeAxis = "y",
): RefCallback<T> {
  return (node: T | null) => {
    if (!node) return;
    const detachForwarded = attach(forwarded, node);
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
