/**
 * @uipath/ap-chat - Autopilot Chat Web Component
 *
 * A framework-agnostic web component version of the ApChat component.
 * Wraps the React implementation in a custom element with Shadow DOM
 * for style encapsulation.
 *
 * NOTE: Apollo design tokens CSS is automatically loaded within the Shadow DOM,
 * so no global CSS imports are needed. The component is fully self-contained.
 *
 * @example
 * ```typescript
 * import { AutopilotChatService } from '@uipath/ap-chat/service';
 * import '@uipath/ap-chat';
 *
 * const service = new AutopilotChatService();
 * service.initialize({ mode: 'side-by-side' });
 *
 * const chat = document.querySelector('ap-chat');
 * chat.chatServiceInstance = service;
 * service.open();
 * ```
 */

// Web component (auto-registers when imported)
export { ApChat } from './ap-chat-element';

// Service layer re-exports for convenience
export * from './service';

// TypeScript types
export * from './types';
