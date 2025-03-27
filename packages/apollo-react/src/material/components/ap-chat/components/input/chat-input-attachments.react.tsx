/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatFileType } from '@uipath/portal-shell-util';
import React from 'react';

import { useAttachments } from '../../providers/attachements-provider.react';
import { Attachment } from './chat-input-attachments-item.react';

const AttachementsContainer = styled('div')(() => ({
    display: 'flex',
    flexWrap: 'wrap',
    padding: `0 ${token.Spacing.SpacingBase}`,
    marginTop: token.Spacing.SpacingMicro,
    gap: `0 ${token.Spacing.SpacingXs}`,
    maxHeight: '190px',
    overflowY: 'auto',
}));

export const AttachmentIcon = styled('span')<{ fileType?: AutopilotChatFileType; width?: string; height?: string }>(({
    theme, fileType, width, height,
}) => ({
    maxWidth: width ?? token.Spacing.SpacingM,
    maxHeight: height ?? token.Spacing.SpacingM,
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: token.Spacing.SpacingXs,
    borderRadius: token.Border.BorderRadiusM,

    ...(fileType === AutopilotChatFileType.File ? {
        padding: token.Spacing.SpacingMicro,
        backgroundColor: '#078E9E',
    } : {
        backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
        '& svg': {
            width: width ?? token.Spacing.SpacingM,
            height: height ?? token.Spacing.SpacingM,
        },
    }),
}));

function AutopilotChatInputAttachmentsComponent() {
    const {
        attachments, removeAttachment,
    } = useAttachments();
    const [ focusedAttachmentIndex, setFocusedAttachmentIndex ] = React.useState<number | null>(null);

    const handleSetFocusedAttachmentIndex = React.useCallback((index: number) => {
        const animationFrameRef = requestAnimationFrame(() => {
            if (attachments.length <= 1) {
                setFocusedAttachmentIndex(null);
            } else if (index === attachments.length - 1) {
                setFocusedAttachmentIndex(index - 1);
            } else {
                setFocusedAttachmentIndex(index);
            }
        });

        return () => {
            if (animationFrameRef) {
                cancelAnimationFrame(animationFrameRef);
            }
        };
    }, [ attachments.length ]);

    const handleRemoveAttachment = React.useCallback((name: string, index: number) => {
        handleSetFocusedAttachmentIndex(index);
        removeAttachment(name);
    }, [ handleSetFocusedAttachmentIndex, removeAttachment ]);

    return (
        <AttachementsContainer>
            {attachments.map((attachment, index) => (
                <Attachment
                    key={attachment.name + attachment.size}
                    attachment={attachment}
                    onRemove={(name) => handleRemoveAttachment(name, index)}
                    shouldFocus={focusedAttachmentIndex === index}
                    setFocusedAttachmentIndex={() => handleSetFocusedAttachmentIndex(index)}
                />
            ))}
        </AttachementsContainer>
    );
}

export const AutopilotChatInputAttachments = React.memo(AutopilotChatInputAttachmentsComponent);
