import type { AutopilotChatEventInterceptor } from '../types/AutopilotChatModel';

export type EventHandler<T = any> = (data?: T) => void;

/**
 * Event bus for the chat service
 */
export class EventBus {
    private handlers: Map<string, Array<{ handler: EventHandler }>> = new Map();
    private interceptors: Map<string, Array<{ interceptor: AutopilotChatEventInterceptor }>> = new Map();
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

        this.handlers.get(event)!.push({ handler });

        return () => {
            const handlers = this.handlers.get(event)!;
            const index = handlers.findIndex(h => h.handler === handler);

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
    async publish(event: string, data?: any) {
        const handlers = this.handlers.get(event);
        const interceptors = this.interceptors.get(event);

        let hijacked = false;

        if (interceptors) {
            const results = await Promise.all(interceptors.map(interceptor => interceptor.interceptor(data)));
            hijacked = results.some(result => result === true);
        }

        if (handlers) {
            handlers.forEach(handler => {
                handler.handler(hijacked ? {
                    ...data,
                    hijacked: true,
                } : data);
            });
        }
    }

    /**
     * Intercepts an event
     *
     * @param event - The event to intercept
     * @param interceptor - The interceptor to intercept the event
     */
    intercept(event: string, interceptor: AutopilotChatEventInterceptor) {
        if (!this.interceptors.has(event)) {
            this.interceptors.set(event, []);
        }

        this.interceptors.get(event)!.push({ interceptor });

        return () => {
            const interceptors = this.interceptors.get(event)!;
            const index = interceptors.findIndex(i => i.interceptor === interceptor);

            if (index > -1) {
                interceptors.splice(index, 1);
            }
        };
    }

    /**
     * Clears all handlers for an event
     *
     * @param event - The event to clear
     */
    clear(event?: string) {
        if (event) {
            this.handlers.delete(event);
            this.interceptors.delete(event);
        } else {
            this.handlers.clear();
            this.interceptors.clear();
        }
    }
}
