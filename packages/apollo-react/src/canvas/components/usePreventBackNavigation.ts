import { useEffect } from "react";

/**
 * Custom hook to prevent browser back navigation on touch gestures and horizontal wheel scrolling.
 * This is useful for canvas/flow components where accidental navigation can interrupt user work.
 */
export function usePreventBackNavigation() {
  useEffect(() => {
    const preventBackNavigation = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
      }
    };

    const preventWheel = (e: WheelEvent) => {
      // Prevent horizontal wheel/trackpad scrolling from navigating
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", preventBackNavigation, { passive: false });
    document.addEventListener("touchmove", preventBackNavigation, { passive: false });
    document.addEventListener("wheel", preventWheel, { passive: false });

    return () => {
      document.removeEventListener("touchstart", preventBackNavigation);
      document.removeEventListener("touchmove", preventBackNavigation);
      document.removeEventListener("wheel", preventWheel);
    };
  }, []);
}
