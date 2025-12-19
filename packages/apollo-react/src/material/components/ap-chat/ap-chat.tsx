import React from 'react';
import { createPortal } from 'react-dom';

import {
  styled,
  ThemeProvider as MuiThemeProvider,
} from '@mui/material/styles';
import token from '@uipath/apollo-core';

import {
  ApI18nProvider,
  SupportedLocale,
} from '../../../i18n';
import {
  apolloMaterialUiThemeDark,
  apolloMaterialUiThemeDarkHC,
  apolloMaterialUiThemeLight,
  apolloMaterialUiThemeLightHC,
} from '../../theme';
import { DragHandle } from './components/common/drag-handle';
import { AutopilotChatDropzone } from './components/dropzone/dropzone';
import {
  FullScreenLayout,
  StandardLayout,
} from './components/layout';
import { AutopilotAttachmentsProvider } from './providers/attachements-provider';
import { AutopilotChatScrollProvider } from './providers/chat-scroll-provider';
import { AutopilotChatServiceProvider } from './providers/chat-service.provider';
import {
  AutopilotChatStateProvider,
  useChatState,
} from './providers/chat-state-provider';
import {
  AutopilotChatWidthProvider,
  useChatWidth,
} from './providers/chat-width-provider';
import { AutopilotErrorProvider } from './providers/error-provider';
import { AutopilotLoadingProvider } from './providers/loading-provider';
import {
  LocaleProvider,
  useLocale,
} from './providers/locale-provider';
import { AutopilotPickerProvider } from './providers/picker-provider';
import { AutopilotStreamingProvider } from './providers/streaming-provider';
import { ThemeProvider } from './providers/theme-provider';
import {
  ApChatTheme,
  AutopilotChatEvent,
  AutopilotChatMode,
  AutopilotChatService,
  CHAT_CONTAINER_ANIMATION_DURATION,
  CHAT_WIDTH_FULL_SCREEN,
} from './service';

const ChatContainer = styled('div')<{ shouldAnimate: boolean; mode: AutopilotChatMode; width: number; fullHeight: boolean }>(({
    shouldAnimate, mode, width, fullHeight,
}: { shouldAnimate: boolean; mode: AutopilotChatMode; width: number; fullHeight: boolean }) => ({
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
}));

// Wrapper that connects ApI18nProvider to LocaleProvider context
const ApI18nWithLocale = React.memo(({ children }: { children: React.ReactNode }) => {
    const { locale } = useLocale();

    return (
        <ApI18nProvider component="material/components/ap-chat" locale={locale}>
            {children}
        </ApI18nProvider>
    );
});

const AutopilotChatContent = React.memo(() => {
    const {
        width, shouldAnimate,
    } = useChatWidth();
    const {
        historyOpen,
        settingsOpen,
        disabledFeatures,
        chatMode,
    } = useChatState();

    return (
        <ChatContainer
            shouldAnimate={shouldAnimate}
            mode={chatMode}
            width={width}
            fullHeight={disabledFeatures.fullHeight === false}
        >
            { chatMode === AutopilotChatMode.SideBySide && (
                <DragHandle/>
            )}

            {chatMode === AutopilotChatMode.FullScreen ? (
                <FullScreenLayout
                    historyOpen={historyOpen}
                    settingsOpen={settingsOpen}
                    historyDisabled={disabledFeatures.history ?? false}
                    settingsDisabled={disabledFeatures.settings ?? false}
                    headerSeparatorDisabled={disabledFeatures.headerSeparator ?? false}
                    mode={chatMode}
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
                />
            )}
        </ChatContainer>
    );
});

export interface ApChatProps {
    /**
     * Chat service instance
     */
    chatServiceInstance: AutopilotChatService;
    /**
     * Locale for the chat interface.
     * @default 'en'
     */
    locale?: SupportedLocale;
    /**
     * Theme variant for the chat interface.
     * @default 'light'
     */
    theme?: ApChatTheme;
    /**
     * Container element for MUI portals (Menu, Popover, etc).
     * When rendering inside Shadow DOM, pass the container element inside the shadow root.
     * @default undefined
     */
    portalContainer?: HTMLElement;
    /**
     * Enable internal MUI ThemeProvider wrapper.
     * Set to true when using as a web component to ensure proper theme context.
     * React consumers should leave this false and provide their own MUI theme context.
     * @default false
     * @internal
     */
    enableInternalThemeProvider?: boolean;
}

