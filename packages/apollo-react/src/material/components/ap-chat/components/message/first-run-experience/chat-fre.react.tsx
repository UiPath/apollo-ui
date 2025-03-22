/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import {
    AutopilotChatConfiguration,
    AutopilotChatEvent,
    AutopilotChatSuggestion,
} from '@uipath/portal-shell-util';
import React, { useState } from 'react';

import { t } from '../../../../../utils/localization/loc';
import { AutopilotChatService } from '../../../services/chat-service';

const FREContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: token.Border.BorderRadiusL,
    position: 'absolute',
    bottom: 0,
}));

const FREHeader = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
}));

const SuggestionsHeader = styled('div')(({ theme }) => ({
    color: theme.palette.semantic.colorForegroundDeEmp,
    marginTop: token.Spacing.SpacingXxl,
    marginBottom: token.Spacing.SpacingBase,
}));

const SuggestionList = styled('div')(() => ({
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
    const chatService = AutopilotChatService.Instance;
    const [ firstRunConfig, setFirstRunConfig ] = useState<
    AutopilotChatConfiguration['firstRunExperience'] | undefined
    >(chatService?.getConfig?.()?.firstRunExperience);

    React.useEffect(() => {
        if (!chatService) {
            return;
        }

        const unsubscribe = chatService.on(AutopilotChatEvent.SetFirstRunExperience, (config) => {
            if (config) {
                setFirstRunConfig(config);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [ chatService ]);

    const handleSuggestionClick = React.useCallback(
        (
            _event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>,
            suggestion: AutopilotChatSuggestion,
        ) => {
            chatService.sendRequest({ content: suggestion.prompt });
        },
        [ chatService ],
    );

    const handleSuggestionKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>, suggestion: AutopilotChatSuggestion) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            handleSuggestionClick(event, suggestion);
        }
    }, [ handleSuggestionClick ]);

    if (!firstRunConfig) {
        return null;
    }

    return (
        <FREContainer>
            <FREHeader>
                <ap-typography
                    variant={FontVariantToken.fontSizeH4}
                    color={theme.palette.semantic.colorForeground}
                >
                    {firstRunConfig.title}
                </ap-typography>
                <ap-typography
                    variant={FontVariantToken.fontSizeM}
                    color={theme.palette.semantic.colorForegroundDeEmp}
                >
                    {firstRunConfig.description}
                </ap-typography>
            </FREHeader>

            {firstRunConfig.suggestions && firstRunConfig.suggestions.length > 0 && (
                <>
                    <SuggestionsHeader>
                        <ap-typography variant={FontVariantToken.fontSizeMBold}>
                            {t('autopilot-chat-suggestions')}
                        </ap-typography>
                    </SuggestionsHeader>
                    <SuggestionList>
                        {firstRunConfig.suggestions.map((suggestion) => (
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
                </>
            )}
        </FREContainer>
    );
}

export const AutopilotChatFRE = React.memo(AutopilotChatFREComponent);
