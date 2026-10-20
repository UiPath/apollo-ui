import { Fade } from '@mui/material';
import { useLoadingMessages } from '@uipath/apollo-react/chat/headless/hooks/use-loading-messages';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import { useEffect, useRef, useState } from 'react';

const SECONDS = 1000;
const FADE_DURATION = 0.5 * SECONDS;

export const LoadingMessage = () => {
  const { messages: loadingMessages, duration: loadingDuration, translate } = useLoadingMessages();
  const [messageIdx, setMessageIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  // What shows; follows the loading provider's messages after a fade, as before.
  const [messages, setMessages] = useState(loadingMessages);
  const [messageDuration, setMessageDuration] = useState(loadingDuration);
  const shown = useRef({ messages: loadingMessages, duration: loadingDuration });
  const { spacing } = useChatState();

  useEffect(() => {
    if (shown.current.messages === loadingMessages && shown.current.duration === loadingDuration) {
      return;
    }
    shown.current = { messages: loadingMessages, duration: loadingDuration };

    setIsVisible(false);
    const timeout = setTimeout(() => {
      setMessageIdx(0);
      setMessages(loadingMessages);
      setMessageDuration(loadingDuration);
      setIsVisible(true);
    }, FADE_DURATION);

    return () => clearTimeout(timeout);
  }, [loadingMessages, loadingDuration]);

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

  return (
    <Fade in={isVisible} timeout={FADE_DURATION}>
      <ApTypography
        variant={spacing.primaryFontToken}
        color={'var(--color-foreground)'}
        aria-live="polite"
      >
        {translate(messages[messageIdx] ?? '')}
      </ApTypography>
    </Fade>
  );
};
