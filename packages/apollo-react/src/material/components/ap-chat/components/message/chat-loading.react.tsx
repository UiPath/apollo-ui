/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useLoading } from '../../providers/loading-provider.react';

const LoadingContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    padding: token.Spacing.SpacingBase,
    paddingRight: `calc(${token.Spacing.SpacingBase} + ${token.Spacing.SpacingXl})`,
    flexDirection: 'column',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    gap: token.Spacing.SpacingMicro,
    borderRadius: token.Border.BorderRadiusL,
    backgroundColor: 'unset',
    marginRight: token.Spacing.SpacingL,
    maxWidth: 'calc(100% - 112px)',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    color: theme.palette.text.secondary,
}));

export function AutopilotChatLoading() {
    const { waitingResponse } = useLoading();

    if (!waitingResponse) {
        return null;
    }

    return (
        <LoadingContainer>
            <ap-typography>{t('autopilot-chat-thinking')}</ap-typography>
        </LoadingContainer>
    );
}
