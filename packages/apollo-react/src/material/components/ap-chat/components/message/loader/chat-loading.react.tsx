/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { useLoading } from '../../../providers/loading-provider.react';
import { LoadingIcon } from './chat-loading-icon.react';
import { LoadingMessage } from './chat-loading-text.react';

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
    const { showLoading } = useLoading();

    if (!showLoading) {
        return null;
    }

    return (
        <LoadingContainer>
            <LoadingIcon size={32}/>
            <LoadingMessage />
        </LoadingContainer>
    );
}
