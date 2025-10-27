/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { useChatState } from '../../../providers/chat-state-provider.react';
import { AutopilotChatSuggestions } from '../suggestions/chat-suggestions.react';

const FREContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: token.Border.BorderRadiusL,
    position: 'absolute',
    bottom: 0,
    marginBottom: token.Spacing.SpacingL,
    maxHeight: `calc(100% - ${token.Spacing.SpacingL})`,
    width: `calc(100% - (2 * ${token.Spacing.SpacingL}))`,
    overflow: 'auto',
}));

const FREHeader = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
    marginBottom: token.Spacing.SpacingL,
}));

function AutopilotChatFREComponent() {
    const theme = useTheme();
    const {
        firstRunExperience, spacing,
    } = useChatState();

    if (!firstRunExperience) {
        return null;
    }

    return (
        <FREContainer>
            <FREHeader>
                <ap-typography
                    variant={spacing.titleFontToken}
                    color={theme.palette.semantic.colorForeground}
                >
                    {firstRunExperience.title}
                </ap-typography>
                <ap-typography
                    variant={spacing.primaryFontToken}
                    color={theme.palette.semantic.colorForegroundDeEmp}
                >
                    {firstRunExperience.description}
                </ap-typography>
            </FREHeader>

            {firstRunExperience.suggestions && firstRunExperience.suggestions.length > 0 && (
                <AutopilotChatSuggestions
                    disableAnimation={true}
                    suggestions={firstRunExperience.suggestions}
                    sendOnClick={firstRunExperience.sendOnClick}
                />
            )}
        </FREContainer>
    );
}

export const AutopilotChatFRE = React.memo(AutopilotChatFREComponent);
