import React, { useEffect, useRef } from 'react';

import FocusLock from 'react-focus-lock';

import { styled } from '@mui/material';
import token from '@uipath/apollo-core';

import { useChatService } from '../../providers/chat-service.provider';
import { useChatState } from '../../providers/chat-state-provider';
import { CHAT_DRAWER_WIDTH_FULL_SCREEN } from '../../service';
import { AutopilotChatSettingsHeader } from './chat-settings-header';

const ChatSettingsContainer = styled('div')<{ isOpen: boolean; isFullScreen: boolean }>(
  ({ isFullScreen }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: token.Spacing.SpacingL,
    backgroundColor: 'var(--color-background-secondary)',
    height: '100%',
    zIndex: 1,
    boxSizing: 'border-box',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    width: 'var(--settings-width)',
    paddingLeft: 'var(--settings-padding-left)',
    paddingRight: 'var(--settings-padding-right)',
    paddingTop: token.Spacing.SpacingBase,
    paddingBottom: token.Spacing.SpacingBase,

    transition: 'width 0.3s ease, padding-left 0.3s ease, padding-right 0.3s ease',

    ...(isFullScreen
      ? {
          borderTopLeftRadius: token.Spacing.SpacingXs,
        }
      : {
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
  })
);

interface AutopilotChatSettingsProps {
  open: boolean;
  isFullScreen: boolean;
}

export const AutopilotChatSettings: React.FC<AutopilotChatSettingsProps> = ({
  open,
  isFullScreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chatService = useChatService();
  const { settingsOpen } = useChatState();

  // CSS variables must be set as inline styles (not in the styled component)
  // to keep the Emotion class stable and enable proper transitions
  const cssVars = React.useMemo(() => {
    const width = open
      ? isFullScreen
        ? `calc(${CHAT_DRAWER_WIDTH_FULL_SCREEN}px + 2 * ${token.Spacing.SpacingBase})`
        : '100%'
      : '0';
    const padding = open ? token.Spacing.SpacingBase : '0';

    return {
      '--settings-width': width,
      '--settings-padding-left': padding,
      '--settings-padding-right': padding,
    } as React.CSSProperties;
  }, [open, isFullScreen]);

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
      return;
    }
  }, [chatService, settingsOpen]);

  return (
    <FocusLock disabled={!open || !settingsOpen || isFullScreen} returnFocus={false}>
      <ChatSettingsContainer isOpen={open} isFullScreen={isFullScreen} style={cssVars}>
        <AutopilotChatSettingsHeader isFullScreen={isFullScreen} isSettingsOpen={settingsOpen} />

        <div ref={containerRef} className="chat-settings-content" />
      </ChatSettingsContainer>
    </FocusLock>
  );
};

export default AutopilotChatSettings;
