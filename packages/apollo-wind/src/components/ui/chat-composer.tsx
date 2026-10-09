'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { ArrowUp, CircleAlert, FileText, Paperclip, Square, TriangleAlert, X } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib';
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  type AttachmentState,
  AttachmentTitle,
} from './attachment';
import { Button, type ButtonProps } from './button';
import { type FileRejection, type FileValidationOptions, validateFiles } from './file-validation';
import {
  InputGroup,
  InputGroupBody,
  InputGroupButton,
  type InputGroupProps,
  InputGroupRow,
  InputGroupTextarea,
  type InputGroupTextareaProps,
} from './input-group';

/**
 * The prompt input of a chat. `ChatComposer` is the form and owns the draft, the status and the
 * attachments; its parts read them from context:
 *
 * ```tsx
 * <ChatComposer onSubmit={send} status={status} onStop={stop}>
 *   <ChatComposerError />
 *   <ChatComposerInputGroup>
 *     <ChatComposerAttachments />
 *     <ChatComposerTextarea />
 *     <ChatComposerToolbar>
 *       <ChatComposerAttachButton onFiles={add} />
 *       <ChatComposerSubmit />
 *     </ChatComposerToolbar>
 *   </ChatComposerInputGroup>
 *   <ChatComposerFooter />
 * </ChatComposer>
 * ```
 *
 * Enter sends and Shift+Enter starts a new line. While `status` is `streaming` the submit button
 * becomes a stop button and Enter does not send.
 */

export interface ChatComposerStrings {
  /** Accessible name of the textarea. */
  label: string;
  placeholder: string;
  send: string;
  stop: string;
  attach: string;
  removeAttachment: (name: string) => string;
  dismissError: string;
}

export const DEFAULT_CHAT_COMPOSER_STRINGS: ChatComposerStrings = {
  label: 'Message',
  placeholder: 'Ask anything',
  send: 'Send message',
  stop: 'Stop generating',
  attach: 'Attach files',
  removeAttachment: (name) => `Remove ${name}`,
  dismissError: 'Dismiss',
};

export type ChatComposerStatus = 'idle' | 'streaming';
export type ChatComposerDensity = 'comfortable' | 'compact';

/** One chip in `ChatComposerAttachments`. The consumer owns the list and its upload states. */
export interface ChatComposerAttachmentItem {
  id: string;
  name: string;
  /** Second line, such as the size, or the reason an upload failed. */
  description?: React.ReactNode;
  state?: AttachmentState;
  /** Replaces the default file icon. */
  icon?: React.ReactNode;
  /** An image URL shown as a thumbnail instead of the icon. */
  previewUrl?: string;
}

export interface ChatComposerSubmitDetails {
  attachments: ChatComposerAttachmentItem[];
}

/** What `useChatComposer` gives a custom part. */
export interface ChatComposerContextValue {
  value: string;
  /** Replaces the draft, through `onValueChange` when controlled. */
  setValue: (value: string) => void;
  status: ChatComposerStatus;
  density: ChatComposerDensity;
  disabled: boolean;
  strings: ChatComposerStrings;
  attachments: ChatComposerAttachmentItem[];
  onRemoveAttachment?: (attachment: ChatComposerAttachmentItem) => void;
  onStop?: () => void;
  canSubmit: boolean;
  /** Sends the draft, if `canSubmit`. */
  submit: () => void;
}

// The shared file input stays internal, so every pick goes through ChatComposerAttachButton's
// checks.
interface ChatComposerInternalContextValue extends ChatComposerContextValue {
  openFilePicker: (options: ChatComposerFilePickerOptions) => void;
}

interface ChatComposerFilePickerOptions {
  accept?: string;
  multiple?: boolean;
  onFiles?: (files: File[]) => void;
}

const ChatComposerContext = React.createContext<ChatComposerInternalContextValue | null>(null);

function useChatComposerInternal(): ChatComposerInternalContextValue {
  const context = React.useContext(ChatComposerContext);
  if (!context) throw new Error('ChatComposer parts must be rendered inside <ChatComposer>.');
  return context;
}

/** The enclosing `ChatComposer`'s state and actions, for custom parts. */
function useChatComposer(): ChatComposerContextValue {
  return useChatComposerInternal();
}

