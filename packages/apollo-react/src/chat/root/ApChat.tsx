import React from 'react';
import type { SupportedLocale } from '../../i18n';
import { registerChatRendererIfAbsent } from '../headless/renderer-registry';
import type { ApChatTheme, AutopilotChatService } from '../service';
import { WindChatRenderer } from '../wind/WindChatRenderer';
import { ChatRoot } from './ChatRoot';

// Registered here rather than in the package entry: bundlers that honour `sideEffects` drop the
// statements of a re-export-only barrel, but keep those of the module that defines `ApChat`.
// If the `ap-chat` entry loaded first, its registrations stay.
registerChatRendererIfAbsent('wind', { component: WindChatRenderer });
registerChatRendererIfAbsent('material', {
  // biome-ignore lint/style/noRestrictedImports: the one allowed src/chat → Material edge; a dynamic import keeps MUI out of the initial chunk
  load: () => import('../../material/components/ap-chat/MaterialChatRenderer'),
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
   * Container element for popups (menus, popovers). Pass an element inside the shadow root when
   * rendering inside Shadow DOM.
   */
  portalContainer?: HTMLElement;
  /**
   * Material renderer only: wrap the chat in its own MUI ThemeProvider.
   * @default false
   * @internal
   */
  enableInternalThemeProvider?: boolean;
  /**
   * Render in place instead of portalling into `config.embeddedContainer` in embedded mode.
   * @default false
   * @internal
   */
  disableEmbeddedPortal?: boolean;
}

/**
 * Chat entry for `@uipath/apollo-react/chat`. Renders the Wind renderer unless the service config
 * sets `renderer: 'material'`, which loads the Material renderer on demand.
 */
export function ApChat({
  chatServiceInstance,
  locale = 'en',
  theme = 'light',
  portalContainer,
  enableInternalThemeProvider = false,
  disableEmbeddedPortal = false,
}: ApChatProps) {
  const rendererProps = React.useMemo(
    () => ({ enableInternalThemeProvider }),
    [enableInternalThemeProvider]
  );

  return (
    <ChatRoot
      chatServiceInstance={chatServiceInstance}
      defaultRenderer="wind"
      locale={locale}
      theme={theme}
      portalContainer={portalContainer}
      disableEmbeddedPortal={disableEmbeddedPortal}
      rendererProps={rendererProps}
    />
  );
}
