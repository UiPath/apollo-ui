import { Modal, ModalContent } from '@uipath/apollo-wind';
import { type ReactNode, useEffect, useRef } from 'react';

export interface CanvasTakeoverModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: ReactNode;
  headerActions?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  className?: string;
  sidebarClassName?: string;
  closeOnBackdropClick?: boolean;
}

/** @deprecated Use Modal with `<ModalContent variant="takeover" />` instead. */
export function CanvasTakeoverModal({
  open,
  onOpenChange,
  title,
  headerActions,
  sidebar,
  children,
  expanded,
  defaultExpanded,
  onExpandedChange,
  className,
  sidebarClassName,
  closeOnBackdropClick = true,
}: CanvasTakeoverModalProps) {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [open]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        variant="takeover"
        headerTitle={title}
        headerActions={headerActions}
        sidebar={sidebar}
        expanded={expanded}
        defaultExpanded={defaultExpanded}
        onExpandedChange={onExpandedChange}
        className={className}
        sidebarClassName={sidebarClassName}
        closeOnBackdropClick={closeOnBackdropClick}
        overlayTestId="canvas-takeover-backdrop"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement)
            .querySelector<HTMLElement>(
              '[aria-label="Expand modal"], [aria-label="Collapse modal"]'
            )
            ?.focus();
        }}
      >
        {children}
      </ModalContent>
    </Modal>
  );
}
