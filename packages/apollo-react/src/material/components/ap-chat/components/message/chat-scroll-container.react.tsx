/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import styled from '@emotion/styled';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatMode } from '@uipath/portal-shell-util';
import React from 'react';

import { useChatScroll } from '../../providers/chat-scroll-provider.react';
import { CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH } from '../../utils/constants';
import { AutopilotChatMessages } from './chat-message.react';
import { AutopilotChatScrollToBottomButton } from './chat-scroll-to-bottom.react';

const OverflowContainer = styled('div')(() => ({
    flex: '1 1 100%',
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    marginBottom: token.Spacing.SpacingBase,
    position: 'relative',
}));

const MessagesContainer = styled('div')(({ isFullScreen }: { isFullScreen: boolean }) => ({
    ...(isFullScreen && {
        maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
        margin: '0 auto',
        width: '100%',
    }),
    height: '100%',
}));

interface ChatScrollContainerProps {
    mode: AutopilotChatMode;
}

function ChatScrollContainerComponent({ mode }: ChatScrollContainerProps) {
    const {
        autoScroll,
        setAutoScroll,
        scrollToBottom,
        overflowContainerRef,
    } = useChatScroll();

    return (
        <>
            <OverflowContainer id="overflow-container" ref={overflowContainerRef}>
                <MessagesContainer isFullScreen={mode === AutopilotChatMode.FullScreen}>
                    <AutopilotChatMessages/>
                </MessagesContainer>
            </OverflowContainer>

            <AutopilotChatScrollToBottomButton
                visible={!autoScroll}
                onClick={() => {
                    scrollToBottom({ force: true });
                    setAutoScroll(true);
                }}
                containerRef={overflowContainerRef}
            />
        </>
    );
}

export const ChatScrollContainer = React.memo(ChatScrollContainerComponent);
