import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token from '@uipath/apollo-core';
import React, { useCallback, useState } from 'react';

import { useChatService } from '../../providers/chat-service.provider';
import { AutopilotChatEvent, type AutopilotChatOutputStreamEvent } from '../../service';
import {
  type AudioInputDataHandler,
  type AudioInputEndHandler,
  type AudioInputStartHandler,
  useAudioInput,
} from '../audio/chat-audio-input';
import { useAudioOutput } from '../audio/chat-audio-output';
import { AutopilotChatActionButton } from '../common/action-button';

export const VoiceButtonContainer = styled('div', {
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active?: boolean }>(({ active }) => ({
  '& .MuiIconButton-root': {
    borderRadius: token.Border.BorderRadiusM,
    ...(active && {
      backgroundColor: `var(--color-foreground) !important`,
      '&:hover, &:active, &:focus': {
        backgroundColor: `var(--color-foreground-de-emp) !important`,
      },
    }),
  },
}));

interface AlwaysOnVoiceButtonProps {
  disabled?: boolean;
  onActiveChange?: (isActive: boolean) => void;
}

/**
 * Waveform button that starts always-on voice mode (automatic activity detection).
 * Replaces the send button when the chat input is empty and audioStreaming is enabled.
 * Uses the existing useAudioInput hook for mic capture and streams audio via InputStream.
 */
export const AlwaysOnVoiceButton = ({ disabled = false, onActiveChange }: AlwaysOnVoiceButtonProps) => {
  const { _ } = useLingui();
  const [isActive, setIsActive] = useState(false);
  const chatService = useChatService();

  // Audio output: subscribe to OutputStream events and play the model's audio response
  const { queueOutputAudio, clearOutputAudioQueue } = useAudioOutput();

  React.useEffect(() => {
    if (!chatService || !isActive) {
      return;
    }
    return chatService.on(
      AutopilotChatEvent.OutputStream,
      (event: AutopilotChatOutputStreamEvent) => {
        if (event.mediaChunks) {
          for (const chunk of event.mediaChunks) {
            if (chunk.mimeType.startsWith('audio/pcm;')) {
              queueOutputAudio(chunk.mimeType, chunk.data, chunk.sequenceNumber);
            }
          }
        }
        if (event.interrupted) {
          clearOutputAudioQueue();
        }
      }
    );
  }, [chatService, isActive, queueOutputAudio, clearOutputAudioQueue]);

  const handleAudioInputStart = useCallback<AudioInputStartHandler>(
    (automaticActivityDetectionEnabled) => {
      if (!chatService) {
        return;
      }
      setIsActive(true);
      onActiveChange?.(true);
      chatService.sendInputStreamEvent({ activityStart: { automaticActivityDetectionEnabled } });
    },
    [chatService, onActiveChange]
  );

  const handleAudioInputEnd = useCallback<AudioInputEndHandler>(
    (sequenceNumber) => {
      if (!chatService) {
        return;
      }
      setIsActive(false);
      onActiveChange?.(false);
      clearOutputAudioQueue();
      chatService.sendInputStreamEvent({ activityEnd: { sequenceNumber } });
    },
    [chatService, clearOutputAudioQueue, onActiveChange]
  );

  const handleAudioInputData = useCallback<AudioInputDataHandler>(
    (mimeType, data, sequenceNumber) => {
      if (!chatService) {
        return;
      }
      chatService.sendInputStreamEvent({
        mediaChunks: [{ mimeType, data, sequenceNumber }],
      });
    },
    [chatService]
  );

  const { startAudioInput, stopAudioInput } = useAudioInput({
    handleAudioInputData,
    handleAudioInputStart,
    handleAudioInputEnd,
  });

  const handleClick = useCallback(async () => {
    if (disabled) {
      return;
    }
    if (isActive) {
      stopAudioInput();
    } else {
      await startAudioInput(true);
    }
  }, [disabled, isActive, startAudioInput, stopAudioInput]);

  // Per Figma: no bg when idle, dark bg when active, grayed icon when disabled.
  const iconColor = disabled
    ? 'var(--color-foreground-disable)'
    : isActive
      ? 'var(--color-background)'
      : undefined;

  const stopLabel = _(msg({ id: 'autopilot-chat.input.actions.stop', message: `Stop` }));
  const voiceLabel = _(
    msg({
      id: 'autopilot-chat.input.actions.voice-interaction',
      message: `Voice interaction`,
    })
  );

  return (
    <VoiceButtonContainer active={isActive}>
      <AutopilotChatActionButton
        iconName={isActive ? 'stop' : 'graphic_eq'}
        tooltip={isActive ? stopLabel : voiceLabel}
        overrideColor={iconColor}
        preventHover={true}
        disabled={disabled}
        onClick={handleClick}
        data-testid="autopilot-chat-always-on-voice-button"
        ariaLabel={isActive ? stopLabel : voiceLabel}
      />
    </VoiceButtonContainer>
  );
};
