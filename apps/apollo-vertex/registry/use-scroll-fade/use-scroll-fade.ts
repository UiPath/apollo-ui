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

/**
 * Scroll fades for a scroll container. Returns a ref for the container;
 * pair it with SCROLL_FADE_MASK on the same element. Pass the component's
 * own `ref` prop as `forwarded` and it is attached too.
 *
 * Each edge fades only while there is more content in that direction, and
 * the fade grows with the distance left to scroll, up to --scroll-fade-size.
 * Nothing animates: the fade tracks the scroll position directly, so there
 * is no motion to reduce.
 *
 * The values are written straight to the element as custom properties
 * (--scroll-fade-top, --scroll-fade-bottom), not React state, so scrolling
 * never re-renders. Updates come from scroll events and ResizeObserver, with
 * no requestAnimationFrame, so they also run in hidden tabs.
 */
export function useScrollFade<T extends HTMLElement>(
  enabled = true,
  forwarded?: Ref<T>,
): RefCallback<T> {
  return (node: T | null) => {
    if (!node) return;
    const detachForwarded = attach(forwarded, node);
    if (!enabled) return detachForwarded;
    let size = fadeSize(node);

    const update = () => {
      const below = node.scrollHeight - node.clientHeight - node.scrollTop;
      const top = Math.min(Math.max(node.scrollTop, 0), size);
      const bottom = Math.min(Math.max(below, 0), size);
      node.style.setProperty("--scroll-fade-top", `${top}px`);
      node.style.setProperty("--scroll-fade-bottom", `${bottom}px`);
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
      node.style.removeProperty("--scroll-fade-top");
      node.style.removeProperty("--scroll-fade-bottom");
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
