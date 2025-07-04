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

const SuggestionList = styled('div')(({ disableAnimation }: { disableAnimation?: boolean }) => ({
    marginTop: token.Spacing.SpacingXl,
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
    animation: disableAnimation ? 'none' : 'popUpFromBottom 0.3s ease-out',
    maxWidth: `calc(100% - ${token.Spacing.SpacingL})`,

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
        backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
        borderColor: theme.palette.semantic.colorBorder,
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
        <SuggestionList disableAnimation={disableAnimation}>
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
