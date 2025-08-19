import { describe, it, expect, vi, beforeEach } from "vitest";
import { canvasEventBus, type CanvasHandleActionEvent } from "./CanvasEventBus";

describe("CanvasEventBus", () => {
  beforeEach(() => {
    // Clear all listeners before each test
    canvasEventBus.clear();
  });

  describe("emit and on", () => {
    it("should emit and receive events", () => {
      const callback = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "test-handle",
        nodeId: "test-node",
        handleType: "output",
        position: "right",
      };

      canvasEventBus.on("handle:action", callback);
      canvasEventBus.emit("handle:action", payload);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining(payload));
    });

    it("should support multiple listeners for the same event", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "handle-1",
        nodeId: "node-1",
        handleType: "input",
        position: "left",
      };

      canvasEventBus.on("handle:action", callback1);
      canvasEventBus.on("handle:action", callback2);
      canvasEventBus.on("handle:action", callback3);

      canvasEventBus.emit("handle:action", payload);

      expect(callback1).toHaveBeenCalledWith(expect.objectContaining(payload));
      expect(callback2).toHaveBeenCalledWith(expect.objectContaining(payload));
      expect(callback3).toHaveBeenCalledWith(expect.objectContaining(payload));
    });

    it("should handle different event types independently", () => {
      const handleCallback = vi.fn();
      const nodeCallback = vi.fn();

      canvasEventBus.on("handle:action", handleCallback);
      canvasEventBus.on("node:select", nodeCallback);

      const handlePayload: CanvasHandleActionEvent = {
        handleId: "h1",
        nodeId: "n1",
        handleType: "artifact",
        position: "top",
      };

      const nodePayload = { nodeId: "node-123" };

      canvasEventBus.emit("handle:action", handlePayload);
      canvasEventBus.emit("node:select", nodePayload);

      expect(handleCallback).toHaveBeenCalledTimes(1);
      expect(handleCallback).toHaveBeenCalledWith(expect.objectContaining(handlePayload));
      expect(nodeCallback).toHaveBeenCalledTimes(1);
      expect(nodeCallback).toHaveBeenCalledWith(expect.objectContaining(nodePayload));
    });

    it("should not call listeners when emitting non-existent event", () => {
      const callback = vi.fn();
      canvasEventBus.on("handle:action", callback);

      // This should not trigger the handle:action listener
      canvasEventBus.emit("node:delete", { nodeId: "test" });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle emitting events with no listeners gracefully", () => {
      expect(() => {
        canvasEventBus.emit("handle:action", {
          handleId: "test",
          nodeId: "test",
          handleType: "output",
          position: "right",
        });
      }).not.toThrow();
    });

    it("should automatically add timestamp to events", () => {
      const callback = vi.fn();
      const beforeEmit = Date.now();

      canvasEventBus.on("handle:action", callback);
      canvasEventBus.emit("handle:action", {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      });

      const afterEmit = Date.now();

      expect(callback).toHaveBeenCalledTimes(1);
      const receivedPayload = callback.mock.calls[0][0];
      expect(receivedPayload.timestamp).toBeDefined();
      expect(receivedPayload.timestamp).toBeGreaterThanOrEqual(beforeEmit);
      expect(receivedPayload.timestamp).toBeLessThanOrEqual(afterEmit);
    });
  });

  describe("off", () => {
    it("should unsubscribe a specific listener", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "bottom",
      };

      canvasEventBus.on("handle:action", callback1);
      canvasEventBus.on("handle:action", callback2);

      canvasEventBus.off("handle:action", callback1);
      canvasEventBus.emit("handle:action", payload);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("should handle removing non-existent listener gracefully", () => {
      const callback = vi.fn();

      expect(() => {
        canvasEventBus.off("handle:action", callback);
      }).not.toThrow();
    });

    it("should clean up event entry when last listener is removed", () => {
      const callback = vi.fn();

      canvasEventBus.on("handle:action", callback);
      canvasEventBus.off("handle:action", callback);

      // After removing the last listener, emitting should not call anything
      canvasEventBus.emit("handle:action", {
        handleId: "test",
        nodeId: "test",
        handleType: "input",
        position: "left",
      });

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("unsubscribe function", () => {
    it("should return unsubscribe function from on()", () => {
      const callback = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      };

      const unsubscribe = canvasEventBus.on("handle:action", callback);

      canvasEventBus.emit("handle:action", payload);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      canvasEventBus.emit("handle:action", payload);
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("should handle multiple unsubscribe calls gracefully", () => {
      const callback = vi.fn();
      const unsubscribe = canvasEventBus.on("handle:action", callback);

      unsubscribe();
      expect(() => unsubscribe()).not.toThrow();
    });
  });

  describe("once", () => {
    it("should only trigger callback once", () => {
      const callback = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "artifact",
        position: "top",
      };

      canvasEventBus.once("handle:action", callback);

      canvasEventBus.emit("handle:action", payload);
      canvasEventBus.emit("handle:action", payload);
      canvasEventBus.emit("handle:action", payload);

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(expect.objectContaining(payload));
    });

    it("should return unsubscribe function that works before event is fired", () => {
      const callback = vi.fn();
      const unsubscribe = canvasEventBus.once("handle:action", callback);

      unsubscribe();

      canvasEventBus.emit("handle:action", {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should allow multiple once listeners", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "input",
        position: "left",
      };

      canvasEventBus.once("handle:action", callback1);
      canvasEventBus.once("handle:action", callback2);

      canvasEventBus.emit("handle:action", payload);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Second emit should not trigger either
      canvasEventBus.emit("handle:action", payload);

      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe("clear", () => {
    it("should remove all listeners", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      canvasEventBus.on("handle:action", callback1);
      canvasEventBus.on("node:select", callback2);
      canvasEventBus.on("node:delete", callback3);

      canvasEventBus.clear();

      canvasEventBus.emit("handle:action", {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      });
      canvasEventBus.emit("node:select", { nodeId: "test" });
      canvasEventBus.emit("node:delete", { nodeId: "test" });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it("should allow adding new listeners after clear", () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      canvasEventBus.on("handle:action", callback1);
      canvasEventBus.clear();
      canvasEventBus.on("handle:action", callback2);

      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      };

      canvasEventBus.emit("handle:action", payload);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(expect.objectContaining(payload));
    });
  });

  describe("edge cases", () => {
    it("should handle the same callback registered multiple times", () => {
      const callback = vi.fn();
      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      };

      canvasEventBus.on("handle:action", callback);
      canvasEventBus.on("handle:action", callback); // Set will deduplicate this

      canvasEventBus.emit("handle:action", payload);

      // Should only be called once since Set deduplicates identical callbacks
      expect(callback).toHaveBeenCalledTimes(1);

      // Removing once should remove the callback entirely
      canvasEventBus.off("handle:action", callback);
      canvasEventBus.emit("handle:action", payload);

      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("should handle rapid subscribe/unsubscribe cycles", () => {
      const callback = vi.fn();

      for (let i = 0; i < 100; i++) {
        const unsubscribe = canvasEventBus.on("handle:action", callback);
        unsubscribe();
      }

      canvasEventBus.emit("handle:action", {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      });

      expect(callback).not.toHaveBeenCalled();
    });

    it("should handle listener that throws an error", () => {
      const errorCallback = vi.fn(() => {
        throw new Error("Listener error");
      });
      const normalCallback = vi.fn();

      canvasEventBus.on("handle:action", errorCallback);
      canvasEventBus.on("handle:action", normalCallback);

      const payload: CanvasHandleActionEvent = {
        handleId: "test",
        nodeId: "test",
        handleType: "output",
        position: "right",
      };

      expect(() => {
        canvasEventBus.emit("handle:action", payload);
      }).toThrow("Listener error");

      // First callback should have been called and thrown
      expect(errorCallback).toHaveBeenCalled();
      // Due to the error, second callback might not be reached
      // This depends on the implementation's error handling
    });
  });
});
