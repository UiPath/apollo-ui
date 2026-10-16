import { registerChatRendererIfAbsent } from '@uipath/apollo-react/chat/headless/renderer-registry';

export { ApChat, type ApChatProps } from './ap-chat-material';

// Wind is opt-in from this entry (`renderer: 'wind'`) and loads on first use, so a host that never
// asks for it does not download it. If the `/chat` entry loaded first, its registration stays.
// Listed in `sideEffects`: the module otherwise only re-exports, and bundlers would skip it.
registerChatRendererIfAbsent('wind', {
  load: () => import('@uipath/apollo-react/chat/wind/WindChatRenderer'),
});
