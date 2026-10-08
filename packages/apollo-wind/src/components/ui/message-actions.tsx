'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Copy, Ellipsis, ThumbsDown, ThumbsUp } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import { Button, type ButtonProps } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Toggle } from './toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

/**
 * The action bar under a chat message: copy, feedback and host-defined actions. Render it inside
 * `MessageContent` after the body so it follows the message `align`.
 *
 * API: `children` render as given (use the built-ins `MessageActionCopy`, `MessageActionFeedback`
 * or any `MessageAction`). Host actions passed as data through `actions` render after them, and
 * any beyond `maxVisible` move into a trailing "More" menu. Data, not children, because a menu
 * item and a toolbar button need different elements.
 */

export interface MessageActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  /** Tints the item in the overflow menu. */
  destructive?: boolean;
  disabled?: boolean;
}

export interface MessageActionsStrings {
  /** Accessible name of the toolbar. */
  label: string;
  /** Label of the overflow menu trigger. */
  more: string;
}

export const DEFAULT_MESSAGE_ACTIONS_STRINGS: MessageActionsStrings = {
  label: 'Message actions',
  more: 'More actions',
};

const messageActionsVariants = cva('flex w-fit max-w-full items-center gap-0.5 px-2', {
  variants: {
    visibility: {
      always: '',
      // Revealed by hovering or focusing the message, kept while a menu or tooltip from the bar is
      // open, and always shown on devices that cannot hover.
      hover:
        'opacity-0 transition-opacity group-hover/message:opacity-100 group-focus-within/message:opacity-100 focus-within:opacity-100 has-[[data-state=open]]:opacity-100 has-[[data-state=delayed-open]]:opacity-100 has-[[data-state=instant-open]]:opacity-100 [@media(hover:none)]:opacity-100',
    },
  },
  defaultVariants: {
    visibility: 'always',
  },
});

export interface MessageActionsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof messageActionsVariants> {
  /** Host actions as data. Those beyond `maxVisible` go into the overflow menu. */
  actions?: MessageActionItem[];
  /** How many of `actions` show as buttons. `children` are not counted. Defaults to all. */
  maxVisible?: number;
  /** Overrides for any subset of the English strings. An explicit `aria-label` wins over `label`. */
  strings?: Partial<MessageActionsStrings>;
}

const MessageActions = React.forwardRef<HTMLDivElement, MessageActionsProps>(
  (
    {
      className,
      visibility = 'always',
      actions = [],
      maxVisible,
      strings,
      'aria-label': ariaLabel,
      children,
      ...props
    },
    ref
  ) => {
    const text = { ...DEFAULT_MESSAGE_ACTIONS_STRINGS, ...strings };
    const limit = maxVisible === undefined ? actions.length : Math.max(0, maxVisible);
    const visible = actions.slice(0, limit);
    const overflow = actions.slice(limit);

    return (
      // Self-contained so hosts need no provider; also groups the tooltips' skip delay.
      <TooltipProvider delayDuration={300} skipDelayDuration={150}>
        <div
          ref={ref}
          role="toolbar"
          aria-label={ariaLabel ?? text.label}
          data-slot="message-actions"
          data-visibility={visibility}
          className={cn(messageActionsVariants({ visibility }), className)}
          {...props}
        >
          {children}
          {visible.map((action) => (
            <MessageAction
              key={action.id}
              label={action.label}
              disabled={action.disabled}
              onClick={action.onSelect}
            >
              {action.icon}
            </MessageAction>
          ))}
          {overflow.length > 0 && (
            <MessageActionsOverflow items={overflow} strings={{ more: text.more }} />
          )}
        </div>
      </TooltipProvider>
    );
  }
);
MessageActions.displayName = 'MessageActions';

export interface MessageActionProps extends ButtonProps {
  /** Accessible name and tooltip text. */
  label: string;
  tooltipSide?: React.ComponentPropsWithoutRef<typeof TooltipContent>['side'];
}

/** A ghost icon button with a tooltip. Use inside `MessageActions`, which provides the tooltips. */
const MessageAction = React.forwardRef<HTMLButtonElement, MessageActionProps>(
  (
    { label, tooltipSide = 'bottom', variant = 'ghost', size = '3xs', icon = true, ...props },
    ref
  ) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          data-slot="message-action"
          aria-label={label}
          variant={variant}
          size={size}
          icon={icon}
          {...props}
        />
      </TooltipTrigger>
      <TooltipContent side={tooltipSide}>{label}</TooltipContent>
    </Tooltip>
  )
);
MessageAction.displayName = 'MessageAction';

export interface MessageActionCopyStrings {
  copy: string;
  copied: string;
}

export const DEFAULT_MESSAGE_ACTION_COPY_STRINGS: MessageActionCopyStrings = {
  copy: 'Copy',
  copied: 'Copied',
};

const COPIED_RESET_MS = 1500;

export interface MessageActionCopyProps
  extends Omit<MessageActionProps, 'label' | 'children' | 'onCopy'> {
  /** The text written to the clipboard. */
  text: string;
  /** Called after the clipboard write succeeds. */
  onCopy?: (text: string) => void;
  strings?: Partial<MessageActionCopyStrings>;
}

