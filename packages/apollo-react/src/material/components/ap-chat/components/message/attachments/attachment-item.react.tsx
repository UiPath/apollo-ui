/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { ApTooltipReact } from '../../../../ap-tooltip/ap-tooltip.react';
import { AutopilotChatFileInfo } from '../../../models/chat.model';
import { AttachmentIcon } from '../../input/chat-input-attachments.react';

const AttachmentItemContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingS,
    margin: `${token.Spacing.SpacingS} 0`,

    '& .attachment-name': {
        color: theme.palette.semantic.colorForeground,
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
}));

interface AttachmentItemProps {
    attachment: AutopilotChatFileInfo;
}

function AttachmentItemComponent({ attachment }: AttachmentItemProps) {
    return (
        <AttachmentItemContainer>
            <AttachmentIcon
                fileType={attachment.friendlyType}
                width={token.Spacing.SpacingXl}
                height={token.Spacing.SpacingXl}
                className={`attachment-icon attachment-icon-${attachment.friendlyType}`}
                dangerouslySetInnerHTML={{ __html: attachment.icon }}
            />
            <ApTooltipReact content={attachment.name}>
                <ap-typography class="attachment-name">{attachment.name}</ap-typography>
            </ApTooltipReact>
        </AttachmentItemContainer>
    );
}

export const AttachmentItem = React.memo(AttachmentItemComponent);
