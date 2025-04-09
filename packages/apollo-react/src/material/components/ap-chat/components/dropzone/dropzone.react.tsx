/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material/styles';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatFileInfo } from '@uipath/portal-shell-util';
import React from 'react';
import {
    ErrorCode,
    FileRejection,
    useDropzone,
} from 'react-dropzone';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useError } from '../../providers/error-provider.react';
import { parseFiles } from '../../utils/file-reader';

const DropzoneRoot = styled('div')({
    height: '100%',
    position: 'relative',
});

const DropzoneContent = styled('div')<{ isDragActive: boolean }>(({ isDragActive }) => ({ opacity: isDragActive ? 0.3 : 1 }));

const DropzoneOverlay = styled('div')(({ theme }) => ({
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
    border: `${token.Border.BorderThickM} dashed ${theme.palette.semantic.colorBorder}`,
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
    const theme = useTheme();
    const {
        addAttachments, attachments,
    } = useAttachments();
    const { setError } = useError();
    const {
        disabledFeatures, allowedAttachments,
    } = useChatState();

    const attachmentsCountRef = React.useRef(attachments.length);

    React.useEffect(() => {
        attachmentsCountRef.current = attachments.length;
    }, [ attachments ]);

    const handleRejections = React.useCallback((parsedFiles: AutopilotChatFileInfo[], fileRejections: FileRejection[]) => {
        if (!allowedAttachments.multiple && (parsedFiles.length > 1 || attachmentsCountRef.current > 0 || fileRejections.length > 1)) {
            setError(t('autopilot-chat-error-multiple-files'));

            return true;
        }

        if (fileRejections.length > 0) {
            const tooManyFilesRejection = fileRejections.find(rejection => rejection.errors[0]?.code === ErrorCode.TooManyFiles);

            if (tooManyFilesRejection) {
                setError(t('autopilot-chat-error-too-many-files', { maxCount: allowedAttachments.maxCount }));

                return true;
            }

            const errorMessages: string[] = [];

            for (const {
                errors, file,
            } of fileRejections) {
                const errorCode = errors[0]?.code;

                if (errorCode === ErrorCode.FileTooLarge) {
                    const fileSizeMB = Math.round(file.size / 1024 / 1024);

                    errorMessages.push(t('autopilot-chat-error-file-too-large', {
                        fileName: file.name,
                        fileSize: fileSizeMB,
                        maxSize: allowedAttachments.maxSize / 1024 / 1024,
                    }));
                }

                if (errorCode === ErrorCode.FileInvalidType) {
                    errorMessages.push(t('autopilot-chat-error-file-invalid-type', { fileName: file.name }));
                }
            }

            if (errorMessages.length > 0) {
                setError(errorMessages.join('\n'));
            }
        }

        return false;
    }, [ setError, allowedAttachments.maxCount, allowedAttachments.maxSize, allowedAttachments.multiple ]);

    const handleDrop = React.useCallback(async (files: File[], fileRejections: FileRejection[]) => {
        try {
            const parsedFiles = await parseFiles(files);
            const shouldReturn = handleRejections(parsedFiles, fileRejections);

            if (shouldReturn) {
                return;
            }

            if (allowedAttachments.multiple) {
                addAttachments(parsedFiles);
            } else if (parsedFiles.length === 1) {
                addAttachments([ parsedFiles[0] ]);
            }
        } catch (error) {
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
        ...dropzoneOptions,
    });

    if (disabledFeatures.attachments) {
        return children;
    }

    return (
        <DropzoneRoot {...getRootProps()}>
            <input {...getInputProps()} multiple={allowedAttachments.multiple} style={{ display: 'none' }} />

            <DropzoneContent isDragActive={isDragActive}>
                {children}
            </DropzoneContent>

            {isDragActive && (
                <DropzoneOverlay>
                    <ap-typography variant={FontVariantToken.fontSizeMBold} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-dropzone-overlay-title')}
                    </ap-typography>

                    {allowedAttachments.maxCount && allowedAttachments.maxCount > 1 && allowedAttachments.multiple && (
                        <ap-typography variant={FontVariantToken.fontSizeS} color={theme.palette.semantic.colorForeground}>
                            {t('autopilot-chat-dropzone-overlay-max-count', { maxCount: allowedAttachments.maxCount })}
                        </ap-typography>
                    )}

                    <ap-typography variant={FontVariantToken.fontSizeS} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-dropzone-overlay-max-size', { maxSize: allowedAttachments.maxSize / 1024 / 1024 })}
                    </ap-typography>

                    <ap-typography variant={FontVariantToken.fontSizeS} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-allowed-file-types', {
                            fileTypes: Object.values(allowedAttachments.types).flat()
                                .join(', '),
                        })}
                    </ap-typography>
                </DropzoneOverlay>
            )}
        </DropzoneRoot>
    );
}

export const AutopilotChatDropzone = React.memo(AutopilotChatDropzoneComponent);
