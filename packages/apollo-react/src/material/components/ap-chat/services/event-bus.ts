export type EventHandler<T = any> = (data?: T) => void;

/**
 * Event bus for the chat service
 */
export class EventBus {
    private handlers: Map<string, EventHandler[]> = new Map();

    /**
     * Subscribes to an event
     *
     * @param event - The event to subscribe to
     * @param handler - The handler to subscribe to the event
     * @returns A function to unsubscribe from the event
     */
    subscribe(event: string, handler: EventHandler): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }

        this.handlers.get(event)!.push(handler);

        return () => {
            const handlers = this.handlers.get(event)!;
            const index = handlers.indexOf(handler);

            if (index > -1) {
                handlers.splice(index, 1);
            }
        };
    }

    /**
     * Publishes an event
     *
     * @param event - The event to publish
     * @param data - The data to publish
     */
    publish(event: string, data?: any) {
        const handlers = this.handlers.get(event);

        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    /**
     * Clears all handlers for an event
     *
     * @param event - The event to clear
     */
    clear(event?: string) {
        if (event) {
            this.handlers.delete(event);
        } else {
            this.handlers.clear();
        }
    }
}
