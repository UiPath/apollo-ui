'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Maximize2, Minimize2, XIcon } from 'lucide-react';
import * as React from 'react';

import {
  type PortalContainerOverride,
  useResolvedPortalContainer,
} from '@/components/ui/portal-container';
import { cn } from '@/lib/index';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

const DialogTrigger = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>(function DialogTrigger(props, ref) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" ref={ref} {...props} />;
});

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

const DialogClose = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>
>(function DialogClose(props, ref) {
  return <DialogPrimitive.Close data-slot="dialog-close" ref={ref} {...props} />;
});

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed flex items-center justify-center inset-0 z-50 bg-curtain',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showCloseButton?: boolean;
    container?: PortalContainerOverride;
    variant?: 'default' | 'takeover';
    headerTitle?: React.ReactNode;
    headerActions?: React.ReactNode;
    sidebar?: React.ReactNode;
    sidebarClassName?: string;
    expanded?: boolean;
    defaultExpanded?: boolean;
    onExpandedChange?: (expanded: boolean) => void;
    closeOnBackdropClick?: boolean;
    overlayProps?: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;
    overlayTestId?: string;
    'data-expanded'?: boolean;
  }
>(function DialogContent(
  {
    className,
    children,
    showCloseButton = true,
    container,
    variant = 'default',
    headerTitle,
    headerActions,
    sidebar,
    sidebarClassName,
    expanded: controlledExpanded,
    defaultExpanded = false,
    onExpandedChange,
    closeOnBackdropClick = true,
    overlayProps,
    overlayTestId,
    'data-expanded': dataExpanded,
    'aria-labelledby': ariaLabelledBy,
    onPointerDownOutside,
    ...props
  },
  ref
) {
  const resolvedContainer = useResolvedPortalContainer(container);
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
  const expanded = controlledExpanded ?? uncontrolledExpanded;
  const isTakeover = variant === 'takeover';

  const setExpanded = (nextExpanded: boolean) => {
    if (controlledExpanded === undefined) setUncontrolledExpanded(nextExpanded);
    onExpandedChange?.(nextExpanded);
  };

  const content = (
    <DialogOverlay
      {...overlayProps}
      data-testid={overlayTestId}
      className={cn(
        isTakeover
          ? cn('!absolute !bg-curtain items-center justify-center', expanded ? 'p-0' : 'p-3')
          : undefined,
        overlayProps?.className
      )}
    >
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-variant={variant}
        data-expanded={isTakeover ? expanded : dataExpanded}
        className={cn(
          isTakeover
            ? 'bg-surface-raised text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 relative z-50 flex min-h-0 w-full flex-col overflow-hidden border border-border-subtle shadow-xl duration-200'
            : 'bg-surface-raised text-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 relative z-50 grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-2xl border border-border-subtle p-6 shadow-xl duration-200 sm:max-w-lg',
          isTakeover && (expanded ? 'h-full w-full' : 'h-[95%] w-[95%] rounded-2xl'),
          className
        )}
        onPointerDownOutside={(event) => {
          if (isTakeover && !closeOnBackdropClick) event.preventDefault();
          onPointerDownOutside?.(event);
        }}
        ref={ref}
        {...props}
        {...(isTakeover && (headerTitle === undefined || headerTitle === null)
          ? { 'aria-labelledby': ariaLabelledBy }
          : ariaLabelledBy
            ? { 'aria-labelledby': ariaLabelledBy }
            : {})}
      >
        {isTakeover ? (
          <>
            <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border-subtle px-4">
              {headerTitle !== undefined && headerTitle !== null ? (
                <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {headerTitle}
                </DialogPrimitive.Title>
              ) : (
                <div className="min-w-0 flex-1" aria-hidden="true" />
              )}
              {headerActions}
              <div className="-mr-1 flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  aria-label={expanded ? 'Collapse modal' : 'Expand modal'}
                  title={expanded ? 'Collapse modal' : 'Expand modal'}
                  onClick={() => setExpanded(!expanded)}
                  className="grid size-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <DialogPrimitive.Close
                  type="button"
                  aria-label="Close modal"
                  className="grid size-8 place-items-center rounded-md text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <XIcon size={16} />
                </DialogPrimitive.Close>
              </div>
            </header>
            <div className="flex min-h-0 flex-1">
              {sidebar != null && (
                <aside
                  className={cn(
                    'w-64 shrink-0 overflow-auto border-r border-border-subtle',
                    sidebarClassName
                  )}
                >
                  {sidebar}
                </aside>
              )}
              <main className="min-w-0 flex-1 overflow-auto">{children}</main>
            </div>
          </>
        ) : (
          <>
            {children}
            {showCloseButton && (
              <DialogPrimitive.Close
                data-slot="dialog-close"
                className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 cursor-pointer rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:cursor-default disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              >
                <XIcon />
                <span className="sr-only">Close</span>
              </DialogPrimitive.Close>
            )}
          </>
        )}
      </DialogPrimitive.Content>
    </DialogOverlay>
  );

  return isTakeover && !container ? (
    content
  ) : (
    <DialogPortal data-slot="dialog-portal" container={resolvedContainer}>
      {content}
    </DialogPortal>
  );
});

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      ref={ref}
      {...props}
    />
  );
});

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-foreground-muted text-sm', className)}
      ref={ref}
      {...props}
    />
  );
});

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

// Modal is the product-facing name. Dialog aliases remain available for
// compatibility with existing consumers and Radix's component vocabulary.
const Modal = Dialog;
const ModalClose = DialogClose;
const ModalContent = DialogContent;
const ModalDescription = DialogDescription;
const ModalFooter = DialogFooter;
const ModalHeader = DialogHeader;
const ModalOverlay = DialogOverlay;
const ModalPortal = DialogPortal;
const ModalTitle = DialogTitle;
const ModalTrigger = DialogTrigger;

export {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalPortal,
  ModalTitle,
  ModalTrigger,
};
