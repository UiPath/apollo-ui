// The Wind and lazy Material renderers are registered by `root/ApChat`, which this entry
// re-exports, so they are in place for every consumer of this entry.
export type { SupportedLocale } from '../i18n';
export {
  type ChatBuiltInMessageRenderer,
  type ResolvedMessageRenderer,
  resolveMessageRenderer,
} from './headless/message-renderers';
export {
  type ChatRendererComponent,
  type ChatRendererLoader,
  type ChatRendererProps,
  registerChatRenderer,
  registerLazyChatRenderer,
  resolveChatRenderer,
} from './headless/renderer-registry';
export { ApChat, type ApChatProps } from './root/ApChat';
export { ChatRoot, type ChatRootProps } from './root/ChatRoot';
export * from './service';
