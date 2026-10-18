import { render, screen } from '@testing-library/react';
import { Position } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it } from 'vitest';
import type { BaseCanvasProps } from '../../BaseCanvas/BaseCanvas.types';
import { BaseCanvasModeProvider } from '../../BaseCanvas/BaseCanvasModeProvider';
import { getLeftEntryArrowTargetY, SequentialConnectorEdge } from './SequentialConnectorEdge';
import type {
  SequentialConnectorData,
  SequentialConnectorEdgeProps,
} from './SequentialConnectorEdge.types';

const baseProps = {
  id: 'e1',
  source: 'a',
  target: 'b',
  sourceX: 0,
  sourceY: 0,
  sourcePosition: Position.Bottom,
  targetX: 100,
  targetY: 200,
  targetPosition: Position.Top,
} as unknown as SequentialConnectorEdgeProps;

function renderEdge(data: SequentialConnectorData, mode: BaseCanvasProps['mode'] = 'design') {
  return render(
    <BaseCanvasModeProvider mode={mode}>
      <svg>
        <SequentialConnectorEdge {...baseProps} data={data} />
      </svg>
    </BaseCanvasModeProvider>
  );
}

describe('SequentialConnectorEdge', () => {
  describe('goto kind', () => {
    it('renders a dashed path', () => {
      const { container } = renderEdge({ kind: 'goto' });

      const visiblePath = container.querySelector('.react-flow__edge-path') as SVGPathElement;
      expect(visiblePath.style.strokeDasharray).toBe('5,5');
    });
  });

  describe('merge-back kind', () => {
    it('renders a straight container continuation solid', () => {
      const { container } = renderEdge({
        kind: 'merge-back',
        waypoints: [],
        slot: { id: 'container-continuation' },
      });

      const visiblePath = container.querySelector('.react-flow__edge-path') as SVGPathElement;
      expect(visiblePath.style.strokeDasharray).toBe('0');
    });

    it('renders an elbowed branch rejoin solid', () => {
      const { container } = renderEdge({
        kind: 'merge-back',
        waypoints: [
          { x: 0, y: 100 },
          { x: 100, y: 100 },
        ],
      });

      const visiblePath = container.querySelector('.react-flow__edge-path') as SVGPathElement;
      expect(visiblePath.style.strokeDasharray).toBe('0');
    });
  });

  it('centers a left-entry arrow using the target node height', () => {
    expect(getLeftEntryArrowTargetY(200, 999, 48)).toBe(224);
    expect(getLeftEntryArrowTargetY(undefined, 200, undefined)).toBe(228);
  });

  // The ⊕ and the branch header belong to SequentialInsertLayer, so one portal serves every
  // connector instead of two per edge.
  it('renders neither an insert button nor a branch header itself', () => {
    renderEdge(
      { kind: 'branch-entry', label: 'True', slot: { id: 's-1', graphEdgeId: 'e1' } },
      'design'
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sequential-branch-header')).not.toBeInTheDocument();
  });

  it('keeps the centered label pill on non-branch connectors', () => {
    const { container } = renderEdge({ kind: 'step', label: 'Then' });

    expect(container.querySelector('.react-flow__edge-label')).toHaveTextContent('Then');
  });
});
