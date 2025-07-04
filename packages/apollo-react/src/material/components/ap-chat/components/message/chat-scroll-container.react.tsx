/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    styled,
    Theme,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatMode,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider.react';
import { AutopilotChatMessages } from './chat-message.react';
import { AutopilotChatScrollToBottomButton } from './chat-scroll-to-bottom.react';

const OverflowContainer = styled('div')(() => ({
    flex: '1 1 100%',
    minHeight: 0,
    overflowY: 'auto',
    position: 'relative',
    outline: 'none',
}));

const MessagesContainer = styled('div')(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
}));

const GradientContainer = styled('div')(({ theme }: { theme: Theme }) => ({
    position: 'sticky',
    zIndex: 1,
    bottom: 0,
    left: token.Spacing.SpacingBase,
    width: `calc(100% - 2 * ${token.Spacing.SpacingBase})`,
    height: token.Spacing.SpacingBase,
    background: `linear-gradient(
        to bottom,
        ${theme.palette.semantic.colorBackground}25 0%,
        ${theme.palette.semantic.colorBackground}50 25%,
        ${theme.palette.semantic.colorBackground} 50%
    )`,
}));

interface ChatScrollContainerProps {
    mode: AutopilotChatMode;
}

function ChatScrollContainerComponent({ mode }: ChatScrollContainerProps) {
    const {
        setOverflowContainer,
        contentRef,
        overflowContainer,
    } = useChatScroll();

    return (
        <>
            <OverflowContainer tabIndex={0} id="overflow-container" ref={setOverflowContainer}>
                <MessagesContainer
                    id="content-ref"
                    ref={contentRef}
                    isFullScreen={mode === AutopilotChatMode.FullScreen}
                >
                    <AutopilotChatMessages/>
                </MessagesContainer>

                <GradientContainer/>
            </OverflowContainer>

            <AutopilotChatScrollToBottomButton overflowContainer={overflowContainer}/>
        </>
    );
}

export const ChatScrollContainer = React.memo(ChatScrollContainerComponent);
