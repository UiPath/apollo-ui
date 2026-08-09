import { render } from '@testing-library/react';
import {
  type ConnectionLineComponentProps,
  type EdgeProps,
  Position,
} from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { StageConnectionEdge } from './StageConnectionEdge';
import { StageEdge } from './StageEdge';

const mocks = vi.hoisted(() => ({
  getBezierPath: vi.fn(() => ['M 0 0']),
  getSmoothStepPath: vi.fn(() => ['M 0 0', 0, 0, 0, 0]),
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@uipath/apollo-react/canvas/xyflow/react')>()),
  getBezierPath: mocks.getBezierPath,
  getSmoothStepPath: mocks.getSmoothStepPath,
}));

beforeAll(() => {
  Object.defineProperties(SVGElement.prototype, {
    getTotalLength: {
      configurable: true,
      value: () => 100,
    },
    getPointAtLength: {
      configurable: true,
      value: (length: number) => ({ x: length, y: length }),
    },
  });
});

describe('stage edge handle geometry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('draws the connection preview from and to the active handles', () => {
    const props = {
      fromX: 120,
      fromY: 240,
      toX: 360,
      toY: 480,
      fromPosition: Position.Bottom,
      toPosition: Position.Bottom,
      fromNode: { position: { x: 10, y: 20 }, measured: { width: 336 } },
      toNode: { position: { x: 700, y: 40 } },
    } as ConnectionLineComponentProps;

    render(
      <svg>
        <StageConnectionEdge {...props} />
      </svg>
    );

    expect(mocks.getBezierPath).toHaveBeenCalledWith({
      sourceX: 120,
      sourceY: 240,
      sourcePosition: Position.Bottom,
      targetX: 360,
      targetY: 480,
      targetPosition: Position.Bottom,
    });
  });

  it('draws a committed edge from and to its registered handles', () => {
    const props = {
      id: 'return-edge',
      source: 'later-stage',
      target: 'origin-stage',
      sourceX: 520,
      sourceY: 420,
      targetX: 160,
      targetY: 300,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Bottom,
      selected: false,
    } as EdgeProps;

    render(
      <svg>
        <StageEdge {...props} />
      </svg>
    );

    expect(mocks.getSmoothStepPath).toHaveBeenCalledWith({
      sourceX: 520,
      sourceY: 420,
      sourcePosition: Position.Bottom,
      targetX: 159,
      targetY: 300,
      targetPosition: Position.Bottom,
      borderRadius: 40,
    });
  });
});
