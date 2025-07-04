/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    keyframes,
    styled,
} from '@mui/material';
import { CHAT_LOADER_GRADIENT_WIDTH } from '@uipath/portal-shell-util';
import React from 'react';

import { useLoading } from '../../../providers/loading-provider.react';
import { LoadingMessage } from './chat-loading-text.react';

const shimmerAnimation = keyframes`
  0% {
    transform: translateX(-${CHAT_LOADER_GRADIENT_WIDTH}px);
  }
  100% {
    transform: translateX(${CHAT_LOADER_GRADIENT_WIDTH}px);
  }
`;

const LoadingMessageContainer = styled('div')(({ theme }) => ({
    position: 'relative',
    display: 'inline-block',
    overflow: 'hidden',
    width: 'fit-content',

    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${CHAT_LOADER_GRADIENT_WIDTH}px`,
        height: '100%',
        background: `linear-gradient(
            90deg,
            ${theme.palette.semantic.colorBackground}20 0%,
            ${theme.palette.semantic.colorBackground}40 25%,
            ${theme.palette.semantic.colorBackground}80 50%,
            ${theme.palette.semantic.colorBackground}40 75%,
            ${theme.palette.semantic.colorBackground}20 100%
        )`,
        animation: `${shimmerAnimation} 2s ease-in-out infinite`,
    },
}));

export function AutopilotChatLoading() {
    const { showLoading } = useLoading();

    if (!showLoading) {
        return null;
    }

    return (
        <LoadingMessageContainer>
            <LoadingMessage/>
        </LoadingMessageContainer>
    );
}
