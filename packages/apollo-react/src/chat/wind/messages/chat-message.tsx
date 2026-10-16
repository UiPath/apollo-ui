import { Bubble, BubbleContent, cn, Message, MessageContent } from '@uipath/apollo-wind';
import React from 'react';

import { resolveMessageRenderer } from '../../headless/message-renderers';
import { useChatService } from '../../headless/providers/chat-service.provider';
import { type AutopilotChatMessage, AutopilotChatRole } from '../../service';
import { WIND_MESSAGE_RENDERERS } from '../renderers';
import { InjectedMessage } from './injected-message';
import { MessageActionBar } from './message-action-bar';
import { MessageAttachments } from './message-attachments';
import { MessageSources } from './message-sources';

// Material's user bubble colour (with the host override it honours) and the leading inset it keeps
// from the panel edge; the padding stays the Bubble primitive's.
const USER_BUBBLE =
  'max-w-[calc(100%-var(--chat-user-message-inset))] [&>[data-slot=bubble-content]]:bg-[var(--custom-autopilot-chat-user-message-bg-color,var(--color-background-secondary))] [&>[data-slot=bubble-content]]:text-foreground';

export interface ChatMessageProps {
  message: AutopilotChatMessage;
  /** Actions show on the last message of a group only. */
  isLastInGroup: boolean;
  /** A group of one message that sets `disableActions`. */
  actionsDisabled: boolean;
  /** In the group of the latest assistant reply, whose actions always show. */
  isLatestReply: boolean;
  /** What Copy writes for the group, given to the group's last message. */
  copyText: string;
}

/**
 * One message: the user's in a bubble on the trailing edge, the assistant's as plain prose. The
 * body comes from the renderer injected on the service for `message.widget`, else Wind's own.
 */
function ChatMessageComponent({
  message,
  isLastInGroup,
  actionsDisabled,
  isLatestReply,
  copyText,
}: ChatMessageProps) {
  const chatService = useChatService();

  if (!message.content && !message.contentParts && !message.attachments) {
    return null;
  }

  const isUser = message.role === AutopilotChatRole.User;
  const hasAttachments = !!message.attachments && message.attachments.length > 0;
  // A message of files alone shows its attachment row and no empty bubble.
  const hasText = !!message.content?.trim() || !!message.contentParts?.length;
  const renderer = resolveMessageRenderer(chatService, message, WIND_MESSAGE_RENDERERS);
  const Body = renderer?.kind === 'component' ? renderer.component : undefined;
  const injected = renderer?.kind === 'dom';
  // Injected DOM renderers keep their actions even with `disableActions`, as in Material.
  const showActions = isLastInGroup && (injected || !actionsDisabled);

  return (
    <Message
      align={isUser ? 'end' : 'start'}
      data-chat-message-id={message.id}
      data-role={message.role}
      className="text-foreground"
    >
      <MessageContent
        // A container, so attachment chips are capped against the message's width.
        className={cn('@container gap-0', injected && 'w-full')}
      >
        {hasAttachments && message.attachments && (
          // `messageGroupGap` between a message's parts, as in Material. `max-w-full`: a user
          // message aligns its parts to the end, which sizes them to their content, so without a
          // cap the row grows past the panel instead of scrolling.
          <div className="mb-[var(--chat-message-group-gap)] max-w-full">
            <MessageAttachments
              attachments={message.attachments}
              align={isUser ? 'end' : 'start'}
            />
          </div>
        )}
        {injected ? (
          <InjectedMessage message={message} />
        ) : (
          Body &&
          (hasText || !hasAttachments) &&
          (isUser ? (
            <Bubble variant="secondary" className={USER_BUBBLE}>
              <BubbleContent>
                <Body message={message} />
              </BubbleContent>
            </Bubble>
          ) : (
            // Material leaves 32px beside a reply.
            <div className="min-w-0 pr-8 text-sm leading-relaxed">
              <Body message={message} />
            </div>
          ))
        )}
        {isLastInGroup && !isUser && <MessageSources message={message} />}
        {showActions && (
          <MessageActionBar message={message} isLatestReply={isLatestReply} copyText={copyText} />
        )}
      </MessageContent>
    </Message>
  );
}

// Props are a message object the transcript replaces only when it changes, booleans and a string.
export const ChatMessage = React.memo(ChatMessageComponent);
