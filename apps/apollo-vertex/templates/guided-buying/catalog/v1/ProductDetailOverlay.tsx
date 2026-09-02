"use client";

import type { ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductDetailOverlayProps {
  onClose: () => void;
  children: ReactNode;
}

/**
 * Product detail dialog — Apollo Vertex's Dialog primitive. DialogPortal
 * mounts to document.body and DialogOverlay is fixed inset-0, so the scrim
 * covers the full viewport, rail sidebar included, instead of resolving
 * against whichever column happens to be the nearest positioned ancestor.
 * Focus trap, Esc-to-close, and outside-click-to-close all come from the
 * primitive; none of that is reimplemented here. The close control is the
 * header row's own X (see ProductDetail) — no second dismiss added here.
 *
 * The Dialog primitive has no size variants (checked registry/dialog), so
 * width is a plain className override like every other DialogContent
 * caller in this app (ReceiptModal, MatchCarousel) — sm:max-w-2xl is 672px,
 * inside the requested 660-720px range.
 *
 * children owns its own DialogTitle (the product name, sr-only) — this
 * shell has no product to name one after.
 */
export function ProductDetailOverlay({
  onClose,
  children,
}: ProductDetailOverlayProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-y-auto rounded-2xl border-0 p-0 shadow-2xl sm:max-w-2xl"
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}
