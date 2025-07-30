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
import { useChatState } from '../../providers/chat-state-provider.react';
import { AutopilotChatMessages } from './chat-message.react';
import { AutopilotChatScrollToBottomButton } from './chat-scroll-to-bottom.react';

const OverflowContainer = styled('div')(({
    isOverflow, isContainerWide,
}: { isOverflow: boolean; isContainerWide: boolean }) => ({
    flex: '1 1 100%',
    minHeight: 0,
    overflowY: 'auto',
    position: 'relative',
    outline: 'none',
    // move the scrollbar to the right
    margin: `0 -${token.Spacing.SpacingL}`,
    padding: `0 ${token.Spacing.SpacingL}`,

    ...(isOverflow && !isContainerWide && {
        // account for the scrollbar
        paddingRight: token.Spacing.SpacingXs,
    }),
}));

const MessagesContainer = styled('div')(
    ({ mode }: { mode: AutopilotChatMode }) => ({
        ...((mode === AutopilotChatMode.FullScreen || mode === AutopilotChatMode.Embedded) && {
            maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
            margin: '0 auto',
            width: '100%',
        }),
    }),
);

const StyledGradientContainer = styled('div')(({ theme }: { theme: Theme }) => ({
    position: 'sticky',
    zIndex: 1,
    bottom: 0,
    left: token.Spacing.SpacingBase,
    width: '100%',
    height: token.Spacing.SpacingBase,
    background: `linear-gradient(
        to bottom,
            ${theme.palette.semantic.colorBackground}25 0%,
            ${theme.palette.semantic.colorBackground}50 25%,
            ${theme.palette.semantic.colorBackground} 50%
        )`,
}));

const GradientContainer = React.memo(() => {
    const { hasMessages } = useChatState();

    if (!hasMessages) {
        return null;
    }

    return (
        <StyledGradientContainer />
    );
});

interface ChatScrollContainerProps {
    mode: AutopilotChatMode;
}

function ChatScrollContainerComponent({ mode }: ChatScrollContainerProps) {
    const {
        setOverflowContainer,
        contentRef,
        overflowContainer,
        isOverflow,
        isContainerWide,
    } = useChatScroll();

    return (
        <>
            <OverflowContainer
                tabIndex={0}
                id="overflow-container"
                isOverflow={isOverflow}
                isContainerWide={isContainerWide}
                ref={setOverflowContainer}
            >
                <MessagesContainer
                    id="content-ref"
                    ref={contentRef}
                    mode={mode}
                >
                    <AutopilotChatMessages isOverflow={isOverflow} isContainerWide={isContainerWide}/>
                </MessagesContainer>

                <GradientContainer/>
            </OverflowContainer>

            <AutopilotChatScrollToBottomButton overflowContainer={overflowContainer}/>
        </>
    );
}

export const ChatScrollContainer = React.memo(ChatScrollContainerComponent);
