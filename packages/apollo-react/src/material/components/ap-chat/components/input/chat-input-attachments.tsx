/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { ApTooltipReact } from '../../../ap-tooltip/ap-tooltip.react';
import { FileType } from '../../models/chat.model';
import { useAttachments } from '../../providers/attachements-provider.react';
import { AutopilotChatActionButton } from '../common/action-button.react';

const AttachementsContainer = styled('div')(() => ({
    display: 'flex',
    flexWrap: 'wrap',
    padding: `0 ${token.Spacing.SpacingBase}`,
    gap: '0 10px',
}));

const Attachment = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: token.Spacing.SpacingMicro,
    margin: `${token.Spacing.SpacingXs} 0`,
    width: `calc(50% - 5px)`, // 10px is the gap between the attachments
    boxSizing: 'border-box',
    borderRadius: token.Border.BorderRadiusL,
    border: `${token.Border.BorderThickS} solid ${theme.palette.semantic.colorBorderDeEmp}`,

    '& .attachment-name': {
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        color: theme.palette.semantic.colorForeground,
    },

    '& .attachment-icon': {
        maxWidth: token.Spacing.SpacingXl,
        maxHeight: token.Spacing.SpacingXl,
        boxSizing: 'border-box',
        padding: token.Spacing.SpacingXs,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        borderRadius: token.Border.BorderRadiusM,
        backgroundColor: theme.palette.semantic.colorBackgroundSecondary,

        // TODO: might need to extract this as a token
        [`&.attachment-icon-${FileType.File}`]: { backgroundColor: '#078E9E' },
    },

    '& .attachment-remove': { marginLeft: 'auto' },
}));

export const AutopilotChatInputAttachments = () => {
    const {
        attachments, removeAttachment,
    } = useAttachments();

    return (
        <AttachementsContainer>
            {attachments.map((attachment) => (
                <Attachment key={attachment.name}>
                    {/* cannot directly use the svg as a component, throws error that the svg is not a valid react component */}
                    <span className={`attachment-icon attachment-icon-${attachment.friendlyType}`} dangerouslySetInnerHTML={{ __html: attachment.icon }} />

                    <ApTooltipReact
                        content={attachment.name}
                        placement="top"
                    >
                        <ap-typography class="attachment-name">{attachment.name}</ap-typography>
                    </ApTooltipReact>

                    <div className="attachment-remove">
                        <AutopilotChatActionButton
                            iconName="close"
                            tooltip={t('autopilot-chat-remove-file')}
                            onClick={() => removeAttachment(attachment.name)}
                        />
                    </div>
                </Attachment>
            ))}
        </AttachementsContainer>
    );
};
