export type { SupportedLocale } from '../i18n';
export {
  type ChatRendererComponent,
  type ChatRendererLoader,
  type ChatRendererProps,
  registerChatRenderer,
  registerLazyChatRenderer,
  resolveChatRenderer,
} from './headless/renderer-registry';
export { ChatRoot, type ChatRootProps } from './root/ChatRoot';
export * from './service';
