'use client';

import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';

import { cn, composeRefs } from '@/lib';

// Open state of the nearest CollapsibleBox, read by a kept-mounted body to hide itself.
const CollapsibleBoxOpenContext = React.createContext(true);

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
>(({ className, open: openProp, defaultOpen = true, onOpenChange, ...props }, ref) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;
  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  return (
    <CollapsibleBoxOpenContext.Provider value={open}>
      <CollapsiblePrimitive.Root
        ref={ref}
        data-slot="collapsible-box"
        open={open}
        onOpenChange={handleOpenChange}
        className={cn(
          'overflow-hidden rounded-2xl border border-border-subtle bg-transparent',
          className
        )}
        {...props}
      />
    </CollapsibleBoxOpenContext.Provider>
  );
});
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

interface CollapsibleBoxContentProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.Content>,
    'asChild' | 'forceMount'
  > {
  /**
   * Keep the body mounted while the box is collapsed, so its controls keep
   * their local state and stay in native form submission. While collapsed it
   * is hidden, inert and out of the tab order. Defaults to `false`: the body
   * unmounts when collapsed.
   */
  keepMounted?: boolean;
}

/**
 * Body. Hidden while the box is collapsed: unmounted by default, or kept
 * mounted but hidden and inert with `keepMounted`. It wraps its children in its
 * own padded grid, so Radix's `asChild` is not supported. Use `keepMounted`
 * instead of Radix's `forceMount`, which would let the collapsed body spring
 * back open after its close animation.
 */
const CollapsibleBoxContent = React.forwardRef<
  React.ElementRef<typeof CollapsiblePrimitive.Content>,
  CollapsibleBoxContentProps
>(({ className, children, keepMounted = false, onAnimationEnd, ...props }, ref) => {
  const open = React.useContext(CollapsibleBoxOpenContext);
  // A kept-mounted body that has finished collapsing (or started collapsed) is
  // hidden outright. Until its close animation ends, the animation's final
  // frame (zero height) holds it shut.
  const [settledClosed, setSettledClosed] = React.useState(!open);
  if (open && settledClosed) setSettledClosed(false);

  // `inert` is set on the DOM node because React 18 and 19 handle the prop differently.
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const setContentRef = React.useMemo(() => composeRefs(contentRef, ref), [ref]);
  const inert = keepMounted && !open;
  React.useEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    if (inert) node.setAttribute('inert', '');
    else node.removeAttribute('inert');
  }, [inert]);

  return (
    <CollapsiblePrimitive.Content
      ref={setContentRef}
      data-slot="collapsible-box-content"
      className={cn(
        'overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down',
        keepMounted && 'data-[state=closed]:[animation-fill-mode:forwards]'
      )}
      {...props}
      forceMount={keepMounted || undefined}
      hidden={keepMounted ? !open && settledClosed : undefined}
      onAnimationEnd={(event) => {
        onAnimationEnd?.(event);
        if (keepMounted && !open && event.target === event.currentTarget) {
          setSettledClosed(true);
        }
      }}
    >
      <div className={cn('grid gap-4 p-3', className)}>{children}</div>
    </CollapsiblePrimitive.Content>
  );
});
CollapsibleBoxContent.displayName = 'CollapsibleBoxContent';

export type { CollapsibleBoxContentProps };

export {
  CollapsibleBox,
  CollapsibleBoxActions,
  CollapsibleBoxContent,
  CollapsibleBoxHeader,
  CollapsibleBoxTrigger,
};
