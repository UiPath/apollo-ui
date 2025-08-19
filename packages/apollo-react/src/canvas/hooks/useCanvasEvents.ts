import { useEffect, useCallback } from "react";
import { canvasEventBus, type CanvasEvents } from "../utils/CanvasEventBus";

type EventName = keyof CanvasEvents;
type EventPayload<T extends EventName> = CanvasEvents[T];
type EventCallback<T extends EventName> = (payload: EventPayload<T>) => void;

/**
 * Hook for subscribing to canvas events with automatic cleanup
 */
export function useCanvasEvent<T extends EventName>(eventName: T, callback: EventCallback<T>) {
  useEffect(() => {
    return canvasEventBus.on(eventName, callback);
  }, [eventName, callback]);
}

/**
 * Hook that returns event emitter and subscriber functions
 */
export function useCanvasEvents() {
  const emit = useCallback(<T extends EventName>(eventName: T, payload: EventPayload<T>) => {
    canvasEventBus.emit(eventName, payload);
  }, []);

  const subscribe = useCallback(<T extends EventName>(eventName: T, callback: EventCallback<T>) => {
    return canvasEventBus.on(eventName, callback);
  }, []);

  return { emit, subscribe, eventBus: canvasEventBus };
}
