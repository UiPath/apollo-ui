import React from 'react';

import type { AutopilotChatFileInfo } from '../../service';
import { useChatService } from '../providers/chat-service.provider';
import { useChatState } from '../providers/chat-state-provider';
import { useLoading } from '../providers/loading-provider';
import { useStreaming } from '../providers/streaming-provider';

/**
 * Sending and stopping from a composer, as both renderers do. While a reply is awaited or
 * streams, the send control stops it instead, unless `disabledFeatures.stopResponse` is set.
 */
export function useComposerSend() {
  const chatService = useChatService();
  const { disabledFeatures } = useChatState();
  const { waitingResponse } = useLoading();
  const { streaming } = useStreaming();
  const isResponseInFlight = waitingResponse || streaming;
  const canStopResponse = isResponseInFlight && !disabledFeatures?.stopResponse;

  const send = React.useCallback(
    (content: string, attachments: AutopilotChatFileInfo[]) => {
      // Stop dictation first so its growing transcript cannot refill the cleared input. The
      // toggle, not setSpeechToTextState, because consumers tear the recognizer down on it.
      if (chatService.isSpeechToTextActive) {
        chatService.publishSpeechToTextToggle();
      }
      chatService.sendRequest({ content, attachments });
    },
    [chatService]
  );

  const stop = React.useCallback(() => {
    if (canStopResponse) {
      chatService.stopResponse();
    }
  }, [chatService, canStopResponse]);

  return { isResponseInFlight, canStopResponse, send, stop };
}
