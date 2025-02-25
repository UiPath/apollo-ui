/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { useLoading } from '../../providers/loading-provider.react';
import { LoadingIcon } from './loader/chat-loading-icon.react';
import { LoadingMessage } from './loader/chat-loading-text.react';

const LoadingContainer = styled('div')(({ theme }) => {
    return {
        display: 'flex',
        padding: token.Spacing.SpacingBase,
        paddingRight: `calc(${token.Spacing.SpacingBase} + ${token.Spacing.SpacingXl})`,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: token.Spacing.SpacingM,
        borderRadius: token.Border.BorderRadiusL,
        backgroundColor: 'unset',
        marginRight: token.Spacing.SpacingL,
        whiteSpace: 'pre-wrap',
        overflowWrap: 'anywhere',
        color: theme.palette.semantic.colorForeground,
    };
});

export function AutopilotChatLoading() {
    const { waitingResponse } = useLoading();

    if (!waitingResponse) {
        return null;
    }

    return (
        <LoadingContainer>
            <LoadingIcon size={32}/>
            <LoadingMessage />
        </LoadingContainer>
    );
}
