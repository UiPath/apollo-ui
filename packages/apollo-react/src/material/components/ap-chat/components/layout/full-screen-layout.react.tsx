/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatInternalEvent,
    AutopilotChatMode,
    CHAT_CONTAINER_ANIMATION_DURATION,
    CHAT_DRAWER_WIDTH_FULL_SCREEN,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from '@uipath/portal-shell-util';
import React from 'react';

import { useChatService } from '../../providers/chat-service.provider.react';
import { AutopilotChatHeader } from '../header/header.react';
import { AutopilotChatHistory } from '../history/chat-history.react';
import { AutopilotChatInput } from '../input/chat-input.react';
import { ChatScrollContainer } from '../message/chat-scroll-container.react';
import AutopilotChatSettings from '../settings/chat-settings.react';

const ContentContainer = styled('div')(() => ({
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    minWidth: '0',
}));

const MainContainer = styled('div')<{ historyOpen: boolean }>(({ historyOpen }: {
    historyOpen: boolean;
}) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    ...(historyOpen && { width: `calc(100% - ${CHAT_DRAWER_WIDTH_FULL_SCREEN}px - 2 * ${token.Spacing.SpacingBase})` }), // account for padding
}));

const HeaderContainer = styled('div')(() => ({
    flexShrink: 0,
    padding: `${token.Spacing.SpacingBase} ${token.Spacing.SpacingL}`,
}));

const InputBackground = styled('div')(() => ({
    flexShrink: 0,
    padding: `0 ${token.Spacing.SpacingL} ${token.Spacing.SpacingXs}`,
}));

const InputContainer = styled('div')(() => ({
    maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
    margin: '0 auto',
    width: '100%',
}));

interface FullScreenLayoutProps {
    historyOpen: boolean;
    settingsOpen: boolean;
    historyDisabled: boolean;
    settingsDisabled: boolean;
    mode: AutopilotChatMode;
}

export const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
    historyOpen,
    settingsOpen,
    historyDisabled,
    settingsDisabled,
    mode,
}) => {
    const chatInternalService = useChatService().__internalService__;
    const mainContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!chatInternalService || !mainContainerRef.current) {
            return;
        }

        // wait for the main container animation to finish
        const timeout = setTimeout(() => {
            chatInternalService.publish(AutopilotChatInternalEvent.ChatResize, mainContainerRef.current?.offsetWidth);
        }, CHAT_CONTAINER_ANIMATION_DURATION);

        return () => clearTimeout(timeout);
    }, [ historyOpen, chatInternalService, mainContainerRef ]);

    return (
        <>
            <HeaderContainer>
                <AutopilotChatHeader />
            </HeaderContainer>

            <ContentContainer>
                <MainContainer ref={mainContainerRef} historyOpen={historyOpen}>
                    <ChatScrollContainer mode={mode} />

                    <InputBackground>
                        <InputContainer>
                            <AutopilotChatInput />
                        </InputContainer>
                    </InputBackground>
                </MainContainer>

                {!historyDisabled && (
                    <AutopilotChatHistory open={historyOpen} isFullScreen={true} />
                )}

                {!settingsDisabled && (
                    <AutopilotChatSettings open={settingsOpen} isFullScreen={true}/>
                )}
            </ContentContainer>
        </>
    );
};
