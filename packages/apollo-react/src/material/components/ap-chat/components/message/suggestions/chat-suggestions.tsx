import React from 'react';

import {
  styled,
  Theme,
} from '@mui/material';
import token from '@uipath/apollo-core';

import { t } from '../../../../../utils/localization/loc';
import { useChatService } from '../../../providers/chat-service.provider';
import { useChatState } from '../../../providers/chat-state-provider';
import {
  AutopilotChatInternalEvent,
  AutopilotChatSuggestion,
} from '../../../service';

const SuggestionList = styled('div')(({
    disableAnimation, gap,
}: { disableAnimation?: boolean; gap: number }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap,
    animation: disableAnimation ? 'none' : 'popUpFromBottom 0.3s ease-out',
    maxWidth: `100%`,

    '@keyframes popUpFromBottom': {
        '0%': {
            opacity: 0,
            transform: 'translateY(20px)',
        },
        '100%': {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
}));

const Suggestion = styled('button')(({
    padding,
}: { theme: Theme; padding: string }) => ({
    backgroundColor: 'transparent',
    outlineColor: 'var(--color-focus-indicator)',
    display: 'flex',
    alignItems: 'center',
    width: 'fit-content',
    gap: token.Spacing.SpacingXs,
    padding,
    borderRadius: token.Border.BorderRadiusL,
    border: `1px solid var(--color-border-disabled)`,
    cursor: 'pointer',

    '&:hover': {
        backgroundColor: 'var(--color-background-secondary)',
        borderColor: 'var(--color-border)',
    },
}));

const Title = styled('div')(() => ({ marginBottom: token.Spacing.SpacingMicro }));

interface AutopilotChatSuggestionsProps {
    suggestions: AutopilotChatSuggestion[];
    sendOnClick?: boolean;
    includeTitle?: boolean;
    disableAnimation?: boolean;
}

function AutopilotChatSuggestionsComponent({
    includeTitle,
    sendOnClick,
    suggestions,
    disableAnimation,
}: AutopilotChatSuggestionsProps) {
    const chatService = useChatService();
    const { spacing } = useChatState();

    const handleSuggestionClick = React.useCallback(
        (
            _event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>,
            suggestion: AutopilotChatSuggestion,
        ) => {
            if (sendOnClick) {
                chatService.sendRequest({ content: suggestion.prompt });
            } else {
                chatService.setPrompt(suggestion.prompt);
            }
            chatService.__internalService__.publish(AutopilotChatInternalEvent.SetInputFocused, true);
        },
        [ chatService, sendOnClick ],
    );

    const handleSuggestionKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLButtonElement>, suggestion: AutopilotChatSuggestion) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();

                handleSuggestionClick(event, suggestion);
            }
        }, [ handleSuggestionClick ]);

    return (
        <SuggestionList disableAnimation={disableAnimation} gap={spacing.suggestionSpacing}>
            {includeTitle && (
                <Title>
                    <ap-typography
                        variant={spacing.primaryBoldFontToken}
                        color={'var(--color-foreground-emp)'}
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
                    style={{ padding: spacing.suggestionPadding }}
                >
                    <ap-typography color={'var(--color-foreground)'} variant={spacing.suggestionFontToken}>
                        {suggestion.label}
                    </ap-typography>
                </Suggestion>
            ))}
        </SuggestionList>
    );
}

export const AutopilotChatSuggestions = React.memo(AutopilotChatSuggestionsComponent);
