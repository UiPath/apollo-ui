/** Duration of one shimmer cycle, in milliseconds. */
export const SKELETON_SHIMMER_DURATION_MS = 2000;

/** Name of the shimmer `@keyframes` defined in `ApSkeleton.css`. */
export const SKELETON_SHIMMER_ANIMATION_NAME = 'ap-skeleton-shimmer';

/**
 * Custom property (set on each skeleton element) holding the animation delay that keeps all skeletons in phase
 * when the Web Animations API is not available. Same name as in portal-shell's `ap-skeleton`.
 */
export const SKELETON_SHIMMER_DELAY_CSS_PROPERTY = '--ap-skeleton-shimmer-delay';

function getCurrentTimelineTime(): number {
  // `document.timeline.currentTime` is the clock CSS animations run on. It can be `null` (inactive timeline)
  // or a CSSNumberish in some engines, so fall back to `performance.now()`, which shares its time origin.
  const timelineTime = typeof document !== 'undefined' ? document.timeline?.currentTime : null;
  return typeof timelineTime === 'number' ? timelineTime : performance.now();
}

/**
 * Returns the `animation-delay` that puts a shimmer animation starting at `now` in phase with a virtual
 * animation that started at time 0. Giving every skeleton this delay when it starts animating keeps all
 * skeletons on the page shimmering in sync, without sharing an animated property through `<body>`.
 */
export function getSkeletonShimmerSyncDelay(now: number = getCurrentTimelineTime()): string {
  const phase =
    ((now % SKELETON_SHIMMER_DURATION_MS) + SKELETON_SHIMMER_DURATION_MS) %
    SKELETON_SHIMMER_DURATION_MS;
  return `${-Math.round(phase)}ms`;
}

/**
 * Puts the skeleton's shimmer in phase with every other skeleton on the page.
 *
 * Preferred: anchor the element's shimmer `CSSAnimation` to the start of the document timeline (`startTime = 0`).
 * All anchored animations then share exactly the same phase, no matter when each one actually started (for
 * example after a long task during the initial mount, which would skew a delay computed up front).
 *
 * Fallback (no Web Animations API, e.g. jsdom): set a negative `animation-delay` computed from the current time.
 */
export function syncSkeletonShimmer(element: HTMLElement): void {
  if (typeof element.getAnimations === 'function') {
    for (const animation of element.getAnimations()) {
      if ((animation as CSSAnimation).animationName === SKELETON_SHIMMER_ANIMATION_NAME) {
        animation.startTime = 0;
      }
    }
    return;
  }

  element.style.setProperty(SKELETON_SHIMMER_DELAY_CSS_PROPERTY, getSkeletonShimmerSyncDelay());
}
