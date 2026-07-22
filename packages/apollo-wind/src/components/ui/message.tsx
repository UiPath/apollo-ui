import * as React from 'react';
import { cn } from '@/lib';

const MessageGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-w-0 flex-col gap-2', className)} {...props} />
  )
);
MessageGroup.displayName = 'MessageGroup';

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end';
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = 'start', ...props }, ref) => (
    <div
      ref={ref}
      data-align={align}
      className={cn(
        'group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse',
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
      className={cn(
        'flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted group-has-[[data-slot=message-footer]]/message:-translate-y-8',
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
      className={cn(
        'flex w-full min-w-0 flex-col gap-2.5 break-words group-data-[align=end]/message:*:self-end',
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