const MessageActionCopy = React.forwardRef<HTMLButtonElement, MessageActionCopyProps>(
  ({ text, onCopy, strings, onClick, ...props }, ref) => {
    const labels = { ...DEFAULT_MESSAGE_ACTION_COPY_STRINGS, ...strings };
    const [copied, setCopied] = React.useState(false);
    const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    React.useEffect(() => () => clearTimeout(timer.current), []);

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Denied or unavailable: leave the icon alone rather than claim success.
        return;
      }
      onCopy?.(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), COPIED_RESET_MS);
    };

    return (
      <>
        <MessageAction
          ref={ref}
          data-copied={copied || undefined}
          label={copied ? labels.copied : labels.copy}
          onClick={handleClick}
          {...props}
        >
          {copied ? <Check /> : <Copy />}
        </MessageAction>
        {/* A changed aria-label is not announced, so confirm the copy through a live region. */}
        <output aria-live="polite" className="sr-only">
          {copied ? labels.copied : ''}
        </output>
      </>
    );
  }
);
MessageActionCopy.displayName = 'MessageActionCopy';

export type MessageFeedbackValue = 'up' | 'down' | null;

export interface MessageActionFeedbackStrings {
  /** Accessible name of the pair. */
  label: string;
  helpful: string;
  notHelpful: string;
}

export const DEFAULT_MESSAGE_ACTION_FEEDBACK_STRINGS: MessageActionFeedbackStrings = {
  label: 'Rate this response',
  helpful: 'Helpful',
  notHelpful: 'Not helpful',
};

export interface MessageActionFeedbackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Controlled rating. Pressing the active thumb again clears it to `null`. */
  value?: MessageFeedbackValue;
  defaultValue?: MessageFeedbackValue;
  onChange?: (value: MessageFeedbackValue) => void;
  disabled?: boolean;
  strings?: Partial<MessageActionFeedbackStrings>;
}

// The tooltip trigger overwrites the toggle's data-state, so the pressed look keys off aria-pressed.
const feedbackToggleClass =
  'size-6 min-w-6 px-0 aria-pressed:bg-accent aria-pressed:text-accent-foreground future:aria-pressed:text-foreground';

/** Thumbs up and down as two toggles, so each reports `aria-pressed`. */
const MessageActionFeedback = React.forwardRef<HTMLDivElement, MessageActionFeedbackProps>(
  (
    {
      value: valueProp,
      defaultValue = null,
      onChange,
      disabled,
      strings,
      className,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const labels = { ...DEFAULT_MESSAGE_ACTION_FEEDBACK_STRINGS, ...strings };
    const [uncontrolled, setUncontrolled] = React.useState<MessageFeedbackValue>(defaultValue);
    const value = valueProp === undefined ? uncontrolled : valueProp;

    const set = (next: MessageFeedbackValue) => {
      if (valueProp === undefined) setUncontrolled(next);
      onChange?.(next);
    };

    const thumbs = [
      { rating: 'up' as const, label: labels.helpful, icon: <ThumbsUp /> },
      { rating: 'down' as const, label: labels.notHelpful, icon: <ThumbsDown /> },
    ];

    return (
      // biome-ignore lint/a11y/useSemanticElements: role="group" names the pair without fieldset chrome
      <div
        ref={ref}
        role="group"
        aria-label={ariaLabel ?? labels.label}
        data-slot="message-action-feedback"
        data-value={value ?? undefined}
        className={cn('flex items-center gap-0.5', className)}
        {...props}
      >
        {thumbs.map(({ rating, label, icon }) => (
          <Tooltip key={rating}>
            <TooltipTrigger asChild>
              <Toggle
                data-slot="message-action"
                size="xs"
                className={feedbackToggleClass}
                aria-label={label}
                pressed={value === rating}
                onPressedChange={(pressed) => set(pressed ? rating : null)}
                disabled={disabled}
              >
                {icon}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }
);
MessageActionFeedback.displayName = 'MessageActionFeedback';

export interface MessageActionsOverflowProps
  extends Omit<MessageActionProps, 'label' | 'children'> {
  items: MessageActionItem[];
  /** Only `more` is read here. */
  strings?: Partial<Pick<MessageActionsStrings, 'more'>>;
  align?: React.ComponentPropsWithoutRef<typeof DropdownMenuContent>['align'];
}

const MessageActionsOverflow = React.forwardRef<HTMLButtonElement, MessageActionsOverflowProps>(
  ({ items, strings, align = 'start', ...props }, ref) => {
    const more = strings?.more ?? DEFAULT_MESSAGE_ACTIONS_STRINGS.more;
    return (
      <DropdownMenu>
        <Tooltip>
          {/* Menu trigger outermost so its data-state (open) wins and keeps a hover bar visible. */}
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                ref={ref}
                data-slot="message-actions-overflow"
                aria-label={more}
                variant="ghost"
                size="3xs"
                icon
                {...props}
              >
                <Ellipsis />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent side="bottom">{more}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align={align}>
          {items.map((item) => (
            <DropdownMenuItem
              key={item.id}
              disabled={item.disabled}
              onSelect={item.onSelect}
              className={cn(
                item.destructive &&
                  'text-destructive focus:bg-destructive/10 focus:text-destructive'
              )}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
);
MessageActionsOverflow.displayName = 'MessageActionsOverflow';

export {
  MessageActions,
  MessageAction,
  MessageActionCopy,
  MessageActionFeedback,
  MessageActionsOverflow,
  messageActionsVariants,
};
