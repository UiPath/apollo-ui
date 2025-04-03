/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material/styles';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import React from 'react';
import {
    FileRejection,
    useDropzone,
} from 'react-dropzone';

import { t } from '../../../../utils/localization/loc';
import { useAttachments } from '../../providers/attachements-provider.react';
import { useChatState } from '../../providers/chat-state-provider.react';
import { useError } from '../../providers/error-provider.react';
import {
    ACCEPTED_FILE_EXTENSIONS,
    ACCEPTED_FILES,
} from '../../utils/constants';
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
    const { addAttachments } = useAttachments();
    const { setError } = useError();
    const { disabledFeatures } = useChatState();

    const handleDrop = React.useCallback(async (files: File[], fileRejections: FileRejection[]) => {
        try {
            const parsedFiles = await parseFiles(files);

            addAttachments(parsedFiles);
        } catch (error) {
            setError(error);
        }

        if (fileRejections.length > 0) {
            setError(t('autopilot-chat-dropzone-overlay-error', { fileTypes: fileRejections.map(({ file }) => file.name).join(', ') }));
        }
    }, [ addAttachments, setError ]);

    const {
        getRootProps, getInputProps, isDragActive,
    } = useDropzone({
        noClick: true,
        noKeyboard: true,
        onDrop: handleDrop,
        accept: ACCEPTED_FILES,
        ...dropzoneOptions,
    });

    if (disabledFeatures.attachments) {
        return children;
    }

    return (
        <DropzoneRoot {...getRootProps()}>
            <input {...getInputProps()} multiple style={{ display: 'none' }} />

            <DropzoneContent isDragActive={isDragActive}>
                {children}
            </DropzoneContent>

            {isDragActive && (
                <DropzoneOverlay>
                    <ap-typography variant={FontVariantToken.fontSizeMBold} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-dropzone-overlay-title')}
                    </ap-typography>

                    <ap-typography variant={FontVariantToken.fontSizeS} color={theme.palette.semantic.colorForeground}>
                        {t('autopilot-chat-dropzone-overlay-description', { fileTypes: ACCEPTED_FILE_EXTENSIONS.split(',').join(', ') })}
                    </ap-typography>
                </DropzoneOverlay>
            )}
        </DropzoneRoot>
    );
}

export const AutopilotChatDropzone = React.memo(AutopilotChatDropzoneComponent);
