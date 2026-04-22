import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import React from 'react';

import { ApTypography } from '../../../ap-typography';
import { useAttachments } from '../../providers/attachements-provider';
import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useError } from '../../providers/error-provider';
import { usePicker } from '../../providers/picker-provider';
import { AutopilotChatEvent } from '../../service';
import { parseFiles } from '../../utils/file-reader';
import { AutopilotChatActionButton } from '../common/action-button';
import { VisuallyHidden } from '../common/shared-controls';
import { AlwaysOnVoiceButton, VoiceButtonContainer } from './always-on-voice-button';
import { AutopilotChatAgentModeSelector } from './chat-input-agent-mode-selector';
import { AutopilotChatInputModelPicker } from './chat-input-model-picker';
import { ResourceTriggerButton } from './chat-input-resource-trigger';

const InputActionsContainer = styled('div')(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: `0 ${token.Spacing.SpacingXs} ${token.Spacing.SpacingXs}`,
}));

const InputActionsGroup = styled('div')(() => ({
  display: 'flex',
  gap: token.Spacing.SpacingMicro,
}));

const SubmitButtonContainer = styled('div')(() => ({
  '& .MuiIconButton-root': {
    borderRadius: token.Border.BorderRadiusM,
    backgroundColor: 'var(--color-background-disabled)',

    '&:not(.Mui-disabled)': {
      backgroundColor: `var(--color-foreground) !important`,

      '&:hover, &:active, &:focus': {
        backgroundColor: `var(--color-foreground-de-emp) !important`,
      },
    },
  },
}));

interface AutopilotChatInputActionsProps {
  handleSubmit: (event: React.MouseEvent) => void;
  disableSubmit: boolean;
  waitingResponse: boolean;
  onResourceTriggerClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onVoiceInteractionChange?: (isActive: boolean) => void;
  isVoiceInteractionActive?: boolean;
}

