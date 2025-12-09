import React, {
  useEffect,
  useRef,
} from 'react';

import FocusLock from 'react-focus-lock';

import { styled } from '@mui/material';
import token from '@uipath/apollo-core';

import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { CHAT_DRAWER_WIDTH_FULL_SCREEN } from '../../service';
import { AutopilotChatSettingsHeader } from './chat-settings-header';

const ChatSettingsContainer = styled('div')<{ isOpen: boolean; isFullScreen: boolean }>(({
    theme, isOpen, isFullScreen,
}) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingL,
    backgroundColor: theme.palette.semantic.colorBackgroundSecondary,
    height: '100%',
    zIndex: 1,
    transition: 'width 0.3s ease, padding 0.3s ease',
    padding: token.Spacing.SpacingBase,
    boxSizing: 'border-box',
    overflow: 'hidden',
    whiteSpace: 'nowrap',

    ...(isOpen ? { width: '100%' } : {
        width: 0,
        paddingLeft: 0,
        paddingRight: 0,
    }),

    ...(isFullScreen ? {
        width: isOpen ? `calc(${CHAT_DRAWER_WIDTH_FULL_SCREEN}px + 2 * ${token.Spacing.SpacingBase})` : 0, // account for padding
        borderTopLeftRadius: token.Spacing.SpacingXs,
    } : {
        position: 'absolute',
        right: 0,
    }),

    '& .chat-settings-content': {
        outline: 'none',
        flex: 1,
        overflowY: 'auto',
        marginRight: `calc(-${token.Spacing.SpacingBase})`,
        paddingRight: token.Spacing.SpacingBase,
    },
}));

interface AutopilotChatSettingsProps {
    open: boolean;
    isFullScreen: boolean;
}

export const AutopilotChatSettings: React.FC<AutopilotChatSettingsProps> = ({
    open, isFullScreen,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const chatService = useChatService();
    const { settingsOpen } = useChatState();

    useEffect(() => {
        if (!containerRef.current || !chatService) {
            return;
        }

        const config = chatService.getConfig();
        const settingsRenderer = config.settingsRenderer;

        if (!settingsRenderer) {
            return;
        }

        containerRef.current.innerHTML = '';

        if (!settingsOpen) {
            return;
        }

        try {
            settingsRenderer(containerRef.current);
        } catch (error) {
            if ((globalThis as any)['__StencilReactAdapter_EnableDebugging']) {
                console.warn('Could not render settings:', error);
            }
        }
    }, [ chatService, settingsOpen ]);

    return (
        <FocusLock
            disabled={!open || !settingsOpen || isFullScreen}
            returnFocus={false}
        >
            <ChatSettingsContainer isOpen={open} isFullScreen={isFullScreen}>
                <AutopilotChatSettingsHeader isFullScreen={isFullScreen} isSettingsOpen={settingsOpen}/>

                <div
                    ref={containerRef}
                    className="chat-settings-content"
                />
            </ChatSettingsContainer>
        </FocusLock>
    );
};

export default AutopilotChatSettings;