export function ApChat({
    chatServiceInstance,
    locale: initialLocale = 'en',
    theme: initialTheme = 'light',
    portalContainer,
    enableInternalThemeProvider = false,
}: ApChatProps) {
    const [embeddedContainer, setEmbeddedContainer] = React.useState<HTMLElement | null>(null);
    const [currentTheme, setCurrentTheme] = React.useState<ApChatTheme>(initialTheme);

    // Sync props to service (one-way: props → service → providers → components)
    React.useEffect(() => {
        chatServiceInstance.setLocale(initialLocale);
    }, [initialLocale, chatServiceInstance]);

    React.useEffect(() => {
        chatServiceInstance.setTheme(initialTheme);
        setCurrentTheme(initialTheme);
    }, [initialTheme, chatServiceInstance]);

    // Check for embedded container from service configuration
    React.useEffect(() => {
        const updateEmbeddedContainer = () => {
            const config = chatServiceInstance.getConfig();
            if (config.mode === AutopilotChatMode.Embedded && config.embeddedContainer) {
                setEmbeddedContainer(config.embeddedContainer);
            } else {
                setEmbeddedContainer(null);
            }
        };

        // Check initial config
        updateEmbeddedContainer();

        // Listen for mode changes
        const unsubscribe = chatServiceInstance.on(
            AutopilotChatEvent.ModeChange,
            () => {
                updateEmbeddedContainer();
            },
        );

        return () => {
            unsubscribe();
        };
    }, [chatServiceInstance]);

    // Select MUI theme based on current theme (only if internal theme provider is enabled)
    const muiTheme = React.useMemo(() => {
        if (!enableInternalThemeProvider) return null;
        
        const selected =
            currentTheme === 'dark' ? apolloMaterialUiThemeDark :
            currentTheme === 'light-hc' ? apolloMaterialUiThemeLightHC :
            currentTheme === 'dark-hc' ? apolloMaterialUiThemeDarkHC :
            apolloMaterialUiThemeLight;
        
        return selected;
    }, [currentTheme, enableInternalThemeProvider]);

    const chatProviders = (
        <AutopilotChatServiceProvider chatServiceInstance={chatServiceInstance}>
                <ThemeProvider>
                    <LocaleProvider>
                        <ApI18nWithLocale>
                            <AutopilotStreamingProvider>
                                <AutopilotChatScrollProvider>
                                    <AutopilotChatStateProvider portalContainer={portalContainer}>
                                        <AutopilotErrorProvider>
                                            <AutopilotLoadingProvider>
                                                <AutopilotAttachmentsProvider>
                                                    <AutopilotPickerProvider>
                                                        <AutopilotChatWidthProvider>
                                                            <AutopilotChatDropzone>
                                                                <AutopilotChatContent />
                                                            </AutopilotChatDropzone>
                                                        </AutopilotChatWidthProvider>
                                                    </AutopilotPickerProvider>
                                                </AutopilotAttachmentsProvider>
                                            </AutopilotLoadingProvider>
                                        </AutopilotErrorProvider>
                                    </AutopilotChatStateProvider>
                                </AutopilotChatScrollProvider>
                            </AutopilotStreamingProvider>
                        </ApI18nWithLocale>
                    </LocaleProvider>
                </ThemeProvider>
            </AutopilotChatServiceProvider>
    );

    // Conditionally wrap with MUI ThemeProvider (for web component usage)
    const chatContent = enableInternalThemeProvider && muiTheme ? (
        <MuiThemeProvider theme={muiTheme}>
            {chatProviders}
        </MuiThemeProvider>
    ) : chatProviders;

    // Use portal for embedded mode
    if (embeddedContainer) {
        return createPortal(chatContent, embeddedContainer);
    }

    return chatContent;
}