const chatComposerVariants = cva('flex w-full min-w-0 flex-col', {
  variants: {
    density: {
      comfortable: 'gap-2',
      compact: 'gap-1.5',
    },
  },
  defaultVariants: {
    density: 'comfortable',
  },
});

export interface ChatComposerProps
  extends Omit<React.FormHTMLAttributes<HTMLFormElement>, 'onSubmit' | 'defaultValue'>,
    VariantProps<typeof chatComposerVariants> {
  /** Controls the draft. Clear it yourself in `onSubmit`. */
  value?: string;
  defaultValue?: string;
  /** Called on every edit, and with `''` when an uncontrolled draft clears after sending. */
  onValueChange?: (value: string) => void;
  /** Called with the draft when the user sends. An uncontrolled draft clears itself after. */
  onSubmit?: (value: string, details: ChatComposerSubmitDetails) => void;
  /** `streaming` turns the submit button into a stop button and holds back Enter. */
  status?: ChatComposerStatus;
  /**
   * Called by the stop button while `status` is `streaming`. Without it, there is no stop button.
   */
  onStop?: () => void;
  disabled?: boolean;
  /** Holds back sending, by button and by Enter, while the textarea stays editable. */
  submitDisabled?: boolean;
  /**
   * Files attached to the draft, rendered by `ChatComposerAttachments`. One still uploading or
   * processing holds back sending.
   */
  attachments?: ChatComposerAttachmentItem[];
  /** Adds a remove action to every attachment chip. */
  onRemoveAttachment?: (attachment: ChatComposerAttachmentItem) => void;
  /** Overrides for any subset of the English strings. */
  strings?: Partial<ChatComposerStrings>;
}

const NO_ATTACHMENTS: ChatComposerAttachmentItem[] = [];

const ChatComposer = React.forwardRef<HTMLFormElement, ChatComposerProps>(
  (
    {
      className,
      children,
      value: valueProp,
      defaultValue,
      onValueChange,
      onSubmit,
      status = 'idle',
      onStop,
      disabled = false,
      submitDisabled = false,
      density,
      attachments = NO_ATTACHMENTS,
      onRemoveAttachment,
      strings,
      ...props
    },
    ref
  ) => {
    const resolvedDensity: ChatComposerDensity = density ?? 'comfortable';
    const controlled = valueProp !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue ?? '');
    const value = controlled ? valueProp : uncontrolledValue;
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const onFilesRef = React.useRef<((files: File[]) => void) | undefined>(undefined);

    const attachmentsBusy = attachments.some(
      ({ state }) => state === 'uploading' || state === 'processing'
    );
    const canSubmit =
      !disabled &&
      !submitDisabled &&
      !attachmentsBusy &&
      status === 'idle' &&
      (value.trim() !== '' || attachments.length > 0);

    const setValue = React.useCallback(
      (next: string) => {
        if (!controlled) setUncontrolledValue(next);
        onValueChange?.(next);
      },
      [controlled, onValueChange]
    );

    const submit = React.useCallback(() => {
      if (!canSubmit) return;
      onSubmit?.(value, { attachments });
      if (!controlled) setValue('');
    }, [canSubmit, onSubmit, value, attachments, controlled, setValue]);

    // One hidden input serves every attach button, so each button stays a single element that a
    // Tooltip trigger can wrap.
    const openFilePicker = React.useCallback(
      ({ accept, multiple = true, onFiles }: ChatComposerFilePickerOptions) => {
        const input = fileInputRef.current;
        if (!input) return;
        input.accept = accept ?? '';
        input.multiple = multiple;
        onFilesRef.current = onFiles;
        input.click();
      },
      []
    );

    const text = React.useMemo(() => ({ ...DEFAULT_CHAT_COMPOSER_STRINGS, ...strings }), [strings]);

    const context = React.useMemo<ChatComposerInternalContextValue>(
      () => ({
        value,
        setValue,
        status,
        density: resolvedDensity,
        disabled,
        strings: text,
        attachments,
        onRemoveAttachment,
        onStop,
        canSubmit,
        submit,
        openFilePicker,
      }),
      [
        value,
        setValue,
        status,
        resolvedDensity,
        disabled,
        text,
        attachments,
        onRemoveAttachment,
        onStop,
        canSubmit,
        submit,
        openFilePicker,
      ]
    );

    return (
      <ChatComposerContext.Provider value={context}>
        <form
          ref={ref}
          data-slot="chat-composer"
          data-status={status}
          data-density={resolvedDensity}
          data-disabled={disabled ? '' : undefined}
          className={cn(chatComposerVariants({ density: resolvedDensity }), className)}
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          {...props}
        >
          {children}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            tabIndex={-1}
            data-slot="chat-composer-file-input"
            disabled={disabled}
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              // Cleared so picking the same file again still fires `change`.
              event.target.value = '';
              if (files.length > 0) onFilesRef.current?.(files);
            }}
          />
        </form>
      </ChatComposerContext.Provider>
    );
  }
);
ChatComposer.displayName = 'ChatComposer';

