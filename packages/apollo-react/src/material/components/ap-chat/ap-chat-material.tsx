import { registerChatRendererIfAbsent } from '@uipath/apollo-react/chat/headless/renderer-registry';
import { ChatRoot } from '@uipath/apollo-react/chat/root/ChatRoot';
import type {
  ApChatTheme,
  AutopilotChatRenderer,
  AutopilotChatService,
} from '@uipath/apollo-react/chat/service';
import React from 'react';
import type { SupportedLocale } from '../../../i18n';
import { MaterialChatRenderer } from './MaterialChatRenderer';

// The Material `ApChat` without Wind: the `ap-chat` entry adds the lazy Wind registration, and the
// web component imports this module so its bundle never reaches Wind.
registerChatRendererIfAbsent('material', { component: MaterialChatRenderer });

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
  /**
   * Disable embedded mode portal behavior.
   * When true, the component will render normally inside its container without using React portals.
   * This should be set to true when the component is wrapped in a web component that handles
   * the embedded mode positioning itself.
   * @default false
   * @internal
   */
  disableEmbeddedPortal?: boolean;
  /**
   * Render this renderer whatever the service config says. The web component pins Material,
   * since its shadow root carries no Wind styles.
   * @internal
   */
  renderer?: AutopilotChatRenderer;
}

export function ApChat({
  chatServiceInstance,
  locale = 'en',
  theme = 'light',
  portalContainer,
  enableInternalThemeProvider = false,
  disableEmbeddedPortal = false,
  renderer,
}: ApChatProps) {
  const rendererProps = React.useMemo(
    () => ({ enableInternalThemeProvider }),
    [enableInternalThemeProvider]
  );

  return (
    <ChatRoot
      chatServiceInstance={chatServiceInstance}
      defaultRenderer="material"
      locale={locale}
      theme={theme}
      portalContainer={portalContainer}
      disableEmbeddedPortal={disableEmbeddedPortal}
      rendererProps={rendererProps}
      renderer={renderer}
    />
  );
}
