import { render } from '@testing-library/react';
import { BackgroundVariant, ReactFlow } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import { BASE_CANVAS_GRID_SPACING } from './BaseCanvas.constants';
import { CanvasBackground } from './CanvasBackground';

// The shared canvas mocks stub React Flow's Background; this test reads the real pattern.
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => importOriginal());

type Viewport = { x: number; y: number; zoom: number };
type Pattern = { variant: BackgroundVariant; gap: number; size: number };

/**
 * Where the pattern's first mark lands, in flow coordinates: a dot's centre, or the vertical and
 * horizontal strokes of a line or cross.
 */
const firstMarkInFlow = (pattern: Pattern | undefined, viewport: Viewport) => {
  const { container } = render(
    <ReactFlow defaultViewport={viewport} minZoom={0.1} maxZoom={4}>
      <CanvasBackground {...pattern} />
    </ReactFlow>
  );
  const drawn = container.querySelector('pattern');
  if (!drawn) throw new Error('No pattern drawn');

  let markX: number;
  let markY: number;
  const dot = drawn.querySelector('circle');
  if (dot) {
    markX = Number(dot.getAttribute('cx'));
    markY = Number(dot.getAttribute('cy'));
  } else {
    // `M{x} 0 V{h} M0 {y} H{w}`: a vertical stroke at x and a horizontal stroke at y.
    const [x, , , , y] = (
      drawn
        .querySelector('path')
        ?.getAttribute('d')
        ?.match(/-?[\d.]+/g) ?? []
    ).map(Number);
    markX = x;
    markY = y;
  }

  const [shiftX, shiftY] = (drawn.getAttribute('patternTransform')?.match(/-?[\d.]+/g) ?? []).map(
    Number
  );
  const screenX = Number(drawn.getAttribute('x')) + markX + shiftX;
  const screenY = Number(drawn.getAttribute('y')) + markY + shiftY;
  return { x: (screenX - viewport.x) / viewport.zoom, y: (screenY - viewport.y) / viewport.zoom };
};

const offGrid = (value: number, gap: number) => {
  const remainder = ((value % gap) + gap) % gap;
  return Math.min(remainder, gap - remainder);
};

const VIEWPORTS: Viewport[] = [
  { x: 0, y: 0, zoom: 1 },
  { x: 11, y: 272.87, zoom: 0.477 },
  { x: -517.9, y: 108.46, zoom: 0.989 },
  { x: 40, y: -25, zoom: 2.5 },
];

const PATTERNS: Pattern[] = [
  { variant: BackgroundVariant.Dots, gap: BASE_CANVAS_GRID_SPACING, size: 2 },
  { variant: BackgroundVariant.Dots, gap: 24, size: 3 },
  // React Flow draws a size-0 dot at its default size of 1.
  { variant: BackgroundVariant.Dots, gap: BASE_CANVAS_GRID_SPACING, size: 0 },
  { variant: BackgroundVariant.Lines, gap: BASE_CANVAS_GRID_SPACING, size: 2 },
  { variant: BackgroundVariant.Cross, gap: BASE_CANVAS_GRID_SPACING, size: 4 },
];

describe('CanvasBackground', () => {
  describe.each(PATTERNS)('$variant, gap $gap, size $size', (pattern) => {
    it.each(VIEWPORTS)('lands on the grid at %o', (viewport) => {
      const mark = firstMarkInFlow(pattern, viewport);

      expect(offGrid(mark.x, pattern.gap)).toBeCloseTo(0, 6);
      expect(offGrid(mark.y, pattern.gap)).toBeCloseTo(0, 6);
    });
  });

  it.each(VIEWPORTS)('draws its default dots on the snap grid at %o', (viewport) => {
    const dot = firstMarkInFlow(undefined, viewport);

    expect(offGrid(dot.x, BASE_CANVAS_GRID_SPACING)).toBeCloseTo(0, 6);
    expect(offGrid(dot.y, BASE_CANVAS_GRID_SPACING)).toBeCloseTo(0, 6);
  });
});