// A block group rings only its first row, since its body usually holds fields that ring
// themselves. The composer's toolbar holds buttons, so the whole box rings, as a row group does.
const FOCUS_RING_CLASS =
  'has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot][aria-invalid=true]]:has-[[data-slot=input-group-control]:focus-visible]:ring-error future:has-[[data-slot=input-group-control]:focus-visible]:ring-offset-2 future:has-[[data-slot=input-group-control]:focus-visible]:ring-offset-background';

export interface ChatComposerInputGroupProps extends Omit<InputGroupProps, 'layout'> {}

/** The field box: an `InputGroup` in block layout holding attachments, textarea and toolbar. */
const ChatComposerInputGroup = React.forwardRef<HTMLDivElement, ChatComposerInputGroupProps>(
  ({ className, disabled, invalid, error, ...props }, ref) => {
    const composer = useChatComposer();
    return (
      <InputGroup
        ref={ref}
        layout="block"
        disabled={disabled || composer.disabled}
        invalid={invalid}
        error={error}
        className={cn(
          FOCUS_RING_CLASS,
          invalid || error
            ? 'has-[[data-slot=input-group-control]:focus-visible]:ring-error'
            : 'has-[[data-slot=input-group-control]:focus-visible]:ring-ring future:has-[[data-slot=input-group-control]:focus-visible]:ring-primary',
          className
        )}
        {...props}
      />
    );
  }
);
ChatComposerInputGroup.displayName = 'ChatComposerInputGroup';

/** The draft lives on `ChatComposer`, so the textarea takes no `value` of its own. */
export interface ChatComposerTextareaProps
  extends Omit<InputGroupTextareaProps, 'value' | 'defaultValue'> {}

