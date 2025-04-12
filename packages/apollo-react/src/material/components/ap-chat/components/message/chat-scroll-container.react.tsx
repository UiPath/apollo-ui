/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import styled from '@emotion/styled';
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
    marginBottom: token.Spacing.SpacingBase,
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

interface ChatScrollContainerProps {
    mode: AutopilotChatMode;
}

function ChatScrollContainerComponent({ mode }: ChatScrollContainerProps) {
    const {
        overflowContainerRef,
        contentRef,
    } = useChatScroll();

    return (
        <>
            <OverflowContainer tabIndex={0} id="overflow-container" ref={overflowContainerRef}>
                <MessagesContainer
                    id="content-ref"
                    ref={contentRef}
                    isFullScreen={mode === AutopilotChatMode.FullScreen}
                >
                    <AutopilotChatMessages/>
                </MessagesContainer>
            </OverflowContainer>

            <AutopilotChatScrollToBottomButton containerRef={overflowContainerRef}/>
        </>
    );
}

export const ChatScrollContainer = React.memo(ChatScrollContainerComponent);
