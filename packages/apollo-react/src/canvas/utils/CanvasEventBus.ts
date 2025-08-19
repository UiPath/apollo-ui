// Canvas Event Bus - Type-safe global event system
export interface CanvasEvents {
  "handle:action": CanvasHandleActionEvent;
  "node:select": { nodeId: string };
  "node:delete": { nodeId: string };
}

export interface CanvasHandleActionEvent {
  handleId: string;
  nodeId: string;
  handleType: "artifact" | "input" | "output";
  position: "top" | "bottom" | "left" | "right";
  timestamp?: number; // Added automatically by event bus
}

type EventName = keyof CanvasEvents;
type EventPayload<T extends EventName> = CanvasEvents[T];
type EventCallback<T extends EventName> = (payload: EventPayload<T>) => void;

export interface ICanvasEventBus {
  emit<T extends EventName>(eventName: T, payload: EventPayload<T>): void;
  on<T extends EventName>(eventName: T, callback: EventCallback<T>): () => void;
  off<T extends EventName>(eventName: T, callback: EventCallback<T>): void;
  once<T extends EventName>(eventName: T, callback: EventCallback<T>): () => void;
  clear(): void;
}

class EventBus implements ICanvasEventBus {
  private listeners = new Map<string, Set<(payload: any) => void>>();

  emit<T extends EventName>(eventName: T, payload: EventPayload<T>): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      // Add timestamp to events that support it
      const enrichedPayload = {
        ...payload,
        timestamp: Date.now(),
      };
      listeners.forEach((callback) => callback(enrichedPayload));
    }
  }

  on<T extends EventName>(eventName: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName)!.add(callback);

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  off<T extends EventName>(eventName: T, callback: EventCallback<T>): void {
    this.listeners.get(eventName)?.delete(callback);
    if (this.listeners.get(eventName)?.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  once<T extends EventName>(eventName: T, callback: EventCallback<T>): () => void {
    const wrappedCallback = (payload: EventPayload<T>) => {
      callback(payload);
      this.off(eventName, wrappedCallback as EventCallback<T>);
    };
    return this.on(eventName, wrappedCallback as EventCallback<T>);
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const canvasEventBus: ICanvasEventBus = new EventBus();