const ChatComposerTextarea = React.forwardRef<HTMLTextAreaElement, ChatComposerTextareaProps>(
  (
    {
      className,
      minRows,
      maxRows = 6,
      placeholder,
      disabled,
      onChange,
      onKeyDown,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const composer = useChatComposer();
    const rows = minRows ?? (composer.density === 'compact' ? 1 : 2);

    return (
      <InputGroupRow
        className={cn(
          // The box rings instead of the row.
          'has-[[data-slot=input-group-control]:focus-visible]:ring-0 has-[[data-slot=input-group-control]_:focus-visible]:ring-0',
          // Compact drops the row's minimum height: under future a single line is shorter than
          // it, and the slack would pile up below the text rather than split around it.
          composer.density === 'compact' ? 'min-h-0 py-1 future:min-h-0' : 'py-2'
        )}
      >
        <InputGroupTextarea
          ref={ref}
          rows={rows}
          minRows={rows}
          maxRows={maxRows}
          aria-label={ariaLabel ?? composer.strings.label}
          placeholder={placeholder ?? composer.strings.placeholder}
          disabled={disabled || composer.disabled}
          value={composer.value}
          onChange={(event) => {
            onChange?.(event);
            composer.setValue(event.target.value);
          }}
          onKeyDown={(event) => {
            onKeyDown?.(event);
            if (event.defaultPrevented || event.key !== 'Enter' || event.shiftKey) return;
            // An IME uses Enter to commit a composition; Safari reports that as keyCode 229.
            if (event.nativeEvent.isComposing || event.keyCode === 229) return;
            event.preventDefault();
            composer.submit();
          }}
          className={className}
          {...props}
        />
      </InputGroupRow>
    );
  }
);
ChatComposerTextarea.displayName = 'ChatComposerTextarea';

export interface ChatComposerToolbarProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * The row of actions below the textarea. `ChatComposerSubmit` pushes itself right with `ml-auto`;
 * to group another action with it, such as a mic button, give that action `ml-auto` and the
 * submit button `ml-0`.
 */
const ChatComposerToolbar = React.forwardRef<HTMLDivElement, ChatComposerToolbarProps>(
  ({ className, ...props }, ref) => {
    const { density } = useChatComposer();
    return (
      <InputGroupBody
        ref={ref}
        data-slot="chat-composer-toolbar"
        className={cn(
          'flex min-w-0 items-center gap-1',
          density === 'compact' ? 'px-1.5 py-1' : 'px-2 py-1.5',
          className
        )}
        {...props}
      />
    );
  }
);
ChatComposerToolbar.displayName = 'ChatComposerToolbar';

export interface ChatComposerAttachButtonProps
  extends Omit<ButtonProps, 'onChange'>,
    FileValidationOptions {
  /** Allows picking several files at once. Defaults to true. */
  multiple?: boolean;
  /**
   * Called once per pick, with the files that passed the checks and those that did not. `maxFiles`
   * counts the composer's attachments too, so it caps the draft rather than each pick.
   */
  onFiles?: (accepted: File[], rejected: FileRejection[]) => void;
}

const ChatComposerAttachButton = React.forwardRef<HTMLButtonElement, ChatComposerAttachButtonProps>(
  (
    { accept, maxSize, maxFiles, multiple = true, onFiles, onClick, children, disabled, ...props },
    ref
  ) => {
    const composer = useChatComposerInternal();
    const openPicker = () => {
      const remaining =
        maxFiles === undefined ? undefined : Math.max(0, maxFiles - composer.attachments.length);
      composer.openFilePicker({
        // The picker's filter is only a hint, since the user can switch it to all files.
        accept: Array.isArray(accept) ? accept.join(',') : accept,
        multiple,
        onFiles: (files) => {
          const { accepted, rejected } = validateFiles(files, {
            accept,
            maxSize,
            maxFiles: remaining,
          });
          onFiles?.(accepted, rejected);
        },
      });
    };
    return (
      <InputGroupButton
        ref={ref}
        data-slot="chat-composer-attach"
        icon
        size={composer.density === 'compact' ? '3xs' : '2xs'}
        aria-label={composer.strings.attach}
        disabled={disabled || composer.disabled}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) openPicker();
        }}
        {...props}
      >
        {children ?? <Paperclip />}
      </InputGroupButton>
    );
  }
);
ChatComposerAttachButton.displayName = 'ChatComposerAttachButton';

export interface ChatComposerSubmitProps extends ButtonProps {}

/**
 * Sends while idle and stops while streaming. Idle, it is disabled until there is text or an
 * attachment to send, and while an attachment is busy or `submitDisabled` is set. Streaming
 * without an `onStop`, it stays a disabled send button.
 */
const ChatComposerSubmit = React.forwardRef<HTMLButtonElement, ChatComposerSubmitProps>(
  ({ className, onClick, children, disabled, ...props }, ref) => {
    const composer = useChatComposer();
    const stoppable = composer.status === 'streaming' && composer.onStop !== undefined;
    return (
      <InputGroupButton
        ref={ref}
        data-slot="chat-composer-submit"
        data-status={composer.status}
        type={stoppable ? 'button' : 'submit'}
        variant="default"
        icon
        size={composer.density === 'compact' ? '3xs' : '2xs'}
        aria-label={stoppable ? composer.strings.stop : composer.strings.send}
        disabled={disabled || composer.disabled || (!stoppable && !composer.canSubmit)}
        onClick={(event) => {
          onClick?.(event);
          if (stoppable && !event.defaultPrevented) composer.onStop?.();
        }}
        className={cn('ml-auto', className)}
        {...props}
      >
        {children ?? (stoppable ? <Square className="fill-current" /> : <ArrowUp />)}
      </InputGroupButton>
    );
  }
);
ChatComposerSubmit.displayName = 'ChatComposerSubmit';

