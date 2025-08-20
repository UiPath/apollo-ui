import React, { useEffect, useState } from "react";
import { canvasEventBus } from "../../utils/CanvasEventBus";
import { useCanvasEvent } from "../../hooks/useCanvasEvents";

/**
 * Example 1: Direct event bus usage with manual cleanup
 */
export const DirectEventBusExample = () => {
  const [lastAction, setLastAction] = useState<string>("");

  useEffect(() => {
    // Subscribe to handle actions
    const unsubscribe = canvasEventBus.on("handle:action", (event) => {
      setLastAction(`Handle ${event.handleId} on node ${event.nodeId} clicked at ${event.timestamp}`);
      console.log("Handle action received:", event);
    });

    // Cleanup on unmount
    return unsubscribe;
  }, []);

  return (
    <div>
      <h3>Direct Event Bus Example</h3>
      <p>Last action: {lastAction || "No actions yet"}</p>
    </div>
  );
};

/**
 * Example 2: Using the hook for automatic cleanup
 */
export const HookEventExample = () => {
  const [actionCount, setActionCount] = useState(0);

  // This hook automatically handles cleanup
  useCanvasEvent("handle:action", (event) => {
    setActionCount((prev) => prev + 1);
    console.log("Hook received event:", event);
  });

  return (
    <div>
      <h3>Hook Event Example</h3>
      <p>Actions received: {actionCount}</p>
    </div>
  );
};

/**
 * Example 3: Emitting events programmatically
 */
export const EventEmitterExample = () => {
  const emitTestEvent = () => {
    canvasEventBus.emit("handle:action", {
      handleId: "test-handle",
      nodeId: "test-node",
      handleType: "output",
      position: "right",
      // timestamp added automatically by event bus
    });
  };

  return (
    <div>
      <h3>Event Emitter Example</h3>
      <button onClick={emitTestEvent}>Emit Test Handle Action</button>
    </div>
  );
};

/**
 * Example 4: One-time listener
 */
export const OneTimeListenerExample = () => {
  const [message, setMessage] = useState("Waiting for first action...");

  useEffect(() => {
    // This will only fire once
    const unsubscribe = canvasEventBus.once("handle:action", (event) => {
      setMessage(`First action received from handle ${event.handleId}!`);
    });

    return unsubscribe;
  }, []);

  return (
    <div>
      <h3>One-Time Listener Example</h3>
      <p>{message}</p>
    </div>
  );
};

/**
 * Example 5: Multiple event types
 */
export const MultipleEventsExample = () => {
  const [events, setEvents] = useState<string[]>([]);

  useCanvasEvent("handle:action", (event) => {
    setEvents((prev) => [...prev, `Handle action: ${event.handleId}`]);
  });

  // Future events (when implemented)
  useCanvasEvent("node:select", (event) => {
    setEvents((prev) => [...prev, `Node selected: ${event.nodeId}`]);
  });

  return (
    <div>
      <h3>Multiple Events Example</h3>
      <ul>
        {events.map((event, index) => (
          <li key={index}>{event}</li>
        ))}
      </ul>
    </div>
  );
};
