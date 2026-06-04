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

  describe('bend-point edges', () => {
    const baseBendParams = {
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

    it('should route through interior bend points instead of using getSmoothStepPath', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          bendPoints: [
            { x: 150, y: 100 },
            { x: 150, y: 200 },
          ],
        })
      );

      expect(result.current.isLoopEdge).toBe(false);
      expect(mockGetSmoothStepPath).not.toHaveBeenCalled();
      // Path is anchored on the (source-offset) start: 100 + (-8) for Position.Right
      expect(result.current.edgePath.startsWith('M 92 100')).toBe(true);
      // Each bend is the apex of a rounded (quadratic) corner
      expect(result.current.edgePath).toContain('Q 150 100');
      expect(result.current.edgePath).toContain('Q 150 200');
      // Path terminates at the target endpoint
      expect(result.current.edgePath).toContain('200 200');
    });

    it("snaps the first bend onto the source handle's axis (horizontal exit)", () => {
      // ELK placed its source port 16px below the rendered handle (y 116 vs 100);
      // the first bend must snap to the handle's y so the exit stays horizontal.
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          bendPoints: [
            { x: 150, y: 116 },
            { x: 150, y: 200 },
          ],
        })
      );

      expect(result.current.edgePath).toContain('Q 150 100');
    });

    it("snaps the last bend onto the target handle's axis (horizontal entry)", () => {
      // ELK placed its target port 16px above the rendered handle (y 184 vs 200).
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          bendPoints: [
            { x: 150, y: 100 },
            { x: 150, y: 184 },
          ],
        })
      );

      expect(result.current.edgePath).toContain('Q 150 200');
    });

    it('shifts bends forward to keep the riser a source-offset past a right handle', () => {
      // Reproduces the real ELK output: right handle at x=556, but ELK's riser is
      // at x=544 (behind the handle) → the exit would route backward into the node.
      // The riser is pushed out by the exit gap (the source-offset magnitude, 8px)
      // to sourceX + 8 = 564, clearing the handle like the smooth-step exit does.
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          sourceX: 556,
          sourceY: 208,
          targetX: 820,
          targetY: 320,
          bendPoints: [
            { x: 544, y: 208 },
            { x: 544, y: 320 },
          ],
        })
      );

      expect(result.current.edgePath).toContain('Q 564 208');
      expect(result.current.edgePath).toContain('Q 564 320');
      expect(result.current.edgePath).not.toContain('544');
    });

    it('leaves interior bends untouched (only first/last snap to handles)', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          bendPoints: [
            { x: 150, y: 100 },
            { x: 175, y: 150 },
            { x: 150, y: 200 },
          ],
        })
      );

      // The middle bend is preserved exactly.
      expect(result.current.edgePath).toContain('Q 175 150');
    });

    it('should fall back to smooth-step path when bendPoints is an empty array', () => {
      const { result } = renderHook(() => useEdgePath({ ...baseBendParams, bendPoints: [] }));

      expect(result.current.isLoopEdge).toBe(false);
      expect(mockGetSmoothStepPath).toHaveBeenCalled();
    });

    it('should fall back to smooth-step path when bendPoints is undefined', () => {
      renderHook(() => useEdgePath(baseBendParams));

      expect(mockGetSmoothStepPath).toHaveBeenCalled();
    });

    it('should ignore bendPoints for self-loop edges', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          targetNodeId: 'node-1', // self-loop
          bendPoints: [{ x: 150, y: 300 }],
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(mockGetSmoothStepPath).not.toHaveBeenCalled();
    });

    it('should ignore bendPoints for loopBack edges', () => {
      const { result } = renderHook(() =>
        useEdgePath({
          ...baseBendParams,
          targetHandleId: 'loopBack',
          bendPoints: [{ x: 150, y: 300 }],
        })
      );

      expect(result.current.isLoopEdge).toBe(true);
      expect(mockGetSmoothStepPath).not.toHaveBeenCalled();
    });

    it('should recompute the path when bendPoints change', () => {
      const initial = [
        { x: 150, y: 100 },
        { x: 175, y: 150 },
        { x: 150, y: 200 },
      ];
      const { result, rerender } = renderHook((props) => useEdgePath(props), {
        initialProps: { ...baseBendParams, bendPoints: initial },
      });

      const firstResult = result.current;

      // Move the (interior, un-snapped) middle bend's x from 175 → 185.
      rerender({
        ...baseBendParams,
        bendPoints: [
          { x: 150, y: 100 },
          { x: 185, y: 150 },
          { x: 150, y: 200 },
        ],
      });

      expect(result.current).not.toBe(firstResult);
      expect(result.current.edgePath).toContain('Q 185 150');
    });
  });
});
