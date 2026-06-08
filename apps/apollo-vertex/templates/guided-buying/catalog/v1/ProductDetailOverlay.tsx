import { useFocusTrap, useHotkeys } from "@mantine/hooks";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ProductDetailOverlayProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Scoped overlay layered over the catalog main column (never the rail). Handles
 * the overlay hygiene: focus trap, Esc to close, dim-to-close, restored focus,
 * and a slide-in from the right edge.
 */
export function ProductDetailOverlay({
  onClose,
  children,
}: ProductDetailOverlayProps) {
  const focusTrapRef = useFocusTrap(true);
  useHotkeys([["Escape", onClose]]);

  // Return focus to the triggering element when the overlay unmounts.
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    return () => restoreRef.current?.focus?.();
  }, []);

  // Slide-in on mount.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0 z-30">
      {/* Dimmed grid behind — click to close. */}
      <button
        type="button"
        aria-label="Close details"
        tabIndex={-1}
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-foreground/20 transition-opacity duration-300",
          entered ? "opacity-100" : "opacity-0",
        )}
      />
      {/* Sliding detail panel — fills the main column, leaving a dim gutter. */}
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-label="Product details"
        className={cn(
          "absolute inset-y-0 right-0 left-0 flex flex-col overflow-y-auto bg-background shadow-xl transition-transform duration-300 ease-out sm:left-12",
          entered ? "translate-x-0" : "translate-x-full",
        )}
      >
        {children}
      </div>
    </div>
  );
}
