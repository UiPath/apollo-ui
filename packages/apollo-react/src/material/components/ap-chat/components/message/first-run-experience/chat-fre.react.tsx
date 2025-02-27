/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import { AutopilotChatEvent } from '@uipath/portal-shell-util';
import React, {
    useEffect,
    useState,
} from 'react';

import { AutopilotChatService } from '../../../services/chat-service';

const FREContainer = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    borderRadius: token.Border.BorderRadiusL,
    justifyContent: 'flex-end',
    height: '100%',
    marginBottom: token.Spacing.SpacingBase,
}));

const FREHeader = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingM,
}));

const SuggestionList = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
    marginTop: token.Spacing.SpacingXxl,
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
}));

interface FirstRunConfig {
    title: string;
    description: string;
    suggestions?: string[];
}

function AutopilotChatFREComponent() {
    const theme = useTheme();
    const chatService = AutopilotChatService.Instance;
    const [ firstRunConfig, setFirstRunConfig ] = useState<FirstRunConfig | undefined>(chatService.getConfig().firstRunExperience);

    useEffect(() => {
        const unsubscribe = chatService.on(AutopilotChatEvent.SetFirstRunExperience, (config) => {
            if (config) {
                setFirstRunConfig(config);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [ chatService ]);

    const handleSuggestionClick = React.useCallback((event: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
        chatService.sendRequest({ content: event.currentTarget.textContent ?? '' });
    }, [ chatService ]);

    const handleSuggestionKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            handleSuggestionClick(event);
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
                <SuggestionList>
                    {firstRunConfig.suggestions.map((suggestion) => (
                        <Suggestion onKeyDown={handleSuggestionKeyDown} onClick={handleSuggestionClick} tabIndex={0} key={suggestion}>
                            <ap-typography variant={FontVariantToken.fontSizeM}>
                                {suggestion}
                            </ap-typography>
                        </Suggestion>
                    ))}
                </SuggestionList>
            )}
        </FREContainer>
    );
}

export const AutopilotChatFRE = React.memo(AutopilotChatFREComponent);