export interface ChatComposerAttachmentsProps extends React.HTMLAttributes<HTMLDivElement> {}

/** The draft's attachments as a scrolling row of chips. Renders nothing when there are none. */
const ChatComposerAttachments = React.forwardRef<HTMLDivElement, ChatComposerAttachmentsProps>(
  ({ className, ...props }, ref) => {
    const { attachments, onRemoveAttachment, strings, disabled, density } = useChatComposer();
    if (attachments.length === 0) return null;
    return (
      <AttachmentGroup
        ref={ref}
        data-slot="chat-composer-attachments"
        className={cn(density === 'compact' ? 'px-2 pt-1.5' : 'px-2.5 pt-2.5', className)}
        {...props}
      >
        {attachments.map((attachment) => {
          const state = attachment.state ?? 'done';
          return (
            <Attachment
              key={attachment.id}
              size={density === 'compact' ? 'xs' : 'sm'}
              state={state}
              aria-busy={state === 'uploading' || state === 'processing' || undefined}
            >
              <AttachmentMedia variant={attachment.previewUrl ? 'image' : 'icon'}>
                {attachment.previewUrl ? (
                  <img src={attachment.previewUrl} alt="" />
                ) : (
                  (attachment.icon ?? (state === 'error' ? <CircleAlert /> : <FileText />))
                )}
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{attachment.name}</AttachmentTitle>
                {attachment.description && (
                  <AttachmentDescription>{attachment.description}</AttachmentDescription>
                )}
              </AttachmentContent>
              {onRemoveAttachment && (
                <AttachmentActions>
                  <AttachmentAction
                    aria-label={strings.removeAttachment(attachment.name)}
                    disabled={disabled}
                    onClick={() => onRemoveAttachment(attachment)}
                  >
                    <X />
                  </AttachmentAction>
                </AttachmentActions>
              )}
            </Attachment>
          );
        })}
      </AttachmentGroup>
    );
  }
);
ChatComposerAttachments.displayName = 'ChatComposerAttachments';

const chatComposerErrorVariants = cva(
  "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-4 text-foreground [&>svg:not([class*='size-'])]:mt-px [&>svg:not([class*='size-'])]:size-3.5 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        error: 'border-error/50 bg-error-background/25 [&>svg]:text-error',
        warning: 'border-warning/50 bg-warning-background/25 [&>svg]:text-warning',
      },
    },
    defaultVariants: {
      variant: 'error',
    },
  }
);

export interface ChatComposerErrorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatComposerErrorVariants> {
  /** Adds a dismiss button. */
  onDismiss?: () => void;
}

/** A message about the last send, such as a failed request or a rate limit. */
const ChatComposerError = React.forwardRef<HTMLDivElement, ChatComposerErrorProps>(
  ({ className, variant, onDismiss, children, ...props }, ref) => {
    const { strings } = useChatComposer();
    const resolved = variant ?? 'error';
    const Icon = resolved === 'warning' ? TriangleAlert : CircleAlert;
    return (
      <div
        ref={ref}
        role="alert"
        data-slot="chat-composer-error"
        data-variant={resolved}
        className={cn(chatComposerErrorVariants({ variant: resolved }), className)}
        {...props}
      >
        <Icon aria-hidden="true" />
        <div className="min-w-0 flex-1">{children}</div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="4xs"
            icon
            aria-label={strings.dismissError}
            className="-my-0.5 shrink-0"
            onClick={onDismiss}
          >
            <X />
          </Button>
        )}
      </div>
    );
  }
);
ChatComposerError.displayName = 'ChatComposerError';

export interface ChatComposerFooterProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/** Small muted text below the field, such as an AI disclaimer. */
const ChatComposerFooter = React.forwardRef<HTMLParagraphElement, ChatComposerFooterProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      data-slot="chat-composer-footer"
      className={cn('px-1 text-center text-xs text-muted-foreground', className)}
      {...props}
    />
  )
);
ChatComposerFooter.displayName = 'ChatComposerFooter';

export {
  ChatComposer,
  ChatComposerAttachButton,
  ChatComposerAttachments,
  ChatComposerError,
  ChatComposerFooter,
  ChatComposerInputGroup,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
  chatComposerErrorVariants,
  chatComposerVariants,
  useChatComposer,
};
