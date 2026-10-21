import React from 'react';
import { createPortal } from 'react-dom';

import { ApI18nProvider, type SupportedLocale } from '../../i18n';
import { AutopilotAttachmentsProvider } from '../headless/providers/attachments-provider';
import { AutopilotChatScrollProvider } from '../headless/providers/chat-scroll-provider';
import { AutopilotChatServiceProvider } from '../headless/providers/chat-service.provider';
import { AutopilotChatStateProvider } from '../headless/providers/chat-state-provider';
import { AutopilotChatWidthProvider } from '../headless/providers/chat-width-provider';
import { AutopilotErrorProvider } from '../headless/providers/error-provider';
import { AutopilotLoadingProvider } from '../headless/providers/loading-provider';
import { LocaleProvider, useLocale } from '../headless/providers/locale-provider';
import { AutopilotPickerProvider } from '../headless/providers/picker-provider';
import { AutopilotResourceDataProvider } from '../headless/providers/resource-data-provider';
import { AutopilotStreamingProvider } from '../headless/providers/streaming-provider';
import { ThemeProvider } from '../headless/providers/theme-provider';
import { type ChatRendererProps, resolveChatRenderer } from '../headless/renderer-registry';
import {
  type ApChatTheme,
  AutopilotChatEvent,
  AutopilotChatMode,
  type AutopilotChatRenderer,
  type AutopilotChatService,
} from '../service';

export interface ChatRootProps {
  /**
   * Chat service instance
   */
  chatServiceInstance: AutopilotChatService;
  /**
   * Renderer used when the service config does not set `renderer`
   */
  defaultRenderer: AutopilotChatRenderer;
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
   * Container element for popups (menus, popovers). Pass an element inside the shadow root when
   * rendering inside Shadow DOM.
   */
  portalContainer?: HTMLElement;
  /**
   * Render in place instead of portalling into `config.embeddedContainer` in embedded mode,
   * for wrappers (such as the web component) that position the chat themselves.
   * @default false
   */
  disableEmbeddedPortal?: boolean;
  /**
   * Extra props forwarded to the resolved renderer
   */
  rendererProps?: ChatRendererProps;
  /**
   * Render this renderer whatever `config.renderer` says, warning once when the config asks for
   * another. The web component pins Material, since its shadow root carries no Wind styles.
   */
  renderer?: AutopilotChatRenderer;
}

// Warned once per page and renderer pair.
const warnedPins = new Set<string>();

const ChatI18n = React.memo(({ children }: { children: React.ReactNode }) => {
  const { locale } = useLocale();

  return (
    <ApI18nProvider component="chat" locale={locale}>
      {children}
    </ApI18nProvider>
  );
});

// Where the renderer goes: `embeddedContainer` while Embedded, and still while closed from there,
// so closing and reopening an embedded chat does not move the renderer out and back. A closed
// chat leaves the container once the service no longer names it, or for another service.
const useEmbeddedContainer = (chatService: AutopilotChatService) => {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    let sameService = false;
    const update = () => {
      const config = chatService.getConfig();
      const keepWhileClosed = sameService;
      sameService = true;
      setContainer((previous) => {
        if (config.mode === AutopilotChatMode.Embedded) return config.embeddedContainer ?? null;
        return config.mode === AutopilotChatMode.Closed &&
          keepWhileClosed &&
          previous === config.embeddedContainer
          ? previous
          : null;
      });
    };

    update();

    return chatService.on(AutopilotChatEvent.ModeChange, update);
  }, [chatService]);

  return container;
};

const useConfiguredRenderer = (chatService: AutopilotChatService) => {
  const [renderer, setRenderer] = React.useState(() => chatService.getConfig().renderer);

  React.useEffect(() => {
    setRenderer(chatService.getConfig().renderer);

    return chatService.on(AutopilotChatEvent.RendererChange, setRenderer);
  }, [chatService]);

  return renderer;
};

/**
 * Renderer-agnostic chat host: syncs props to the service, provides the headless state and
 * mounts the renderer named by `config.renderer` (or `defaultRenderer`) from the registry.
 */
export function ChatRoot({
  chatServiceInstance,
  defaultRenderer,
  locale = 'en',
  theme = 'light',
  portalContainer,
  disableEmbeddedPortal = false,
  rendererProps,
  renderer: pinnedRenderer,
}: ChatRootProps) {
  // One-way sync: props → service → providers → renderer
  React.useEffect(() => {
    chatServiceInstance.setLocale(locale);
  }, [locale, chatServiceInstance]);

  React.useEffect(() => {
    chatServiceInstance.setTheme(theme);
  }, [theme, chatServiceInstance]);

  const embeddedContainer = useEmbeddedContainer(chatServiceInstance);
  const serviceRenderer = useConfiguredRenderer(chatServiceInstance);
  const configuredRenderer = pinnedRenderer ?? serviceRenderer;
  const configured = resolveChatRenderer({ renderer: configuredRenderer }, defaultRenderer);
  const Renderer = configured ?? resolveChatRenderer(undefined, defaultRenderer);

  React.useEffect(() => {
    const pin = `${pinnedRenderer}:${serviceRenderer}`;
    if (
      pinnedRenderer &&
      serviceRenderer &&
      serviceRenderer !== pinnedRenderer &&
      !warnedPins.has(pin)
    ) {
      warnedPins.add(pin);
      console.warn(
        `This chat always renders "${pinnedRenderer}"; renderer "${serviceRenderer}" is ignored.`
      );
    }
  }, [pinnedRenderer, serviceRenderer]);

  React.useEffect(() => {
    const missing = configuredRenderer ?? defaultRenderer;

    if (!configured && Renderer) {
      console.warn(`No chat renderer registered for "${missing}"; using "${defaultRenderer}".`);
    } else if (!Renderer) {
      console.error(`No chat renderer registered for "${missing}".`);
    }
  }, [configured, Renderer, configuredRenderer, defaultRenderer]);

  const rendered = Renderer && (
    <React.Suspense fallback={null}>
      <Renderer {...rendererProps} />
    </React.Suspense>
  );
  // Only the renderer moves into the embedded container. The providers stay where they are, so
  // their state (suggestions, the draft, errors) survives mode changes; context reaches the
  // renderer through the portal.
  const placed =
    embeddedContainer && !disableEmbeddedPortal
      ? createPortal(rendered, embeddedContainer)
      : rendered;

  return (
    <AutopilotChatServiceProvider chatServiceInstance={chatServiceInstance}>
      <ThemeProvider initialTheme={theme}>
        <LocaleProvider>
          <ChatI18n>
            <AutopilotStreamingProvider>
              <AutopilotChatScrollProvider>
                <AutopilotChatStateProvider portalContainer={portalContainer}>
                  <AutopilotErrorProvider>
                    <AutopilotLoadingProvider>
                      <AutopilotAttachmentsProvider>
                        <AutopilotPickerProvider>
                          <AutopilotResourceDataProvider>
                            <AutopilotChatWidthProvider>{placed}</AutopilotChatWidthProvider>
                          </AutopilotResourceDataProvider>
                        </AutopilotPickerProvider>
                      </AutopilotAttachmentsProvider>
                    </AutopilotLoadingProvider>
                  </AutopilotErrorProvider>
                </AutopilotChatStateProvider>
              </AutopilotChatScrollProvider>
            </AutopilotStreamingProvider>
          </ChatI18n>
        </LocaleProvider>
      </ThemeProvider>
    </AutopilotChatServiceProvider>
  );
}