function AutopilotChatInputActionsComponent({
  handleSubmit,
  disableSubmit,
  waitingResponse,
  onResourceTriggerClick,
  onVoiceInteractionChange,
  isVoiceInteractionActive,
}: AutopilotChatInputActionsProps) {
  const { _ } = useLingui();
  const chatService = useChatService();
  const { addAttachments } = useAttachments();
  const { setError } = useError();
  const { disabledFeatures, allowedAttachments } = useChatState();
  const { models, agentModes } = usePicker();

  const [isSpeechToTextActive, setIsSpeechToTextActive] = React.useState(false);
  React.useEffect(() => {
    if (!chatService) {
      return;
    }
    return chatService.on(AutopilotChatEvent.SetSpeechToTextState, (isActive: boolean) => {
      setIsSpeechToTextActive(isActive);
    });
  }, [chatService]);

  const handleSpeechToTextClick = React.useCallback(() => {
    chatService?.publishSpeechToTextToggle();
  }, [chatService]);

  // Stop dictation before sending, so the old transcript doesn't re-populate the input.
  // Must use publishSpeechToTextToggle (not setSpeechToTextState) so both SetSpeechToTextState
  // AND SpeechToTextToggle events fire — consumers listen to SpeechToTextToggle to stop the SDK.
  const handleSubmitWithSttStop = React.useCallback(
    (event: React.MouseEvent) => {
      if (isSpeechToTextActive) {
        chatService?.publishSpeechToTextToggle();
      }
      handleSubmit(event);
    },
    [handleSubmit, isSpeechToTextActive, chatService]
  );

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      // clear the input value to allow the user to select the same file again
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleAttachment = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      try {
        const parsedFiles = await parseFiles(Array.from(event.target.files ?? []));
        const oversizedFiles = parsedFiles.filter((file) => file.size > allowedAttachments.maxSize);

        if (oversizedFiles.length > 0) {
          const errorMessages = oversizedFiles.map((file) => {
            const fileSizeMB = Math.round(file.size / 1024 / 1024);
            const fileName = file.name;
            const fileSize = fileSizeMB;
            const maxSize = allowedAttachments.maxSize / 1024 / 1024;

            return _(
              msg({
                id: 'autopilot-chat.input.actions.error.file-too-large',
                message: `File "${fileName}" (${fileSize}MB) exceeds the maximum size of ${maxSize}MB`,
              })
            );
          });

          setError(errorMessages.join('\n'));
        } else {
          setError(undefined);
        }

        addAttachments(parsedFiles.filter((file) => file.size <= allowedAttachments.maxSize));
      } catch (err) {
        setError(err as string);
      }
    },
    [addAttachments, setError, allowedAttachments.maxSize, _]
  );

  const acceptedExtensions = React.useMemo(() => {
    return Object.values(allowedAttachments.types).flat().join(',');
  }, [allowedAttachments]);

  // Build full description text for screen readers
  const attachmentDescription = React.useMemo(() => {
    const parts: string[] = [];
    const maxCount = allowedAttachments.maxCount;
    const maxSize = allowedAttachments.maxSize / 1024 / 1024;
    const fileTypes = acceptedExtensions.split(',').join(', ');

    if (
      allowedAttachments.maxCount &&
      allowedAttachments.maxCount > 1 &&
      allowedAttachments.multiple
    ) {
      parts.push(
        _(
          msg({
            id: 'autopilot-chat.input.actions.attachments.max-count',
            message: `Maximum ${maxCount} files`,
          })
        )
      );
    }

    parts.push(
      _(
        msg({
          id: 'autopilot-chat.input.actions.attachments.max-size',
          message: `Maximum ${maxSize}MB per file`,
        })
      ),
      _(
        msg({
          id: 'autopilot-chat.input.actions.attachments.allowed-types',
          message: `Allowed types: ${fileTypes}`,
        })
      )
    );

    return parts.join('. ');
  }, [allowedAttachments, acceptedExtensions, _]);

  // Show voice interaction button when audioStreaming is enabled and either
  // voice is already active or the input is empty (no text to submit).
  const showVoice =
    disabledFeatures.audioStreaming === false &&
    (isVoiceInteractionActive || (disableSubmit && !waitingResponse));

  // Calculate if we should use icons based on how many features are enabled
  const hasMultipleFeatures =
    [!disabledFeatures.attachments, models.length > 0, (agentModes?.length ?? 0) > 0].filter(
      Boolean
    ).length > 1;

  return (
    <InputActionsContainer>
      {/* visibility:hidden (not display:none) keeps the left group's layout footprint so the
          right group (stop button) stays anchored to the right edge during voice interaction. */}
      <InputActionsGroup
        style={isVoiceInteractionActive ? { visibility: 'hidden' } : undefined}
      >
        {!disabledFeatures.attachments && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept={acceptedExtensions}
              multiple={allowedAttachments.multiple}
              onChange={handleAttachment}
            />
            <VisuallyHidden id="autopilot-chat-attach-file-description">
              {attachmentDescription}
            </VisuallyHidden>
            <AutopilotChatActionButton
              iconName="attach_file"
              onClick={handleFileButtonClick}
              tooltipPlacement="top"
              data-testid="autopilot-chat-attach-file-button"
              ariaLabel={_(
                msg({ id: 'autopilot-chat.input.actions.attach-file', message: `Attach file` })
              )}
              ariaDescribedby="autopilot-chat-attach-file-description"
              tooltip={
                <>
                  <ApTypography
                    color={'var(--color-foreground-inverse)'}
                    variant={FontVariantToken.fontSizeM}
                  >
                    {_(
                      msg({
                        id: 'autopilot-chat.input.actions.attach-file',
                        message: `Attach file`,
                      })
                    )}
                  </ApTypography>

                  {allowedAttachments.maxCount &&
                    allowedAttachments.maxCount > 1 &&
                    allowedAttachments.multiple &&
                    (() => {
                      const maxCount = allowedAttachments.maxCount;
                      return (
                        <ApTypography
                          color={'var(--color-foreground-inverse)'}
                          variant={FontVariantToken.fontSizeXs}
                        >
                          {_(
                            msg({
                              id: 'autopilot-chat.input.actions.attachments.max-count',
                              message: `Maximum ${maxCount} files`,
                            })
                          )}
                        </ApTypography>
                      );
                    })()}

                  {(() => {
                    const maxSize = allowedAttachments.maxSize / 1024 / 1024;
                    return (
                      <ApTypography
                        color={'var(--color-foreground-inverse)'}
                        variant={FontVariantToken.fontSizeXs}
                      >
                        {_(
                          msg({
                            id: 'autopilot-chat.input.actions.attachments.max-size',
                            message: `Maximum ${maxSize}MB per file`,
                          })
                        )}
                      </ApTypography>
                    );
                  })()}

                  {(() => {
                    const fileTypes = acceptedExtensions.split(',').join(', ');
                    return (
                      <ApTypography
                        color={'var(--color-foreground-inverse)'}
                        variant={FontVariantToken.fontSizeXs}
                      >
                        {_(
                          msg({
                            id: 'autopilot-chat.input.actions.attachments.allowed-types',
                            message: `Allowed types: ${fileTypes}`,
                          })
                        )}
                      </ApTypography>
                    );
                  })()}
                </>
              }
            />
          </>
        )}
        {onResourceTriggerClick && <ResourceTriggerButton onClick={onResourceTriggerClick} />}
        {models.length > 0 && <AutopilotChatInputModelPicker useIcon={hasMultipleFeatures} />}
        {agentModes.length > 0 && <AutopilotChatAgentModeSelector useIcon={false} />}
      </InputActionsGroup>

      <InputActionsGroup>
        {!isVoiceInteractionActive && !disabledFeatures.audio && (
          <VoiceButtonContainer active={isSpeechToTextActive}>
            <AutopilotChatActionButton
              iconName="mic"
              onClick={handleSpeechToTextClick}
              tooltipPlacement="top"
              tooltip={_(
                msg({ id: 'autopilot-chat.input.actions.dictate', message: `Dictate` })
              )}
              overrideColor={isSpeechToTextActive ? 'var(--color-background)' : undefined}
              data-testid="autopilot-chat-stt-button"
              ariaLabel={_(
                msg({ id: 'autopilot-chat.input.actions.dictate', message: `Dictate` })
              )}
            />
          </VoiceButtonContainer>
        )}
        {showVoice && (
          <AlwaysOnVoiceButton
            disabled={isSpeechToTextActive}
            onActiveChange={onVoiceInteractionChange}
          />
        )}
        {!showVoice && (
          <SubmitButtonContainer>
            <AutopilotChatActionButton
              iconName={waitingResponse ? 'stop' : 'arrow_upward'}
              tooltip={
                waitingResponse
                  ? _(msg({ id: 'autopilot-chat.input.actions.stop', message: `Stop` }))
                  : _(msg({ id: 'autopilot-chat.input.actions.send', message: `Send` }))
              }
              overrideColor={
                disableSubmit ? 'var(--color-foreground-disable)' : 'var(--color-background)'
              }
              variant={waitingResponse ? 'normal' : 'outlined'}
              preventHover={true}
              disabled={disableSubmit}
              onClick={handleSubmitWithSttStop}
              data-testid="autopilot-chat-submit-button"
              ariaLabel={
                waitingResponse
                  ? _(msg({ id: 'autopilot-chat.input.actions.stop', message: `Stop` }))
                  : _(msg({ id: 'autopilot-chat.input.actions.send', message: `Send` }))
              }
            />
          </SubmitButtonContainer>
        )}
      </InputActionsGroup>
    </InputActionsContainer>
  );
}

export const AutopilotChatInputActions = React.memo(AutopilotChatInputActionsComponent);
