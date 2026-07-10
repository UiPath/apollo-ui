'use client';

import { MessageScroller as MessageScrollerPrimitive } from '@shadcn/react/message-scroller';
import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';

export {
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from '@shadcn/react/message-scroller';

const MessageScrollerProvider = MessageScrollerPrimitive.Provider;

// No ref prop: the primitive's Root lets an external ref clobber its own
// internal element registration (unlike Viewport/Content/Item, which compose
// refs correctly). Its ref is only used for cosmetic data-scrollable /
// data-autoscrolling attributes, which are also set on Viewport, so nothing
// functional is lost by not supporting it here.
function MessageScroller({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Root>, 'ref'>) {
  return (
    <MessageScrollerPrimitive.Root
      className={cn('relative flex min-h-0 flex-1 flex-col', className)}
      {...props}
    />
  );
}

const MessageScrollerViewport = React.forwardRef<
  React.ElementRef<typeof MessageScrollerPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <MessageScrollerPrimitive.Viewport
    ref={ref}
    className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none', className)}
    {...props}
  />
));
MessageScrollerViewport.displayName = 'MessageScrollerViewport';

const MessageScrollerContent = React.forwardRef<
  React.ElementRef<typeof MessageScrollerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Content>
>(({ className, ...props }, ref) => (
  <MessageScrollerPrimitive.Content
    ref={ref}
    className={cn('flex flex-col gap-4 px-4 py-4', className)}
    {...props}
  />
));
MessageScrollerContent.displayName = 'MessageScrollerContent';

const MessageScrollerItem = React.forwardRef<
  React.ElementRef<typeof MessageScrollerPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Item>
>(({ className, ...props }, ref) => (
  <MessageScrollerPrimitive.Item ref={ref} className={cn('min-w-0', className)} {...props} />
));
MessageScrollerItem.displayName = 'MessageScrollerItem';

const MessageScrollerButton = React.forwardRef<
  React.ElementRef<typeof MessageScrollerPrimitive.Button>,
  React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Button>
>(({ className, children, ...props }, ref) => (
  <MessageScrollerPrimitive.Button
    ref={ref}
    className={cn(
      'absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-opacity hover:bg-surface-overlay data-[active=false]:opacity-0',
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        <ChevronDown size={14} />
        Scroll to latest
      </>
    )}
  </MessageScrollerPrimitive.Button>
));
MessageScrollerButton.displayName = 'MessageScrollerButton';

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
};
