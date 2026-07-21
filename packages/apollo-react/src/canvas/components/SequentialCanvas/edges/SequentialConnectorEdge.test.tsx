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

  it('centers a left-entry arrow using the target node height', () => {
    expect(getLeftEntryArrowTargetY(200, 999, 48)).toBe(224);
    expect(getLeftEntryArrowTargetY(undefined, 200, undefined)).toBe(228);
  });

  describe('step kind insert affordance', () => {
    it('renders the insert button when a slot is present and the canvas is in design mode', () => {
      renderEdge({ kind: 'step', slot: { id: 's-1', graphEdgeId: 'e1' } }, 'design');
      const button = screen.getByRole('button', { name: 'Insert step' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass(
        'opacity-0',
        'group-hover:opacity-100',
        'group-focus-within:opacity-100'
      );
    });

    it('does not render the insert button outside design mode, even with a slot', () => {
      renderEdge({ kind: 'step', slot: { id: 's-1', graphEdgeId: 'e1' } }, 'view');
      expect(screen.queryByRole('button', { name: 'Insert step' })).not.toBeInTheDocument();
    });

    it('does not render the insert button in design mode without a slot', () => {
      renderEdge({ kind: 'step' }, 'design');
      expect(screen.queryByRole('button', { name: 'Insert step' })).not.toBeInTheDocument();
    });
  });

  it('renders a branch-entry label above the row using the shared edge-label style', () => {
    const { container } = renderEdge({ kind: 'branch-entry', label: 'True' });

    expect(screen.getByTestId('sequential-branch-header')).toHaveTextContent('True');
    expect(container.querySelector('.react-flow__edge-label')).toBeInTheDocument();
    expect(container.querySelector('foreignObject')).not.toBeInTheDocument();
  });
});
