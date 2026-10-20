import {
  ChatComposer,
  ChatComposerAttachButton,
  type ChatComposerAttachmentItem,
  ChatComposerAttachments,
  ChatComposerError,
  ChatComposerFooter,
  ChatComposerInputGroup,
  ChatComposerSubmit,
  ChatComposerTextarea,
  ChatComposerToolbar,
  Markdown,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import React from 'react';

import {
  getAcceptedFileTypes,
  useAttachmentIntake,
} from '../../headless/hooks/use-attachment-intake';
import { useAttachmentLimits } from '../../headless/hooks/use-attachment-limits';
import { useChatLabels } from '../../headless/hooks/use-chat-labels';
import { useComposerSend } from '../../headless/hooks/use-composer-send';
import { useAttachments } from '../../headless/providers/attachments-provider';
import { useChatService } from '../../headless/providers/chat-service.provider';
import { useChatState } from '../../headless/providers/chat-state-provider';
import { useError } from '../../headless/providers/error-provider';
import { useLoading } from '../../headless/providers/loading-provider';
import {
  AutopilotChatEvent,
  AutopilotChatInternalEvent,
  type AutopilotChatPrompt,
} from '../../service';
import { AttachmentTypeIcon } from '../messages/message-attachments';
import { useMarkdownStrings } from '../renderers/markdown-renderer';
import { useComposerStrings } from './composer-strings';

const promptText = (prompt: AutopilotChatPrompt | string | undefined) =>
  typeof prompt === 'string' ? prompt : (prompt?.content ?? '');

/** Error and warning text is markdown, as Material renders it. */
function ComposerErrorText({ message }: { message: string }) {
  const strings = useMarkdownStrings();
  return (
    <Markdown className="gap-1 text-xs leading-4 [&_p]:m-0" codeWrap strings={strings}>
      {message}
    </Markdown>
  );
}

/**
 * The Wind prompt input on apollo-wind's `ChatComposer`, wired as Material's input is: the draft
 * follows the service prompt, sending goes through the `Request` intercept with the attachments,
 * the send button stops an in-flight reply (unless `stopResponse` is disabled), and the service
 * error shows above the field.
 */
export function WindChatComposer() {
  const chatService = useChatService();
  const { disabledFeatures, spacing, allowedAttachments } = useChatState();
  const { inputPlaceholder, footerDisclaimer } = useChatLabels();
  const { skeletonLoader } = useLoading();
  const { error, clearError } = useError();
  const { attachments, attachmentsLoading, removeAttachment, clearAttachments } = useAttachments();
  const { isResponseInFlight, canStopResponse, send, stop } = useComposerSend();
  const takeFiles = useAttachmentIntake();
  const strings = useComposerStrings(inputPlaceholder);
  const limits = useAttachmentLimits(allowedAttachments);
  const textarea = React.useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = React.useState(() => promptText(chatService?.getPrompt?.()));

  React.useEffect(() => {
    if (!chatService) {
      return;
    }
    const unsubscribes = [
      chatService.on(AutopilotChatEvent.SetPrompt, (prompt: AutopilotChatPrompt | string) =>
        setValue(promptText(prompt))
      ),
      chatService.__internalService__.on(
        AutopilotChatInternalEvent.SetInputFocused,
        (focused: boolean) => {
          if (focused) textarea.current?.focus();
        }
      ),
    ];
    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [chatService]);

  // As in Material: an empty or whitespace-only draft clears the service prompt.
  const changeValue = (next: string) => {
    setValue(next);
    chatService.setPrompt(next.trim().length === 0 ? '' : next);
  };

  const items = React.useMemo<ChatComposerAttachmentItem[]>(
    () =>
      attachments.map((attachment, index) => ({
        id: `${index}-${attachment.name}-${attachment.size}`,
        name: attachment.name,
        icon: <AttachmentTypeIcon name={attachment.name} />,
        state: attachmentsLoading.some(
          (loading) =>
            loading.loading && loading.name === attachment.name && loading.size === attachment.size
        )
          ? 'uploading'
          : 'done',
      })),
    [attachments, attachmentsLoading]
  );

  const accept = React.useMemo(
    () => getAcceptedFileTypes(allowedAttachments.types),
    [allowedAttachments.types]
  );
  const limitsId = React.useId();

  return (
    <ChatComposer
      value={value}
      onValueChange={changeValue}
      onSubmit={(content) => {
        send(content, attachments);
        changeValue('');
        clearAttachments();
        // A click on the send button moved focus there; the next message starts in the field.
        textarea.current?.focus();
      }}
      status={isResponseInFlight ? 'streaming' : 'idle'}
      onStop={canStopResponse ? stop : undefined}
      submitDisabled={skeletonLoader}
      attachments={items}
      onRemoveAttachment={(item) => {
        const index = items.findIndex(({ id }) => id === item.id);
        if (index >= 0) removeAttachment(item.name, index);
      }}
      strings={strings}
    >
      {error && (
        <ChatComposerError
          variant={error.level === 'warn' ? 'warning' : 'error'}
          onDismiss={() => {
            clearError();
            // The dismiss button goes away with the alert; keep focus in the composer.
            textarea.current?.focus();
          }}
          className="max-h-75 overflow-y-auto"
        >
          <ComposerErrorText message={error.message} />
        </ChatComposerError>
      )}
      <ChatComposerInputGroup>
        <ChatComposerAttachments className="gap-2 [&_[data-slot=attachment-action]]:size-5 [&_[data-slot=attachment-media]]:rounded-sm [&_[data-slot=attachment-media]]:bg-transparent [&_[data-slot=attachment]]:min-w-0 [&_[data-slot=attachment]]:max-w-[calc(50%-4px)] [&_[data-slot=attachment]]:gap-1.5 [&_[data-slot=attachment]]:rounded-lg [&_[data-slot=attachment][data-size=sm]]:p-1 [&_[data-slot=attachment][data-size=sm]_[data-slot=attachment-media]]:w-5" />
        <ChatComposerTextarea
          ref={textarea}
          minRows={spacing.promptBox.minRows}
          maxRows={spacing.promptBox.maxRows}
        />
        <ChatComposerToolbar>
          {!disabledFeatures.attachments && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <ChatComposerAttachButton
                    accept={accept}
                    maxSize={allowedAttachments.maxSize}
                    // `maxCount: 0` means no limit, as in Material.
                    maxFiles={allowedAttachments.maxCount || undefined}
                    multiple={allowedAttachments.multiple}
                    aria-describedby={limitsId}
                    onFiles={(accepted, rejected) => {
                      void takeFiles(accepted, rejected);
                    }}
                  />
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent className="flex flex-col gap-0.5">
                    <span className="font-medium">{strings.attach}</span>
                    {limits.map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </TooltipContent>
                </TooltipPortal>
              </Tooltip>
              <span id={limitsId} className="sr-only">
                {limits.join('. ')}
              </span>
            </>
          )}
          {/* The primitive turns stop into a ghost button, and its colour transition reads as a
              flicker between send and stop; filled in both states, as Material's is, only the icon
              and label change. */}
          <ChatComposerSubmit variant="default" />
        </ChatComposerToolbar>
      </ChatComposerInputGroup>
      {!disabledFeatures.footer && (
        // Material's footer size.
        <ChatComposerFooter className="text-[10px]">{footerDisclaimer}</ChatComposerFooter>
      )}
    </ChatComposer>
  );
}
