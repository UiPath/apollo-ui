import type {
  AutopilotChatEventHandler,
  AutopilotChatInternalEvent,
} from './ChatModel';
import { EventBus } from './EventBus';

export class AutopilotChatInternalService {
    private static instance: AutopilotChatInternalService;
    private eventBus: EventBus;

    private constructor() {
        this.eventBus = new EventBus();
    }

    static Instantiate() {
        if (!AutopilotChatInternalService.instance) {
            AutopilotChatInternalService.instance = new AutopilotChatInternalService();
        }

        return AutopilotChatInternalService.instance;
    }

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
