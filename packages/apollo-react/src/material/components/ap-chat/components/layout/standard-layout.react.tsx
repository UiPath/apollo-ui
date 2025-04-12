/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    CHAT_HISTORY_WIDTH_FULL_SCREEN,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from '@uipath/portal-shell-util/src/autopilot/constants';
import React from 'react';

import { AutopilotChatHeader } from '../header/header.react';
import { AutopilotChatHistory } from '../history/chat-history.react';
import { AutopilotChatInput } from '../input/chat-input.react';
import { ChatScrollContainer } from '../message/chat-scroll-container.react';
import { LayoutProps } from './full-screen-layout.react';

const MainContainer = styled('div')<{ historyOpen: boolean }>(({ historyOpen }: {
    historyOpen: boolean;
}) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minWidth: '0',
    ...(historyOpen && { width: `calc(100% - ${CHAT_HISTORY_WIDTH_FULL_SCREEN}px)` }),
}));

const HeaderContainer = styled('div')(() => ({
    flexShrink: 0,
    padding: `${token.Spacing.SpacingBase} ${token.Spacing.SpacingL}`,
}));

const InputBackground = styled('div')(() => ({
    flexShrink: 0,
    padding: `${token.Spacing.SpacingXs} ${token.Spacing.SpacingL}`,
}));

const InputContainer = styled('div')(() => ({
    maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
    margin: '0 auto',
    width: '100%',
}));

export const StandardLayout: React.FC<LayoutProps> = ({
    historyOpen,
    historyDisabled,
    mode,
}) => {
    return (
        <>
            <MainContainer historyOpen={historyOpen}>
                <HeaderContainer>
                    <AutopilotChatHeader />
                </HeaderContainer>

                <ChatScrollContainer mode={mode} />

                <InputBackground>
                    <InputContainer>
                        <AutopilotChatInput />
                    </InputContainer>
                </InputBackground>
            </MainContainer>

            {!historyDisabled && (
                <AutopilotChatHistory open={historyOpen} isFullScreen={false} />
            )}
        </>
    );
};
