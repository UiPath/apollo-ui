'use client';

import { PanelLeftIcon } from 'lucide-react';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn, composeRefs } from '@/lib/index';
import { SIDEBAR_WIDTH_MOBILE, useSidebar } from './sidebar-context';

// ============================================================================
// Sidebar
// ============================================================================

export interface SidebarProps extends React.ComponentProps<'div'> {
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  /**
   * - `offcanvas`: slides fully out of view when collapsed.
   * - `icon`: collapses to an icon rail.
   * - `none`: static panel for embedding (dialogs, split panes).
   */
  collapsible?: 'offcanvas' | 'icon' | 'none';
}

// Attributes that hide a collapsed off-canvas sidebar's content. Each one the
// sidebar adds is marked so expanding removes only those, never a consumer's own.
const HIDING_ATTRIBUTES = [
  { name: 'inert', value: '' },
  { name: 'aria-hidden', value: 'true' },
] as const;

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    {
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

    // A collapsed off-canvas sidebar is only moved off-screen, so take its content out
    // of the tab order and the accessibility tree. `inert` is set on the DOM nodes
    // directly because React 18 and 19 handle the `inert` prop differently.
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const setContainerRef = React.useMemo(() => composeRefs(containerRef, ref), [ref]);
    const hiddenOffcanvas = collapsible === 'offcanvas' && state === 'collapsed';
    // Only the content is hidden: a SidebarRail stays usable at the viewport edge so a
    // collapsed sidebar can still be reopened from it. While collapsed, a
    // MutationObserver also hides children inserted later (a nested state update or a
    // Suspense boundary resolving), since those don't re-render Sidebar itself.
    React.useEffect(() => {
      const inner = containerRef.current?.querySelector('[data-slot="sidebar-inner"]');
      if (!inner || isMobile) return;

      const sync = () => {
        for (const child of Array.from(inner.children)) {
          if (child.matches('[data-sidebar="rail"]')) continue;
          for (const attr of HIDING_ATTRIBUTES) {
            const marker = `data-sidebar-set-${attr.name}`;
            if (hiddenOffcanvas) {
              // Leave a consumer's own value alone; only add (and mark) what is missing.
              if (!child.hasAttribute(attr.name)) {
                child.setAttribute(attr.name, attr.value);
                child.setAttribute(marker, '');
              }
            } else if (child.hasAttribute(marker)) {
              child.removeAttribute(attr.name);
              child.removeAttribute(marker);
            }
          }
        }
      };

      sync();
      if (!hiddenOffcanvas || typeof MutationObserver === 'undefined') return;
      const observer = new MutationObserver(sync);
      observer.observe(inner, { childList: true });
      return () => observer.disconnect();
    }, [hiddenOffcanvas, isMobile]);

    if (collapsible === 'none') {
      return (
        <div
          ref={ref}
          data-slot="sidebar"
          data-sidebar="sidebar"
          className={cn('flex h-full w-(--sidebar-width) flex-col text-foreground', className)}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            ref={ref}
            {...props}
            data-sidebar="sidebar"
            data-slot="sidebar"
            data-mobile="true"
            className={cn(
              'w-(--sidebar-width) max-w-none bg-surface p-0 text-foreground sm:max-w-none [&>button]:hidden',
              className
            )}
            style={
              { '--sidebar-width': SIDEBAR_WIDTH_MOBILE, ...props.style } as React.CSSProperties
            }
            side={side}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Sidebar</SheetTitle>
              <SheetDescription>Displays the mobile sidebar.</SheetDescription>
            </SheetHeader>
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    return (
      <div
        className="group peer hidden text-foreground data-[side=right]:order-last md:block"
        data-state={state}
        data-collapsible={state === 'collapsed' ? collapsible : ''}
        data-variant={variant}
        data-side={side}
        data-slot="sidebar"
      >
        {/* Reserves the sidebar's space in the page flow on desktop */}
        <div
          data-slot="sidebar-gap"
          className={cn(
            'relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]'
              : 'group-data-[collapsible=icon]:w-(--sidebar-width-icon)'
          )}
        />
        <div
          ref={setContainerRef}
          data-slot="sidebar-container"
          className={cn(
            'fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]'
              : 'border-border-subtle group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l',
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            data-slot="sidebar-inner"
            className="flex h-full w-full flex-col bg-surface group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-border-subtle group-data-[variant=floating]:shadow-sm"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof Button>>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar, open, openMobile, isMobile } = useSidebar();

    return (
      <Button
        ref={ref}
        aria-expanded={isMobile ? openMobile : open}
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        variant="ghost"
        size="2xs"
        icon
        className={className}
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        {...props}
      >
        <PanelLeftIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    );
  }
);
SidebarTrigger.displayName = 'SidebarTrigger';

/**
 * A thin, pointer-only toggle along the sidebar's edge. It's left out of the tab
 * order on purpose (as in shadcn), so it doesn't add an invisible tab stop beside
 * every sidebar. Keyboard users toggle with `SidebarTrigger`, so a layout should
 * always include one. The rail still reports `aria-expanded` for assistive tech.
 */
const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar, open } = useSidebar();

    return (
      <button
        ref={ref}
        aria-expanded={open}
        type="button"
        data-sidebar="rail"
        data-slot="sidebar-rail"
        aria-label="Toggle Sidebar"
        tabIndex={-1}
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        title="Toggle Sidebar"
        className={cn(
          'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border-subtle md:flex',
          'in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize',
          '[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize',
          'group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full hover:group-data-[collapsible=offcanvas]:bg-surface',
          '[[data-side=left][data-collapsible=offcanvas]_&]:-right-2',
          '[[data-side=right][data-collapsible=offcanvas]_&]:-left-2',
          className
        )}
        {...props}
      />
    );
  }
);
SidebarRail.displayName = 'SidebarRail';

const SidebarInset = React.forwardRef<HTMLElement, React.ComponentProps<'main'>>(
  ({ className, ...props }, ref) => (
    <main
      ref={ref}
      data-slot="sidebar-inset"
      className={cn(
        'relative flex w-full flex-1 flex-col bg-background',
        'md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2',
        // Mirror the inset gutter when the sidebar sits on the right.
        'md:peer-data-[variant=inset]:peer-data-[side=right]:mr-0 md:peer-data-[variant=inset]:peer-data-[side=right]:ml-2 md:peer-data-[variant=inset]:peer-data-[side=right]:peer-data-[state=collapsed]:mr-2',
        className
      )}
      {...props}
    />
  )
);
SidebarInset.displayName = 'SidebarInset';

export { Sidebar, SidebarInset, SidebarRail, SidebarTrigger };
