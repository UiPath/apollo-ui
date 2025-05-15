/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core/lib';
import { AutopilotChatSource } from '@uipath/portal-shell-util';
import React from 'react';

import { t } from '../../../../../utils/localization/loc';

const SourceList = styled('div')(() => ({
    marginTop: token.Spacing.SpacingXl,
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingMicro,
}));

const Source = styled('a')(({ theme }) => ({
    alignItems: 'center',
    color: theme.palette.semantic.colorForeground,
    cursor: 'pointer',
    display: 'flex',
    gap: token.Spacing.SpacingXs,
    textDecoration: 'none',
    width: 'fit-content',

    '&:hover': {
        color: theme.palette.semantic.colorForegroundLink,
        textDecoration: 'none',
    },
}));

const Title = styled('div')(() => ({ marginBottom: token.Spacing.SpacingXs }));

const Count = styled('span')(({ theme }) => ({
    alignItems: 'center',
    border: `1px solid ${theme.palette.semantic.colorBorderDisabled}`,
    borderRadius: token.Border.BorderRadiusS,
    display: 'flex',
    height: 16,
    justifyContent: 'center',
    padding: token.Padding.PadXs,
    width: 16,
}));

function AutopilotChatSourcesComponent({ sources }: { sources: AutopilotChatSource[] }) {
    const theme = useTheme();

    return (
        <SourceList>
            <Title>
                <ap-typography
                    variant={FontVariantToken.fontSizeMBold}
                    color={theme.palette.semantic.colorForegroundEmp}
                >
                    {t('autopilot-chat-sources-title')}
                </ap-typography>
            </Title>
            {sources.map((source, index) => (
                <Source
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    key={source.title}
                    theme={theme}
                >
                    <Count theme={theme}>
                        <ap-typography variant={FontVariantToken.fontSizeM}>
                            {index + 1}
                        </ap-typography>
                    </Count>
                    <ap-typography variant={FontVariantToken.fontSizeM}>
                        {source.title}
                    </ap-typography>
                </Source>
            ))}
        </SourceList>
    );
}

export const AutopilotChatSources = React.memo(AutopilotChatSourcesComponent);
