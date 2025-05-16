/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import React from 'react';

const DisclaimerList = styled('div')(() => ({
    marginTop: token.Spacing.SpacingXl,
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingXs,
}));

const Disclaimer = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-start',
    width: 'fit-content',
    gap: token.Spacing.SpacingXs,
    padding: token.Padding.PadL,
    backgroundColor: theme.palette.semantic.colorWarningBackground,
}));

function AutopilotChatDisclaimersComponent({ disclaimers }: { disclaimers: string[] }) {
    const theme = useTheme();

    return (
        <DisclaimerList>
            {disclaimers.map((disclaimer, index) => (
                <Disclaimer
                    theme={theme}
                    key={disclaimer}
                    data-cy={`autopilot-chat-disclaimer-nth-${index}`}
                >
                    <portal-custom-icon name="warning" color={theme.palette.semantic.colorWarningIcon}></portal-custom-icon>
                    <ap-typography color={theme.palette.semantic.colorWarningText} variant={FontVariantToken.fontSizeM}>
                        {disclaimer}
                    </ap-typography>
                </Disclaimer>
            ))}
        </DisclaimerList>
    );
}

export const AutopilotChatDisclaimers = React.memo(AutopilotChatDisclaimersComponent);
