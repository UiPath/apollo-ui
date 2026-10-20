import type { AutopilotChatEventHandler, AutopilotChatInternalEvent } from './ChatModel';
import { EventBus } from './EventBus';

/**
 * Internal events between the chat service and its renderer. Each AutopilotChatService owns one,
 * so instances on the same page do not see each other's theme, locale or toggle events.
 */
export class AutopilotChatInternalService {
  private static instance: AutopilotChatInternalService;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = new EventBus();
  }

  /**
   * @deprecated Chat services no longer share an internal service; this singleton is not
   * connected to any of them. Use `chatService.__internalService__` instead.
   */
  static Instantiate() {
    if (!AutopilotChatInternalService.instance) {
      AutopilotChatInternalService.instance = new AutopilotChatInternalService();
    }

    return AutopilotChatInternalService.instance;
  }

  /**
   * @deprecated See {@link AutopilotChatInternalService.Instantiate}.
   */
  static get Instance() {
    return AutopilotChatInternalService.instance;
  }

  /**
   * Subscribes to an event
   *
   * @param event - The event to subscribe to
   * @param handler - The handler to subscribe to the event
   * @returns A function to unsubscribe from the event
   */
  on(event: AutopilotChatInternalEvent, handler: AutopilotChatEventHandler) {
    return this.eventBus.subscribe(event, handler);
  }

  /**
   * Publishes an event
   *
   * @param event - The event to publish
   * @param data - The data to publish
   */
  publish(event: AutopilotChatInternalEvent, data?: any) {
    this.eventBus.publish(event, data);
  }
}
