import { useFocusTrap, useHotkeys } from "@mantine/hooks";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, useEffect, useRef } from "react";

interface ProductDetailOverlayProps {
  onClose: () => void;
  children: ReactNode;
}

// Smooth ease-out reveal; quicker ease-in close. Rendered inside an
// <AnimatePresence> so the exit plays before unmount.
const REVEAL = {
  duration: 0.42,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};
const CLOSE = {
  duration: 0.2,
  ease: [0.4, 0, 1, 1] as [number, number, number, number],
};

/**
 * Scoped overlay layered over the catalog main column (never the rail). Handles
 * the overlay hygiene: focus trap, Esc to close, dim-to-close, restored focus,
 * and a slide-in/out from the right edge.
 */
export function ProductDetailOverlay({
  onClose,
  children,
}: ProductDetailOverlayProps) {
  const focusTrapRef = useFocusTrap(true);
  useHotkeys([["Escape", onClose]]);
  const reduceMotion = useReducedMotion();

  // Return focus to the triggering element when the overlay unmounts.
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    return () => restoreRef.current?.focus?.();
  }, []);

  const reveal = reduceMotion ? { duration: 0 } : REVEAL;
  const close = reduceMotion ? { duration: 0 } : CLOSE;

  return (
    <div className="absolute inset-0 z-30">
      {/* Blurred catalog behind — click to close. */}
      <motion.button
        type="button"
        aria-label="Close details"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-foreground/30 backdrop-blur-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: reveal }}
        exit={{ opacity: 0, transition: close }}
      />
      {/* Centered detail dialog. */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <motion.div
          ref={focusTrapRef}
          role="dialog"
          aria-modal="true"
          aria-label="Product details"
          className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-y-auto rounded-2xl bg-background shadow-2xl"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: reveal }}
          exit={{ opacity: 0, scale: 0.96, y: 12, transition: close }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
