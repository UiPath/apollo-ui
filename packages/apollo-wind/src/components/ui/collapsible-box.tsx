'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib';

/**
 * Bordered, collapsible box that groups related content, such as a set of
 * fields in a properties panel. Compose it from a header (trigger plus optional
 * actions) and a body.
 *
 * Open by default. Pass `open` / `onOpenChange` to control it.
 */
const CollapsibleBox = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Root>
>(({ className, defaultOpen = true, ...props }, ref) => (
  <CollapsiblePrimitive.Root
    ref={ref}
    data-slot="collapsible-box"
    defaultOpen={defaultOpen}
    className={cn(
      'overflow-hidden rounded-2xl border border-border-subtle bg-transparent',
      className
    )}
    {...props}
  />
));
CollapsibleBox.displayName = 'CollapsibleBox';

/**
 * Header row. Holds the trigger and, after it, any actions. The open-state
 * divider reads its own direct trigger's state, so an open outer box does not
 * draw it on a closed one nested inside.
 */
const CollapsibleBoxHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="collapsible-box-header"
      className={cn(
        'flex min-h-11 items-center gap-1 pr-2 has-[>[data-slot=collapsible-box-trigger][data-state=open]]:border-b has-[>[data-slot=collapsible-box-trigger][data-state=open]]:border-border-subtle',
        className
      )}
      {...props}
    />
  )
);
CollapsibleBoxHeader.displayName = 'CollapsibleBoxHeader';

/**
 * Chevron and title. Toggles the box. It renders its own button, so
 * Radix's `asChild` is not supported.
 */
const CollapsibleBoxTrigger = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Trigger>,
  Omit<React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Trigger>, 'asChild'>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Trigger
    ref={ref}
    data-slot="collapsible-box-trigger"
    className={cn(
      'flex min-w-0 flex-1 cursor-pointer items-center gap-2 self-stretch py-2.5 pl-3 text-left text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&[data-state=closed]>svg]:-rotate-90',
      className
    )}
    {...props}
  >
    <ChevronDown
      aria-hidden="true"
      className="size-4 shrink-0 text-foreground-muted transition-transform duration-150"
    />
    <span className="min-w-0 flex-1 truncate">{children}</span>
  </CollapsiblePrimitive.Trigger>
));
CollapsibleBoxTrigger.displayName = 'CollapsibleBoxTrigger';

/** Trailing slot for header actions, such as a more-actions menu. */
const CollapsibleBoxActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="collapsible-box-actions"
    className={cn('flex shrink-0 items-center gap-1', className)}
    {...props}
  />
));
CollapsibleBoxActions.displayName = 'CollapsibleBoxActions';

/**
 * Body. Hidden while the box is collapsed. It wraps its children in its own
 * padded grid, so Radix's `asChild` is not supported.
 */
const CollapsibleBoxContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  Omit<React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>, 'asChild'>
>(({ className, children, ...props }, ref) => (
  <CollapsiblePrimitive.Content
    ref={ref}
    data-slot="collapsible-box-content"
    className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down"
    {...props}
  >
    <div className={cn('grid gap-4 p-3', className)}>{children}</div>
  </CollapsiblePrimitive.Content>
));
CollapsibleBoxContent.displayName = 'CollapsibleBoxContent';

export {
  CollapsibleBox,
  CollapsibleBoxActions,
  CollapsibleBoxContent,
  CollapsibleBoxHeader,
  CollapsibleBoxTrigger,
};
