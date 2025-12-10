import React from 'react';

import {
  ErrorCode,
  FileRejection,
  useDropzone,
} from 'react-dropzone';

import { styled } from '@mui/material/styles';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';

import { useAttachments } from '../../providers/attachements-provider';
import { useChatState } from '../../providers/chat-state-provider';
import { useError } from '../../providers/error-provider';
import { AutopilotChatFileInfo } from '../../service';
import { parseFiles } from '../../utils/file-reader';

const DropzoneRoot = styled('div')({
    height: '100%',
    position: 'relative',
});

const DropzoneContent = styled('div')<{ isDragActive: boolean }>(({ isDragActive }) => ({ opacity: isDragActive ? 0.3 : 1 }));

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

function AutopilotChatDropzoneComponent({
    children,
    ...dropzoneOptions
}) {
    const { _ } = useLingui();
    const {
        addAttachments, attachments,
    } = useAttachments();
    const { setError } = useError();
    const {
        disabledFeatures, allowedAttachments,
    } = useChatState();

    const attachmentsCountRef = React.useRef(attachments.length);
    attachmentsCountRef.current = attachments.length;

    const handleRejections = React.useCallback((parsedFiles: AutopilotChatFileInfo[], fileRejections: FileRejection[]) => {
        if (!allowedAttachments.multiple && (parsedFiles.length > 1 || attachmentsCountRef.current > 0 || fileRejections.length > 1)) {
            setError(_(msg({ id: 'autopilot-chat.error.multiple-files', message: `Only one file can be attached at a time` })));

            return true;
        }

        if (fileRejections.length > 0) {
            const tooManyFilesRejection = fileRejections.find(rejection => rejection.errors[0]?.code === ErrorCode.TooManyFiles);

            if (tooManyFilesRejection) {
                const maxCount = allowedAttachments.maxCount;
                setError(_(msg({ id: 'autopilot-chat.error.too-many-files', message: `Maximum ${maxCount} files allowed` })));

                return true;
            }

            const errorMessages: string[] = [];

            for (const {
                errors, file,
            } of fileRejections) {
                const errorCode = errors[0]?.code;

                if (errorCode === ErrorCode.FileTooLarge) {
                    const fileSizeMB = Math.round(file.size / 1024 / 1024);
                    const fileName = file.name;
                    const maxSize = allowedAttachments.maxSize / 1024 / 1024;

                    errorMessages.push(_(msg({ id: 'autopilot-chat.error.file-too-large', message: `${fileName} (${fileSizeMB}MB) exceeds maximum size of ${maxSize}MB` })));
                }

                if (errorCode === ErrorCode.FileInvalidType) {
                    const fileName = file.name;
                    errorMessages.push(_(msg({ id: 'autopilot-chat.error.file-invalid-type', message: `${fileName} has an invalid file type` })));
                }
            }

            if (errorMessages.length > 0) {
                setError(errorMessages.join('\n'));
            }
        }

        return false;
    }, [ _, setError, allowedAttachments.maxCount, allowedAttachments.maxSize, allowedAttachments.multiple ]);

    const handleDrop = React.useCallback(async (files: File[], fileRejections: FileRejection[]) => {
        try {
            const parsedFiles = await parseFiles(files);
            const shouldReturn = handleRejections(parsedFiles, fileRejections);

            if (shouldReturn) {
                return;
            }

            if (fileRejections.length === 0) {
                setError(undefined);
            }

            if (allowedAttachments.multiple) {
                addAttachments(parsedFiles);
            } else if (parsedFiles.length === 1) {
                addAttachments([ parsedFiles[0]! ]);
            }
        } catch (error: string) {
            setError(error);
            return;
        }
    }, [ addAttachments, setError, allowedAttachments.multiple, handleRejections ]);

    const {
        getRootProps, getInputProps, isDragActive,
    } = useDropzone({
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
            <input {...getInputProps()} multiple={allowedAttachments.multiple} style={{ display: 'none' }} />

            <DropzoneContent isDragActive={isDragActive}>
                {children}
            </DropzoneContent>

            {isDragActive && (
                <DropzoneOverlay>
                    <ap-typography variant={FontVariantToken.fontSizeMBold} color={'var(--color-foreground)'}>
                        {_(msg({ id: 'autopilot-chat.dropzone.overlay-title', message: `Drop files here` }))}
                    </ap-typography>

                    {allowedAttachments.maxCount && allowedAttachments.maxCount > 1 && allowedAttachments.multiple && (() => {
                        const maxCount = allowedAttachments.maxCount;
                        return (
                            <ap-typography variant={FontVariantToken.fontSizeS} color={'var(--color-foreground)'}>
                                {_(msg({ id: 'autopilot-chat.dropzone.overlay-max-count', message: `Maximum ${maxCount} files` }))}
                            </ap-typography>
                        );
                    })()}

                    <ap-typography variant={FontVariantToken.fontSizeS} color={'var(--color-foreground)'}>
                        {(() => {
                            const maxSize = allowedAttachments.maxSize / 1024 / 1024;
                            return _(msg({ id: 'autopilot-chat.dropzone.overlay-max-size', message: `Maximum file size: ${maxSize}MB` }));
                        })()}
                    </ap-typography>

                    <ap-typography variant={FontVariantToken.fontSizeS} color={'var(--color-foreground)'}>
                        {(() => {
                            const fileTypes = Object.values(allowedAttachments.types).flat().join(', ');
                            return _(msg({ id: 'autopilot-chat.dropzone.allowed-file-types', message: `Allowed file types: ${fileTypes}` }));
                        })()}
                    </ap-typography>
                </DropzoneOverlay>
            )}
        </DropzoneRoot>
    );
}

export const AutopilotChatDropzone = React.memo(AutopilotChatDropzoneComponent);
