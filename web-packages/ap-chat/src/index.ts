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
 * // Create or get chat service instance (singleton pattern)
 * const service = AutopilotChatService.Instantiate({
 *   instanceName: 'my-chat', // optional, defaults to 'default'
 *   config: {
 *     mode: 'side-by-side',
 *   },
 * });
 *
 * // Set initial conversation if needed
 * service.setConversation([
 *   {
 *     id: '1',
 *     role: 'assistant',
 *     content: 'Hello! How can I help you?',
 *     created_at: new Date().toISOString(),
 *     widget: 'default',
 *   },
 * ]);
 *
 * const chat = document.querySelector('ap-chat');
 * chat.chatServiceInstance = service;
 *
 * service.open();
 * ```
 */

// Web component (auto-registers when imported)
export { ApChat } from './ap-chat-element';

// Service layer re-exports for convenience
export * from './service';

// TypeScript types
export * from './types';
