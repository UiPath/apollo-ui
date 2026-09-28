import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Fade } from '@mui/material';
import { useEffect, useState } from 'react';

import { ApTypography } from '../../../../ap-typography';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import { AutopilotChatEvent } from '../../../service';

const SECONDS = 1000;
const FADE_DURATION = 0.5 * SECONDS;
const DEFAULT_MESSAGE_DURATION = 5 * SECONDS;

const defaultMessages = ['autopilot-chat-generating-response'];

export const LoadingMessage = () => {
  const { _ } = useLingui();
  const chatService = useChatService();
  const [messageIdx, setMessageIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [messages, setMessages] = useState(
    chatService.getDefaultLoadingMessages() ?? defaultMessages
  );
  const [messageDuration, setMessageDuration] = useState(
    chatService.getLoadingMessageDuration() ?? DEFAULT_MESSAGE_DURATION
  );
  const { spacing } = useChatState();

  useEffect(() => {
    if (!chatService) {
      return;
    }

    let setDefaultLoadingMessagesTimeout: ReturnType<typeof setTimeout> | undefined;
    let setLoadingMessageTimeout: ReturnType<typeof setTimeout> | undefined;

    const unsubscribeSetDefaultLoadingMessages = chatService.on(
      AutopilotChatEvent.SetDefaultLoadingMessages,
      (data: { messages: string[]; duration?: number }) => {
        setIsVisible(false);
        setDefaultLoadingMessagesTimeout = setTimeout(() => {
          setMessageIdx(0);
          setMessages(data.messages);
          setMessageDuration(data.duration ?? DEFAULT_MESSAGE_DURATION);
          setIsVisible(true);
        }, FADE_DURATION);
      }
    );

    const unsubscribeSetLoadingMessage = chatService.on(
      AutopilotChatEvent.SetLoadingMessage,
      (message: string) => {
        setIsVisible(false);
        setLoadingMessageTimeout = setTimeout(() => {
          setMessageIdx(0);
          setMessages([message]);
          setIsVisible(true);
        }, FADE_DURATION);
      }
    );

    return () => {
      unsubscribeSetDefaultLoadingMessages();
      unsubscribeSetLoadingMessage();
      clearTimeout(setDefaultLoadingMessagesTimeout);
      clearTimeout(setLoadingMessageTimeout);
    };
  }, [chatService]);

  useEffect(() => {
    if (messages.length === 1) {
      return;
    }

    let childTimeout: ReturnType<typeof setTimeout> | undefined;

    const parentTimeout = setTimeout(() => {
      setIsVisible(false);
      childTimeout = setTimeout(() => {
        setMessageIdx((prev) => (prev === messages.length - 1 ? 0 : prev + 1));
        setIsVisible(true);
      }, FADE_DURATION);
    }, messageDuration);

    return () => {
      clearTimeout(parentTimeout);
      clearTimeout(childTimeout);
    };
  }, [messageIdx, messageDuration, messages]);

  // Map the current message key to translation
  const currentMessage = messages[messageIdx];
  const translatedMessage =
    currentMessage === 'autopilot-chat-generating-response'
      ? _(
          msg({
            id: 'autopilot-chat.message.generating-response',
            message: `Generating response...`,
          })
        )
      : currentMessage; // For custom messages, display as-is

  return (
    <Fade in={isVisible} timeout={FADE_DURATION}>
      <ApTypography
        variant={spacing.primaryFontToken}
        color={'var(--color-foreground)'}
        aria-live="polite"
      >
        {translatedMessage}
      </ApTypography>
    </Fade>
  );
};
