/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { useChatState } from '../../providers/chat-state-provider.react';
import { ChatHistoryGroup } from './chat-history.react';
import { AutopilotChatHistoryItem } from './chat-history-item.react';

const GroupContainer = styled('div')<{ compactMode: boolean }>(({ compactMode }) => (
    { marginBottom: compactMode ? token.Spacing.SpacingXs : token.Spacing.SpacingBase }
));

const GroupTitle = styled('div')(() => ({
    padding: `${token.Padding.PadXl} ${token.Padding.PadL}`,
    margin: `0 ${token.Spacing.SpacingBase}`,
}));

interface AutopilotChatHistoryGroupProps {
    group: ChatHistoryGroup;
    isHistoryOpen: boolean;
}

const AutopilotChatHistoryGroupComponent: React.FC<AutopilotChatHistoryGroupProps> = ({
    group, isHistoryOpen,
}) => {
    const theme = useTheme();
    const { spacing } = useChatState();

    return (
        <GroupContainer compactMode={spacing.compactMode}>
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
                        isHistoryOpen={isHistoryOpen}
                    />
                ))}
            </div>
        </GroupContainer>
    );
};

export const AutopilotChatHistoryGroup = React.memo(AutopilotChatHistoryGroupComponent);
