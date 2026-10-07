import { ThemeProvider as MuiThemeProvider, styled } from '@mui/material/styles';
import token from '@uipath/apollo-core';
import React from 'react';
import { useChatState } from '../../../chat/headless/providers/chat-state-provider';
import { useChatWidth } from '../../../chat/headless/providers/chat-width-provider';
import { useTheme } from '../../../chat/headless/providers/theme-provider';
import {
  AutopilotChatMode,
  CHAT_CONTAINER_ANIMATION_DURATION,
  CHAT_WIDTH_FULL_SCREEN,
} from '../../../chat/service';
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from '../../theme';
import { DragHandle } from './components/common/drag-handle';
import { AutopilotChatDropzone } from './components/dropzone/dropzone';
import { FullScreenLayout, StandardLayout } from './components/layout';

// Theme lookup map - created once, reused across all instances
const MUI_THEME_MAP = {
  light: apolloMaterialUiThemeLight,
  dark: apolloMaterialUiThemeDark,
  'light-hc': apolloMaterialUiThemeLightHC,
  'dark-hc': apolloMaterialUiThemeDarkHC,
} as const;

const ChatContainer = styled('div')<{
  shouldAnimate: boolean;
  mode: AutopilotChatMode;
  width: number;
  fullHeight: boolean;
}>(
  ({
    shouldAnimate,
    mode,
    width,
    fullHeight,
  }: {
    shouldAnimate: boolean;
    mode: AutopilotChatMode;
    width: number;
    fullHeight: boolean;
  }) => ({
    width: mode === AutopilotChatMode.FullScreen ? CHAT_WIDTH_FULL_SCREEN : width,
    display: 'flex',
    flexDirection: mode === AutopilotChatMode.FullScreen ? 'column' : 'row',
    height: fullHeight ? '100vh' : 'calc(100vh - 48px)', // account for global header height
    position: 'relative',
    boxSizing: 'border-box',
    border: `${token.Border.BorderThickS} solid var(--color-border-de-emp)`,
    borderTop: 'none',
    borderLeft: 'none',
    ...(shouldAnimate && { transition: `width ${CHAT_CONTAINER_ANIMATION_DURATION}ms ease` }),
    ...(mode === AutopilotChatMode.Closed && { display: 'none' }),
    ...(mode === AutopilotChatMode.Embedded && {
      width: '100%',
      height: '100%',
      position: 'absolute',
      border: 'none',
    }),
  })
);

const AutopilotChatContent = React.memo(() => {
  const { width, shouldAnimate } = useChatWidth();
  const { historyOpen, settingsOpen, disabledFeatures, chatMode, readOnly } = useChatState();

  return (
    <ChatContainer
      shouldAnimate={shouldAnimate}
      mode={chatMode}
      width={width}
      fullHeight={disabledFeatures.fullHeight === false}
    >
      {chatMode === AutopilotChatMode.SideBySide && <DragHandle />}

      {chatMode === AutopilotChatMode.FullScreen ? (
        <FullScreenLayout
          historyOpen={historyOpen}
          settingsOpen={settingsOpen}
          historyDisabled={disabledFeatures.history ?? false}
          settingsDisabled={disabledFeatures.settings ?? false}
          headerSeparatorDisabled={disabledFeatures.headerSeparator ?? false}
          mode={chatMode}
          readOnly={readOnly}
        />
      ) : (
        <StandardLayout
          historyOpen={historyOpen}
          settingsOpen={settingsOpen}
          historyDisabled={disabledFeatures.history ?? false}
          settingsDisabled={disabledFeatures.settings ?? false}
          headerDisabled={disabledFeatures.header ?? false}
          headerSeparatorDisabled={disabledFeatures.headerSeparator ?? false}
          mode={chatMode}
          readOnly={readOnly}
        />
      )}
    </ChatContainer>
  );
});

export interface MaterialChatRendererProps {
  /**
   * Wrap the chat in its own MUI ThemeProvider, following the chat theme.
   * Set by the web component; React consumers provide their own MUI theme context.
   * @default false
   */
  enableInternalThemeProvider?: boolean;
}

/**
 * The Material UI chat renderer. Mounted by `ChatRoot`, which provides the headless state.
 */
export function MaterialChatRenderer({
  enableInternalThemeProvider = false,
}: MaterialChatRendererProps) {
  const { theme } = useTheme();

  const content = (
    <AutopilotChatDropzone>
      <AutopilotChatContent />
    </AutopilotChatDropzone>
  );

  const muiTheme = enableInternalThemeProvider ? MUI_THEME_MAP[theme] : undefined;

  return muiTheme ? <MuiThemeProvider theme={muiTheme}>{content}</MuiThemeProvider> : content;
}

export default MaterialChatRenderer;
