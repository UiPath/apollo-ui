import React from 'react';

import { styled } from '@mui/material';
import token from '@uipath/apollo-core';

import { ApTypography } from '../../../../ap-typography';
import { useChatState } from '../../../providers/chat-state-provider';
import { AutopilotChatSuggestions } from '../suggestions/chat-suggestions';

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
    const {
        firstRunExperience, spacing,
    } = useChatState();

    if (!firstRunExperience) {
        return null;
    }

    return (
        <FREContainer>
            <FREHeader>
                <ApTypography
                    variant={spacing.titleFontToken}
                    color={'var(--color-foreground)'}
                >
                    {firstRunExperience.title}
                </ApTypography>
                <ApTypography
                    variant={spacing.primaryFontToken}
                    color={'var(--color-foreground-de-emp)'}
                >
                    {firstRunExperience.description}
                </ApTypography>
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
