'use client';

import * as React from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/index';

// Adapted from shadcn/ui Sidebar (Radix build). Library changes from upstream:
// - No cookie persistence. Persist `open` yourself through `onOpenChange`.
// - The Cmd/Ctrl+B shortcut is opt-in (`keyboardShortcut`), so it can't steal
//   Bold from editors or toggle every provider on the page at once.
// - Colors use Apollo tokens instead of a separate `--sidebar-*` palette.
// - An embedded sidebar (`collapsible="none"`) inherits its container's
//   background, so it sits flush inside dialogs and panels.

const SIDEBAR_WIDTH = '16rem';
export const SIDEBAR_WIDTH_MOBILE = '18rem';
const SIDEBAR_WIDTH_ICON = '3rem';
const SIDEBAR_KEYBOARD_SHORTCUT = 'b';
const MOBILE_BREAKPOINT = 768;

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}

// ============================================================================
// Context
// ============================================================================

type SidebarContextProps = {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.');
  }
  return context;
}

/**
 * Wraps the sidebar and the content next to it. By default the wrapper fills at
 * least the viewport height (`min-h-svh`), which suits a full-page app layout.
 * When embedding a `collapsible="none"` sidebar in a dialog, card or split pane,
 * pass `className="min-h-0"` (plus a height such as `h-full`) so it sizes to its
 * container instead.
 */
export interface SidebarProviderProps extends React.ComponentProps<'div'> {
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Controlled open state. */
  open?: boolean;
  /** Called when the open state changes. Use it to persist the state. */
  onOpenChange?: (open: boolean) => void;
  /** Toggle the sidebar with Cmd/Ctrl+B. Off by default. */
  keyboardShortcut?: boolean;
}

const SidebarProvider = React.forwardRef<HTMLDivElement, SidebarProviderProps>(
  (
    {
      defaultOpen = true,
      open: openProp,
      onOpenChange: setOpenProp,
      keyboardShortcut = false,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobile, setOpenMobile] = React.useState(false);

    const [_open, _setOpen] = React.useState(defaultOpen);
    const open = openProp ?? _open;
    const setOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(open) : value;
        // Only `open` makes the sidebar controlled. `onOpenChange` alone just observes.
        if (openProp === undefined) {
          _setOpen(openState);
        }
        setOpenProp?.(openState);
      },
      [setOpenProp, openProp, open]
    );

    const toggleSidebar = React.useCallback(() => {
      return isMobile ? setOpenMobile((value) => !value) : setOpen((value) => !value);
    }, [isMobile, setOpen]);

    React.useEffect(() => {
      if (!keyboardShortcut) return;
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          toggleSidebar();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [keyboardShortcut, toggleSidebar]);

    const state = open ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContextProps>(
      () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
      [state, open, setOpen, isMobile, openMobile, toggleSidebar]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            ref={ref}
            data-slot="sidebar-wrapper"
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              'group/sidebar-wrapper flex min-h-svh w-full has-data-[variant=inset]:bg-surface',
              className
            )}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

/**
 * Capture-phase click handler for `aria-disabled` items. `aria-disabled` only
 * announces the state and the disabled styles only block pointer input, so this
 * also stops Enter on a focused link. Running in the capture phase matters for
 * `asChild`: Radix Slot runs the child's own `onClick` before the slot's, and a
 * capture handler that stops propagation keeps both from firing.
 */
function guardDisabledClick<E extends HTMLElement>(
  ariaDisabled: React.AriaAttributes['aria-disabled'],
  onClickCapture: React.MouseEventHandler<E> | undefined
): React.MouseEventHandler<E> {
  return (event) => {
    if (ariaDisabled === true || ariaDisabled === 'true') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClickCapture?.(event);
  };
}

export { guardDisabledClick, SidebarProvider, useSidebar };
