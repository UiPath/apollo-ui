/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import { styled } from '@mui/material/styles';
import token from '@uipath/apollo-core/lib';
import {
    AutopilotChatMode,
    CHAT_DRAWER_WIDTH_FULL_SCREEN,
    CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
} from '@uipath/portal-shell-util';
import React from 'react';

import { AutopilotChatHeader } from '../header/header.react';
import { AutopilotChatHistory } from '../history/chat-history.react';
import { AutopilotChatInput } from '../input/chat-input.react';
import { ChatScrollContainer } from '../message/chat-scroll-container.react';
import AutopilotChatSettings from '../settings/chat-settings.react';

const MainContainer = styled('div')<{ historyOpen: boolean }>(({ historyOpen }: { historyOpen: boolean }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    maxHeight: '100%',
    minWidth: '0',
    margin: `0 ${token.Spacing.SpacingL}`,
    ...(historyOpen && { width: `calc(100% - ${CHAT_DRAWER_WIDTH_FULL_SCREEN}px)` }),
}));

const HeaderContainer = styled('div')<{ padding: string }>(({ padding }: { padding: string }) => ({
    flexShrink: 0,
    padding,
}));

const InputBackground = styled('div')(() => ({
    flexShrink: 0,
    paddingBottom: token.Spacing.SpacingXs,
}));

const InputContainer = styled('div')(() => ({
    maxWidth: CHAT_WIDTH_FULL_SCREEN_MAX_WIDTH,
    margin: '0 auto',
    width: '100%',
}));

interface StandardLayoutProps {
    historyOpen: boolean;
    settingsOpen: boolean;
    historyDisabled: boolean;
    settingsDisabled: boolean;
    mode: AutopilotChatMode;
    headerDisabled: boolean;
    headerSeparatorDisabled: boolean;
}

export const StandardLayout: React.FC<StandardLayoutProps> = ({
    historyOpen,
    settingsOpen,
    historyDisabled,
    settingsDisabled,
    mode,
    headerDisabled,
    headerSeparatorDisabled,
}) => {
    return (
        <>
            <MainContainer historyOpen={historyOpen}>
                {!headerDisabled && (
                    <HeaderContainer padding={headerSeparatorDisabled
                        ? `${token.Spacing.SpacingBase} 0`
                        : `${token.Spacing.SpacingXs} 0 ${token.Spacing.SpacingBase}`}>
                        <AutopilotChatHeader />
                    </HeaderContainer>
                )}

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

            {!settingsDisabled && (
                <AutopilotChatSettings open={settingsOpen} isFullScreen={false}/>
            )}
        </>
    );
};
