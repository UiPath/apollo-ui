import type { AutopilotChatEvent, AutopilotChatService } from '../../service';
import type { EventBus } from '../../service/EventBus';

/**
 * Publishes a public chat event on behalf of the UI (custom header actions, attachments, load
 * more). The service has no public `publish`; the headless layer reaches its private bus only
 * through here. Only Material's `chat-history.tsx` still reaches it directly.
 */
export function publishChatEvent(
  chatService: AutopilotChatService,
  event: AutopilotChatEvent | string,
  payload?: unknown
) {
  (chatService as unknown as { _eventBus: EventBus })._eventBus.publish(event, payload);
}
