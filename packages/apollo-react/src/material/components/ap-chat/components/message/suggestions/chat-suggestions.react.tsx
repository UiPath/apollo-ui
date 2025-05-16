/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import { AutopilotChatSuggestion } from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';
import { useChatService } from '../../../providers/chat-service.provider.react';

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
    borderRadius: token.Border.BorderRadiusL,
    border: `1px solid ${theme.palette.semantic.colorBorderDisabled}`,
    cursor: 'pointer',

    '&:hover': {
        backgroundColor: theme.palette.semantic.colorHover,
        borderColor: theme.palette.semantic.colorBorder,
    },
}));

const Title = styled('div')(() => ({ marginBottom: token.Spacing.SpacingMicro }));

function AutopilotChatSuggestionsComponent({
    includeTitle,
    sendOnClick,
    suggestions,
}: { suggestions: AutopilotChatSuggestion[]; sendOnClick?: boolean; includeTitle?: boolean }) {
    const theme = useTheme();
    const chatService = useChatService();

    const handleSuggestionClick = React.useCallback(
        (
            _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
            suggestion: AutopilotChatSuggestion,
        ) => {
            if (sendOnClick) {
                chatService.sendRequest({ content: suggestion.prompt });
            } else {
                chatService.setPrompt(suggestion.prompt);
            }
        },
        [ chatService, sendOnClick ],
    );

    const handleSuggestionKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>, suggestion: AutopilotChatSuggestion) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            handleSuggestionClick(event, suggestion);
        }
    }, [ handleSuggestionClick ]);

    return (
        <SuggestionList>
            {includeTitle && (
                <Title>
                    <ap-typography
                        variant={FontVariantToken.fontSizeMBold}
                        color={theme.palette.semantic.colorForegroundEmp}
                    >
                        {t('autopilot-chat-suggestions-title')}
                    </ap-typography>
                </Title>
            )}
            {suggestions.map((suggestion, index) => (
                <Suggestion
                    onKeyDown={(event) => handleSuggestionKeyDown(event, suggestion)}
                    onClick={(event) => handleSuggestionClick(event, suggestion)}
                    tabIndex={0}
                    key={suggestion.label}
                    data-cy={`autopilot-chat-suggestion-nth-${index}`}
                >
                    <ap-typography color={theme.palette.semantic.colorForeground} variant={FontVariantToken.fontSizeM}>
                        {suggestion.label}
                    </ap-typography>
                </Suggestion>
            ))}
        </SuggestionList>
    );
}

export const AutopilotChatSuggestions = React.memo(AutopilotChatSuggestionsComponent);
