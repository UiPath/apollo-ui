'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import { MessageScroller as MessageScrollerPrimitive } from './primitive';

/**
 * The scroll container for a conversation, styled over the headless MessageScroller in
 * `./primitive` (vendored from shadcn/ui, see the README there). The primitive owns the behaviour:
 * following new content while the reader is at the end, keeping the position when older messages
 * are prepended (`preserveScrollOnPrepend` on the viewport), anchoring a new turn to the top of the
 * viewport (`scrollAnchor` on an item), jumping to a message by id (`useMessageScroller`), and
 * reporting what is in view (`useMessageScrollerVisibility`).
 */

export {
  type MessageScrollerDefaultScrollPosition,
  type MessageScrollerScrollAlign,
  type MessageScrollerScrollable,
  type MessageScrollerScrollOptions,
  type MessageScrollerVisibilityState,
  useMessageScroller,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from './primitive';

const MessageScrollerProvider = MessageScrollerPrimitive.Provider;

export type MessageScrollerProps = React.ComponentPropsWithoutRef<
  typeof MessageScrollerPrimitive.Root
>;

/**
 * The frame around the viewport and the jump button. It takes its height from the consumer:
 * pass `h-*`, `h-full`, or `flex-1` when it sits in a sized flex column. Without a definite
 * height the viewport cannot scroll and the frame grows with the transcript.
 */
const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, ...props }, ref) => (
    <MessageScrollerPrimitive.Root
      ref={ref}
      data-slot="message-scroller"
      className={cn('relative flex min-h-0 flex-col', className)}
      {...props}
    />
  )
);
MessageScroller.displayName = 'MessageScroller';

export interface MessageScrollerViewportStrings {
  /** Accessible name of the scrolling region. */
  label: string;
}

export const DEFAULT_MESSAGE_SCROLLER_VIEWPORT_STRINGS: MessageScrollerViewportStrings = {
  label: 'Messages',
};

export interface MessageScrollerViewportProps
  extends React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Viewport> {
  /** Overrides for any subset of the English strings. An explicit `aria-label` wins over `label`. */
  strings?: Partial<MessageScrollerViewportStrings>;
}

/**
 * The scrolling element, a focusable `region`. Its accessible name comes from `strings.label`
 * (default "Messages"), so hosts should pass translated strings.
 */
const MessageScrollerViewport = React.forwardRef<HTMLDivElement, MessageScrollerViewportProps>(
  ({ className, 'aria-label': ariaLabel, strings, ...props }, ref) => {
    const text = { ...DEFAULT_MESSAGE_SCROLLER_VIEWPORT_STRINGS, ...strings };
    return (
      <MessageScrollerPrimitive.Viewport
        ref={ref}
        data-slot="message-scroller-viewport"
        aria-label={ariaLabel ?? text.label}
        className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain outline-none', className)}
        {...props}
      />
    );
  }
);
MessageScrollerViewport.displayName = 'MessageScrollerViewport';

export type MessageScrollerContentProps = React.ComponentPropsWithoutRef<
  typeof MessageScrollerPrimitive.Content
>;

const MessageScrollerContent = React.forwardRef<HTMLDivElement, MessageScrollerContentProps>(
  ({ className, ...props }, ref) => (
    <MessageScrollerPrimitive.Content
      ref={ref}
      data-slot="message-scroller-content"
      className={cn('flex flex-col gap-4 px-4 py-4', className)}
      {...props}
    />
  )
);
MessageScrollerContent.displayName = 'MessageScrollerContent';

export type MessageScrollerItemProps = React.ComponentPropsWithoutRef<
  typeof MessageScrollerPrimitive.Item
>;

const MessageScrollerItem = React.forwardRef<HTMLDivElement, MessageScrollerItemProps>(
  ({ className, ...props }, ref) => (
    <MessageScrollerPrimitive.Item
      ref={ref}
      data-slot="message-scroller-item"
      className={cn('min-w-0', className)}
      {...props}
    />
  )
);
MessageScrollerItem.displayName = 'MessageScrollerItem';

export interface MessageScrollerButtonStrings {
  /** Label of the jump button when it leads to the newest message. */
  scrollToLatest: string;
  /** Label of the jump button when `direction="start"` leads to the oldest message. */
  scrollToStart: string;
}

export const DEFAULT_MESSAGE_SCROLLER_BUTTON_STRINGS: MessageScrollerButtonStrings = {
  scrollToLatest: 'Scroll to latest',
  scrollToStart: 'Scroll to start',
};

export interface MessageScrollerButtonProps
  extends React.ComponentPropsWithoutRef<typeof MessageScrollerPrimitive.Button> {
  /** Overrides for any subset of the English strings. Ignored when `children` is given. */
  strings?: Partial<MessageScrollerButtonStrings>;
}

/**
 * The jump button, shown only while the viewport is away from its `direction` edge. The primitive
 * sets `data-active`; this styling fades the button out rather than unmounting it so the position
 * is stable.
 */
const MessageScrollerButton = React.forwardRef<HTMLButtonElement, MessageScrollerButtonProps>(
  ({ className, children, direction = 'end', strings, ...props }, ref) => {
    const text = { ...DEFAULT_MESSAGE_SCROLLER_BUTTON_STRINGS, ...strings };
    return (
      <MessageScrollerPrimitive.Button
        ref={ref}
        data-slot="message-scroller-button"
        direction={direction}
        className={cn(
          'absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center justify-center gap-1.5 rounded-full border border-border-subtle bg-card px-3 py-1.5 text-xs font-medium text-foreground shadow-md transition-opacity hover:bg-surface-overlay data-[active=false]:pointer-events-none data-[active=false]:opacity-0',
          direction === 'start' && 'top-3 bottom-auto',
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <ChevronDown size={14} className={cn(direction === 'start' && 'rotate-180')} />
            {direction === 'start' ? text.scrollToStart : text.scrollToLatest}
          </>
        )}
      </MessageScrollerPrimitive.Button>
    );
  }
);
MessageScrollerButton.displayName = 'MessageScrollerButton';

export {
  MessageScrollerProvider,
  MessageScroller,
  MessageScrollerViewport,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerButton,
};
