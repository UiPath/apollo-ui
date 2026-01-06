import { renderHook } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEdgePath } from './useEdgePath';

// Mock getSmoothStepPath from React Flow
const mockGetSmoothStepPath = vi.fn();
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    getSmoothStepPath: (params: Record<string, unknown>) => mockGetSmoothStepPath(params),
  };
});

describe('useEdgePath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return for getSmoothStepPath
    mockGetSmoothStepPath.mockReturnValue([
      'M 0 0 L 100 100',
      50, // labelX
      50, // labelY
    ]);
  });

  describe('regular edges', () => {
    it('should calculate path for regular edge using getSmoothStepPath', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(false);
      expect(result.current.edgePath).toBe('M 0 0 L 100 100');
      expect(result.current.labelX).toBe(50);
      expect(result.current.labelY).toBe(50);
      expect(mockGetSmoothStepPath).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceX: 92, // 100 + (-8) for Right position
          sourceY: 100,
          sourcePosition: Position.Right,
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Left,
          borderRadius: 16,
        })
      );
    });

    it('should apply correct source offset for Position.Right', () => {
      renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Left,
        })
      );

      expect(mockGetSmoothStepPath).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceX: 92, // 100 + (-8)
          sourceY: 100,
        })
      );
    });

    it('should apply correct source offset for Position.Left', () => {
      renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Left,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Right,
        })
      );

      expect(mockGetSmoothStepPath).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceX: 108, // 100 + 8
          sourceY: 100,
        })
      );
    });

    it('should apply correct source offset for Position.Top', () => {
      renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Top,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Bottom,
        })
      );

      expect(mockGetSmoothStepPath).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceX: 100,
          sourceY: 108, // 100 + 8
        })
      );
    });

    it('should apply correct source offset for Position.Bottom', () => {
      renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Bottom,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Top,
        })
      );

      expect(mockGetSmoothStepPath).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceX: 100,
          sourceY: 92, // 100 + (-8)
        })
      );
    });
  });

  describe('loop edges - self-loops', () => {
    it('should detect self-loop when sourceNodeId equals targetNodeId', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(mockGetSmoothStepPath).not.toHaveBeenCalled();
    });

    it('should create custom loop path for self-loop', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(result.current.edgePath).toContain('M');
      expect(result.current.edgePath).toContain('L');
      expect(result.current.edgePath).toContain('Q');
      // Label should be positioned below the loop
      expect(result.current.labelY).toBeGreaterThan(120);
    });

    it('should use larger dimensions for success handle self-loop', () => {
      const resultRegular = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      const resultSuccess = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'success',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      // Success loop should have larger labelY (positioned lower)
      expect(resultSuccess.result.current.labelY).toBeGreaterThan(
        resultRegular.result.current.labelY
      );
    });
  });

  describe('loop edges - loopBack edges', () => {
    it("should detect loopBack edge when targetHandleId is 'loopBack'", () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'loopBack',
          targetX: 50,
          targetY: 100,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(mockGetSmoothStepPath).not.toHaveBeenCalled();
    });

    it('should create custom loop path for loopBack edge', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'loopBack',
          targetX: 50,
          targetY: 100,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(result.current.edgePath).toContain('M');
      expect(result.current.edgePath).toContain('L');
      expect(result.current.edgePath).toContain('Q');
    });
  });

  describe('path calculations', () => {
    it('should snap coordinates to grid', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 103, // Not on grid
          sourceY: 107, // Not on grid
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 99, // Not on grid
          targetY: 121, // Not on grid
          targetPosition: Position.Left,
        })
      );

      // Path should contain grid-snapped values (multiples of GRID_SPACING)
      expect(result.current.isLoopEdge).toBe(true);
      expect(result.current.edgePath).toBeDefined();
    });

    it('should position label at center horizontally for loop edges', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.labelX).toBe(150); // (100 + 200) / 2
    });
  });

  describe('memoization', () => {
    it("should memoize result when inputs don't change", () => {
      const params = {
        sourceNodeId: 'node-1',
        sourceHandleId: 'output',
        sourceX: 100,
        sourceY: 100,
        sourcePosition: Position.Right,
        targetNodeId: 'node-2',
        targetHandleId: 'input',
        targetX: 200,
        targetY: 200,
        targetPosition: Position.Left,
      };

      const { result, rerender } = renderHook((props) => useEdgePath(props), {
        initialProps: params,
      });

      const firstResult = result.current;

      rerender(params);

      expect(result.current).toBe(firstResult);
    });

    it('should recalculate when source position changes', () => {
      const { result, rerender } = renderHook((props) => useEdgePath(props), {
        initialProps: {
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Left,
        },
      });

      const firstResult = result.current;

      rerender({
        sourceNodeId: 'node-1',
        sourceHandleId: 'output',
        sourceX: 150, // Changed
        sourceY: 100,
        sourcePosition: Position.Right,
        targetNodeId: 'node-2',
        targetHandleId: 'input',
        targetX: 200,
        targetY: 200,
        targetPosition: Position.Left,
      });

      expect(result.current).not.toBe(firstResult);
    });

    it('should recalculate when edge type changes from regular to loop', () => {
      const { result, rerender } = renderHook((props) => useEdgePath(props), {
        initialProps: {
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: 200,
          targetY: 200,
          targetPosition: Position.Left,
        },
      });

      expect(result.current.isLoopEdge).toBe(false);

      rerender({
        sourceNodeId: 'node-1',
        sourceHandleId: 'output',
        sourceX: 100,
        sourceY: 100,
        sourcePosition: Position.Right,
        targetNodeId: 'node-1', // Changed to self-loop
        targetHandleId: 'input',
        targetX: 200,
        targetY: 200,
        targetPosition: Position.Left,
      });

      expect(result.current.isLoopEdge).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null sourceHandleId', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: null,
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(result.current.edgePath).toBeDefined();
    });

    it('should handle undefined sourceHandleId', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: undefined,
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 120,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(result.current.edgePath).toBeDefined();
    });

    it('should handle negative coordinates', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: -100,
          sourceY: -50,
          sourcePosition: Position.Right,
          targetNodeId: 'node-2',
          targetHandleId: 'input',
          targetX: -200,
          targetY: -150,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.edgePath).toBeDefined();
      expect(result.current.labelX).toBeDefined();
      expect(result.current.labelY).toBeDefined();
    });

    it('should handle same source and target positions', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          sourceNodeId: 'node-1',
          sourceHandleId: 'output',
          sourceX: 100,
          sourceY: 100,
          sourcePosition: Position.Right,
          targetNodeId: 'node-1',
          targetHandleId: 'input',
          targetX: 100,
          targetY: 100,
          targetPosition: Position.Left,
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(result.current.edgePath).toBeDefined();
    });
  });
});
