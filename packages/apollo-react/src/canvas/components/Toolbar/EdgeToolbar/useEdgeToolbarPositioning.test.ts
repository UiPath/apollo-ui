import { act, renderHook } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEdgeToolbarPositioning } from './useEdgeToolbarPositioning';

// Mock useReactFlow
const mockReactFlowInstance = {
  screenToFlowPosition: vi.fn((pos: { x: number; y: number }) => pos),
};

vi.mock('@uipath/uix/xyflow/react', async () => ({
  ...(await vi.importActual('@uipath/uix/xyflow/react')),
  useReactFlow: () => mockReactFlowInstance,
}));

describe('useEdgeToolbarPositioning', () => {
  let pathElement: SVGPathElement;
  let pathElementRef: React.MutableRefObject<SVGPathElement | null>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock requestAnimationFrame to be synchronous
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

    // Create a mock SVG path element
    pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Mock path element methods
    pathElement.getTotalLength = vi.fn(() => 200);
    pathElement.getPointAtLength = vi.fn(
      (length: number) =>
        ({
          x: length,
          y: 100,
        }) as SVGPoint
    );
    pathElement.getBBox = vi.fn(
      () =>
        ({
          x: 0,
          y: 90,
          width: 200,
          height: 20,
        }) as SVGRect
    );

    pathElementRef = { current: pathElement };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return null positionData when disabled', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: false,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.positionData).toBeNull();
      expect(result.current.handleMouseMoveOnPath).toBeUndefined();
    });

    it('should return handleMouseMoveOnPath when enabled', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.handleMouseMoveOnPath).toBeInstanceOf(Function);
    });

    it('should return null positionData initially when enabled', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.positionData).toBeNull();
    });
  });

  describe('mouse movement tracking', () => {
    it('should update positionData on mouse move', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 150,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      expect(result.current.positionData).not.toBeNull();
      expect(result.current.positionData?.pathPosition).toBeDefined();
      expect(result.current.positionData?.offsetPosition).toBeDefined();
    });

    it('should convert screen coordinates to flow coordinates', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 150,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      expect(mockReactFlowInstance.screenToFlowPosition).toHaveBeenCalledWith(
        { x: 150, y: 100 },
        { snapToGrid: false }
      );
    });

    it('should not update if pathElementRef.current is null', () => {
      pathElementRef.current = null;

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 150,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      expect(result.current.positionData).toBeNull();
    });

    it('should not update if disabled', () => {
      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: false,
          targetPosition: Position.Left,
        })
      );

      // handleMouseMoveOnPath should be undefined when disabled
      expect(result.current.handleMouseMoveOnPath).toBeUndefined();
    });
  });

  describe('short path handling', () => {
    it('should use bounding box offset for short paths', () => {
      // Set path length below MIN_MOUSE_FOLLOW_DISTANCE (100)
      pathElement.getTotalLength = vi.fn(() => 50);

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Top,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      expect(result.current.positionData).not.toBeNull();
      expect(pathElement.getBBox).toHaveBeenCalled();
    });

    it('should calculate offset position for Position.Top on short paths', () => {
      pathElement.getTotalLength = vi.fn(() => 50);
      pathElement.getBBox = vi.fn(
        () =>
          ({
            x: 50,
            y: 90,
            width: 100,
            height: 20,
          }) as SVGRect
      );

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Top,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      // For Position.Top, offset should be right of path
      const offsetPosition = result.current.positionData?.offsetPosition;
      expect(offsetPosition?.x).toBeGreaterThan(50 + 100); // x + width
    });

    it('should calculate offset position for Position.Bottom on short paths', () => {
      pathElement.getTotalLength = vi.fn(() => 50);
      pathElement.getBBox = vi.fn(
        () =>
          ({
            x: 50,
            y: 90,
            width: 100,
            height: 20,
          }) as SVGRect
      );

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Bottom,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      // For Position.Bottom, offset should be left of path
      const offsetPosition = result.current.positionData?.offsetPosition;
      expect(offsetPosition?.x).toBeLessThan(50); // less than x
    });

    it('should calculate offset position for Position.Left on short paths', () => {
      pathElement.getTotalLength = vi.fn(() => 50);
      pathElement.getBBox = vi.fn(
        () =>
          ({
            x: 50,
            y: 90,
            width: 100,
            height: 20,
          }) as SVGRect
      );

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      // For Position.Left, offset should be above path
      const offsetPosition = result.current.positionData?.offsetPosition;
      expect(offsetPosition?.y).toBeLessThan(90); // less than y
    });

    it('should calculate offset position for Position.Right on short paths', () => {
      pathElement.getTotalLength = vi.fn(() => 50);
      pathElement.getBBox = vi.fn(
        () =>
          ({
            x: 50,
            y: 90,
            width: 100,
            height: 20,
          }) as SVGRect
      );

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Right,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      // For Position.Right, offset should be above path
      const offsetPosition = result.current.positionData?.offsetPosition;
      expect(offsetPosition?.y).toBeLessThan(90); // less than y
    });
  });

  describe('long path handling', () => {
    it('should use perpendicular offset for long paths', () => {
      pathElement.getTotalLength = vi.fn(() => 200);

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      expect(result.current.positionData).not.toBeNull();
      expect(pathElement.getPointAtLength).toHaveBeenCalled();
    });
  });

  describe('cleanup and state management', () => {
    it('should reset positionData when disabled', () => {
      const { result, rerender } = renderHook(
        ({ isEnabled }) =>
          useEdgeToolbarPositioning({
            pathElementRef,
            isEnabled,
            targetPosition: Position.Left,
          }),
        { initialProps: { isEnabled: true } }
      );

      expect(result.current.handleMouseMoveOnPath).toBeDefined();

      rerender({ isEnabled: false });

      expect(result.current.positionData).toBeNull();
      expect(result.current.handleMouseMoveOnPath).toBeUndefined();
    });

    it('should cancel pending animation frame on disable', () => {
      const cancelAnimationFrameSpy = vi.mocked(window.cancelAnimationFrame);

      const { result, rerender } = renderHook(
        ({ isEnabled }) =>
          useEdgeToolbarPositioning({
            pathElementRef,
            isEnabled,
            targetPosition: Position.Left,
          }),
        { initialProps: { isEnabled: true } }
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      rerender({ isEnabled: false });

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });

    it('should cleanup on unmount', () => {
      const cancelAnimationFrameSpy = vi.mocked(window.cancelAnimationFrame);

      const { unmount, result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      unmount();

      // Should not throw errors on unmount
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });

  describe('throttling', () => {
    it('should throttle updates using requestAnimationFrame', () => {
      const requestAnimationFrameSpy = vi.mocked(window.requestAnimationFrame);

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent = {
        clientX: 100,
        clientY: 100,
      } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent);
      });

      expect(requestAnimationFrameSpy).toHaveBeenCalled();
    });

    it('should cancel previous animation frame when new mouse move occurs', () => {
      const cancelAnimationFrameSpy = vi.mocked(window.cancelAnimationFrame);

      const { result } = renderHook(() =>
        useEdgeToolbarPositioning({
          pathElementRef,
          isEnabled: true,
          targetPosition: Position.Left,
        })
      );

      const mockEvent1 = { clientX: 100, clientY: 100 } as React.MouseEvent;
      const mockEvent2 = { clientX: 150, clientY: 100 } as React.MouseEvent;

      act(() => {
        result.current.handleMouseMoveOnPath?.(mockEvent1);
        result.current.handleMouseMoveOnPath?.(mockEvent2);
      });

      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });
  });
});
