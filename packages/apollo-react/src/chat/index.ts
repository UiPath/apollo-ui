import { registerChatRenderer, registerLazyChatRenderer } from './headless/renderer-registry';
import { WindChatPlaceholder } from './wind/WindChatPlaceholder';

registerChatRenderer('wind', WindChatPlaceholder);
registerLazyChatRenderer(
  'material',
  // biome-ignore lint/style/noRestrictedImports: the one allowed src/chat → Material edge; a dynamic import keeps MUI out of the initial chunk
  () => import('../material/components/ap-chat/MaterialChatRenderer')
);

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
