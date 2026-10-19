import * as React from 'react';
import { cn } from '@/lib';

/**
 * Chat conversation row primitives, ported from shadcn/ui's chat components. A `Message` lays out
 * one turn: an optional `MessageAvatar`, then `MessageContent` holding a `MessageHeader`, the body
 * (usually a `Bubble`) and a `MessageFooter`. `align="end"` mirrors the row for the current user.
 * A `MessageActions` bar goes inside `MessageContent` after the body, so it takes the same
 * alignment as the bubble.
 *
 * Compact density: inside an ancestor with `data-density="compact"` the text drops to 12px and
 * the gaps between a group's messages and between a message's parts halve, as Material's
 * `compactMode` does.
 * There is no prop: the host opts in by setting the attribute (the Wind chat sets it on its root).
 * Compact sets CSS variables the base classes read, so a host className on the root wins in
 * both densities.
 */

const MessageGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="message-group"
      className={cn(
        'flex min-w-0 flex-col gap-(--message-group-gap,0.5rem) in-data-[density=compact]:[--message-group-gap:0.25rem]',
        className
      )}
      {...props}
    />
  )
);
MessageGroup.displayName = 'MessageGroup';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** `end` mirrors the row so the avatar and bubble sit on the trailing edge. */
  align?: 'start' | 'end';
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = 'start', ...props }, ref) => (
    <div
      ref={ref}
      data-slot="message"
      data-align={align}
      className={cn(
        'group/message relative flex w-full min-w-0 gap-2 text-(length:--message-font-size,0.875rem) leading-(--message-leading,1.25rem) data-[align=end]:flex-row-reverse in-data-[density=compact]:[--message-font-size:0.75rem] in-data-[density=compact]:[--message-leading:1rem]',
        className
      )}
      {...props}
    />
  )
);
Message.displayName = 'Message';

const MessageAvatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="message-avatar"
      className={cn(
        // Sits level with the bubble, not the footer or action bar, when those are present.
        // Compact halves the content gap (10px to 5px), so each offset loses 5px per gap.
        'flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-[[data-slot=message-footer]]/message:-translate-y-8 group-has-[[data-slot=message-actions]]/message:-translate-y-10 group-has-[[data-slot=message-footer]]/message:group-has-[[data-slot=message-actions]]/message:-translate-y-16 in-data-[density=compact]:group-has-[[data-slot=message-footer]]/message:-translate-y-6.75 in-data-[density=compact]:group-has-[[data-slot=message-actions]]/message:-translate-y-8.75 in-data-[density=compact]:group-has-[[data-slot=message-footer]]/message:group-has-[[data-slot=message-actions]]/message:-translate-y-13.5',
        className
      )}
      {...props}
    />
  )
);
MessageAvatar.displayName = 'MessageAvatar';

const MessageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="message-content"
      className={cn(
        'flex w-full min-w-0 flex-col gap-(--message-content-gap,0.625rem) break-words group-data-[align=end]/message:*:self-end in-data-[density=compact]:[--message-content-gap:0.3125rem]',
        className
      )}
      {...props}
    />
  )
);
MessageContent.displayName = 'MessageContent';

const MessageHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="message-header"
      className={cn(
        'flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  )
);
MessageHeader.displayName = 'MessageHeader';

const MessageFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-slot="message-footer"
      className={cn(
        'flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-muted-foreground group-data-[align=end]/message:justify-end',
        className
      )}
      {...props}
    />
  )
);
MessageFooter.displayName = 'MessageFooter';

export { MessageGroup, Message, MessageAvatar, MessageContent, MessageHeader, MessageFooter };
