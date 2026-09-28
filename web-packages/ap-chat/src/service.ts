/**
 * Service layer exports from @uipath/apollo-react
 *
 * This module re-exports ONLY the service layer, including:
 * - AutopilotChatService - Main chat service API
 * - Event system and event types
 * - Type definitions and interfaces
 * - Constants and enums
 * - Utility classes
 *
 * Note: This does NOT export the ApChat React component.
 * The web component version is exported from the main index.
 */

// Re-export only the service layer (not the React component)
export * from '@uipath/apollo-react/ap-chat/service';

// Also export SupportedLocale type from ap-chat
export type { SupportedLocale } from '@uipath/apollo-react/ap-chat';
