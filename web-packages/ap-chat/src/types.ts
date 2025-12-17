import type { SupportedLocale, ApChatTheme, AutopilotChatService } from './service';

/**
 * Properties for the ap-chat web component
 */
export interface ApChatProperties {
  /**
   * The ChatService instance that manages the chat state and events
   */
  chatServiceInstance: AutopilotChatService;

  /**
   * The locale for the chat interface
   * @default 'en'
   */
  locale?: SupportedLocale;

  /**
   * The theme variant for the chat interface
   * @default 'light'
   */
  theme?: ApChatTheme;
}

/**
 * Custom element interface for TypeScript autocomplete
 */
declare global {
  interface HTMLElementTagNameMap {
    'ap-chat': HTMLElement & ApChatProperties;
  }
}
