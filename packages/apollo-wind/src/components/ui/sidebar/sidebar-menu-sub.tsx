'use client';

import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { cn } from '@/lib/index';
import { guardDisabledClick } from './sidebar-context';

// ============================================================================
// Sub-menu
// ============================================================================

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        'mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l border-border-subtle px-2.5 py-0.5',
        'group-data-[collapsible=icon]:hidden',
        className
      )}
      {...props}
    />
  )
);
SidebarMenuSub.displayName = 'SidebarMenuSub';

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<'li'>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn('group/menu-sub-item relative', className)}
      {...props}
    />
  )
);
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

export interface SidebarMenuSubButtonProps extends React.ComponentProps<'a'> {
  asChild?: boolean;
  size?: 'sm' | 'md';
  /** Marks the item as the current selection. Sets `data-active` and `aria-current="true"` (pass `aria-current="page"` for route links). */
  isActive?: boolean;
}

const SidebarMenuSubButton = React.forwardRef<HTMLAnchorElement, SidebarMenuSubButtonProps>(
  (
    {
      asChild = false,
      size = 'md',
      isActive = false,
      className,
      onClick,
      onClickCapture,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'a';

    return (
      <Comp
        ref={ref}
        data-slot="sidebar-menu-sub-button"
        data-sidebar="menu-sub-button"
        data-size={size}
        data-active={isActive}
        aria-current={isActive ? 'true' : undefined}
        className={cn(
          'flex h-7 min-w-0 -translate-x-px cursor-pointer items-center gap-2 overflow-hidden rounded-md px-2 text-foreground ring-ring outline-hidden hover:bg-background-hover focus-visible:ring-2 active:bg-background-hover disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-foreground-muted',
          'data-[active=true]:bg-surface-selected data-[active=true]:hover:bg-surface-selected data-[active=true]:text-foreground',
          size === 'sm' && 'text-xs',
          size === 'md' && 'text-sm',
          'group-data-[collapsible=icon]:hidden',
          className
        )}
        {...props}
        onClick={onClick}
        onClickCapture={guardDisabledClick(props['aria-disabled'], onClickCapture)}
      />
    );
  }
);
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

export { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem };
