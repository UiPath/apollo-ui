import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material/styles';
import token, { FontVariantToken } from '@uipath/apollo-core';
import {
  type ChatAttachmentRejectionReason,
  useAttachmentIntake,
} from '@uipath/apollo-react/chat/headless/hooks/use-attachment-intake';
import { useDropzoneLimitHints } from '@uipath/apollo-react/chat/headless/hooks/use-attachment-limits';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React from 'react';
import { type DropzoneOptions, ErrorCode, type FileRejection, useDropzone } from 'react-dropzone';

interface AutopilotChatDropzoneProps extends DropzoneOptions {
  children: React.ReactNode;
}

const DropzoneRoot = styled('div')({
  height: '100%',
  position: 'relative',
});

const DropzoneContent = styled('div')<{ isDragActive: boolean }>(({ isDragActive }) => ({
  opacity: isDragActive ? 0.3 : 1,
}));

const DropzoneOverlay = styled('div')(() => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  pointerEvents: 'none',
  border: `${token.Border.BorderThickM} dashed var(--color-border)`,
  borderRadius: token.Border.BorderRadiusL,
  margin: 0,
  padding: token.Spacing.SpacingXxl,
  gap: token.Spacing.SpacingM,
  height: '100%',
  width: '100%',
  boxSizing: 'border-box',
}));

/** react-dropzone's error codes as the shared intake's rejection reasons. */
export function rejectionReason(code: string | undefined): ChatAttachmentRejectionReason {
  switch (code) {
    case ErrorCode.FileTooLarge:
      return 'size';
    case ErrorCode.FileInvalidType:
      return 'type';
    case ErrorCode.TooManyFiles:
      return 'count';
    default:
      return 'other';
  }
}

function AutopilotChatDropzoneComponent({
  children,
  ...dropzoneOptions
}: AutopilotChatDropzoneProps) {
  const { _ } = useLingui();
  const { disabledFeatures, allowedAttachments } = useChatState();
  const takeFiles = useAttachmentIntake();
  const { countHint, sizeHint, typesHint } = useDropzoneLimitHints(allowedAttachments);

  const handleDrop = React.useCallback(
    (files: File[], fileRejections: FileRejection[]) =>
      takeFiles(
        files,
        fileRejections.map(({ file, errors }) => ({
          file,
          reason: rejectionReason(errors[0]?.code),
        }))
      ),
    [takeFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    noClick: true,
    noKeyboard: true,
    onDrop: handleDrop,
    accept: allowedAttachments.types,
    maxSize: allowedAttachments.maxSize,
    maxFiles: allowedAttachments.maxCount,
    disabled: disabledFeatures.attachments,
    ...dropzoneOptions,
  });

  return (
    <DropzoneRoot {...getRootProps()}>
      <input
        {...getInputProps()}
        multiple={allowedAttachments.multiple}
        style={{ display: 'none' }}
      />

      <DropzoneContent isDragActive={isDragActive}>{children}</DropzoneContent>

      {isDragActive && (
        <DropzoneOverlay>
          <ApTypography variant={FontVariantToken.fontSizeMBold} color={'var(--color-foreground)'}>
            {_(msg({ id: 'autopilot-chat.dropzone.overlay-title', message: `Drop files here` }))}
          </ApTypography>

          {countHint && (
            <ApTypography variant={FontVariantToken.fontSizeS} color={'var(--color-foreground)'}>
              {countHint}
            </ApTypography>
          )}

          <ApTypography variant={FontVariantToken.fontSizeS} color={'var(--color-foreground)'}>
            {sizeHint}
          </ApTypography>

          <ApTypography variant={FontVariantToken.fontSizeS} color={'var(--color-foreground)'}>
            {typesHint}
          </ApTypography>
        </DropzoneOverlay>
      )}
    </DropzoneRoot>
  );
}

export const AutopilotChatDropzone = React.memo(AutopilotChatDropzoneComponent);
