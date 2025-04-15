/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import { AutopilotChatSuggestion } from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from '../../../providers/chat-service.provider.react';
import { useChatState } from '../../../providers/chat-state-provider.react';

const FREContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: token.Border.BorderRadiusL,
    position: 'absolute',
    bottom: 0,
    marginBottom: token.Spacing.SpacingL,
}));

const FREHeader = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
}));

const SuggestionList = styled('div')(() => ({
    marginTop: token.Spacing.SpacingXl,
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
}));

const Suggestion = styled('div')(({ theme }) => ({
    outlineColor: theme.palette.semantic.colorFocusIndicator,
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content',
    gap: token.Spacing.SpacingXs,
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingBase}`,
    borderRadius: token.Border.BorderRadiusM,
    border: `1px solid ${theme.palette.semantic.colorSkeleton}`,
    cursor: 'pointer',

    '&:hover': {
        backgroundColor: theme.palette.semantic.colorHover,
        borderColor: theme.palette.semantic.colorBorder,
    },
}));

function AutopilotChatFREComponent() {
    const theme = useTheme();
    const { firstRunExperience } = useChatState();
    const chatService = useChatService();

    const handleSuggestionClick = React.useCallback(
        (
            _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
            suggestion: AutopilotChatSuggestion,
        ) => {
            chatService.setPrompt(suggestion.prompt);
        },
        [ chatService ],
    );

    const handleSuggestionKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>, suggestion: AutopilotChatSuggestion) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            handleSuggestionClick(event, suggestion);
        }
    }, [ handleSuggestionClick ]);

    if (!firstRunExperience) {
        return null;
    }

    return (
        <FREContainer>
            <FREHeader>
                <ap-typography
                    variant={FontVariantToken.fontSizeH4}
                    color={theme.palette.semantic.colorForeground}
                >
                    {firstRunExperience.title}
                </ap-typography>
                <ap-typography
                    variant={FontVariantToken.fontSizeM}
                    color={theme.palette.semantic.colorForegroundDeEmp}
                >
                    {firstRunExperience.description}
                </ap-typography>
            </FREHeader>

            {firstRunExperience.suggestions && firstRunExperience.suggestions.length > 0 && (
                <SuggestionList>
                    {firstRunExperience.suggestions.map((suggestion) => (
                        <Suggestion
                            onKeyDown={(event) => handleSuggestionKeyDown(event, suggestion)}
                            onClick={(event) => handleSuggestionClick(event, suggestion)}
                            tabIndex={0}
                            key={suggestion.label}
                        >
                            <ap-typography color={theme.palette.semantic.colorForeground} variant={FontVariantToken.fontSizeM}>
                                {suggestion.label}
                            </ap-typography>
                        </Suggestion>
                    ))}
                </SuggestionList>
            )}
        </FREContainer>
    );
}

export const AutopilotChatFRE = React.memo(AutopilotChatFREComponent);
