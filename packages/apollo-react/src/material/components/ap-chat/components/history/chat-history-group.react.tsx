/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { ChatHistoryGroup } from './chat-history.react';
import { AutopilotChatHistoryItem } from './chat-history-item.react';

const GroupContainer = styled('div')(() => ({ marginBottom: token.Spacing.SpacingL }));
const GroupTitle = styled('div')(() => ({ padding: `${token.Padding.PadXl} ${token.Padding.PadL}` }));

interface AutopilotChatHistoryGroupProps {
    group: ChatHistoryGroup;
}

const AutopilotChatHistoryGroupComponent: React.FC<AutopilotChatHistoryGroupProps> = ({ group }) => {
    const theme = useTheme();

    return (
        <GroupContainer>
            <GroupTitle>
                <ap-typography variant={FontVariantToken.fontSizeSBold} color={theme.palette.semantic.colorForeground}>
                    {group.title}
                </ap-typography>
            </GroupTitle>

            <div>
                {group.items.map((item) => (
                    <AutopilotChatHistoryItem
                        key={item.id}
                        item={item}
                    />
                ))}
            </div>
        </GroupContainer>
    );
};

export const AutopilotChatHistoryGroup = React.memo(AutopilotChatHistoryGroupComponent);
