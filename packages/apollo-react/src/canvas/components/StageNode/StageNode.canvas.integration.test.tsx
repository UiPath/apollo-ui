import userEvent from '@testing-library/user-event';
import type { Node, NodeChange, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider, useNodesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../utils/testing';
import { BaseCanvas } from '../BaseCanvas';
import { StageNode } from './StageNode';
import { StageHeaderChipType, type StageNodeBaseProps } from './StageNode.types';

// The shared setup mocks XYFlow and the tooltip; the pill's contract depends on the real node wrapper.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');
vi.unmock('@uipath/apollo-wind/components/ui/tooltip');

const onNodesChangeSpy = vi.fn<(changes: NodeChange[]) => void>();

const stageNode: Node<StageNodeBaseProps> = {
  id: 'stage-1',
  type: 'stage',
  position: { x: 0, y: 0 },
  // Without layout in happy-dom the node is never measured, so fixed dimensions make it visible.
  width: 300,
  height: 200,
  data: {
    stageDetails: {
      label: 'Stage 1',
      tasks: [],
      headerChips: [
        { type: StageHeaderChipType.Optional, tooltip: 'Not required for case completion' },
      ],
    },
  },
};

function TestStageNode({
  id,
  selected,
  dragging,
  width,
  data,
}: NodeProps<Node<StageNodeBaseProps>>) {
  return <StageNode id={id} selected={selected} dragging={dragging} width={width} {...data} />;
}

const nodeTypes = { stage: TestStageNode };

function StageCanvas() {
  const [nodes, , onNodesChange] = useNodesState([stageNode]);
  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChangeSpy(changes);
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  return (
    <div style={{ width: 800, height: 600 }}>
      <BaseCanvas
        nodes={nodes}
        edges={[]}
        nodeTypes={nodeTypes}
        mode="design"
        deleteKeyCode="Delete"
        onlyRenderVisibleElements={false}
        onNodesChange={handleNodesChange}
      />
    </div>
  );
}

const mouseEvent = (type: string) =>
  new MouseEvent(type, { bubbles: true, cancelable: true, view: window });

const changesOfType = (type: NodeChange['type']) =>
  onNodesChangeSpy.mock.calls.flatMap(([changes]) => changes).filter((c) => c.type === type);

beforeEach(() => {
  onNodesChangeSpy.mockReset();
});

describe('StageNode status pill tooltip in a real canvas', () => {
  it('is the next tab stop after the stage node', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ReactFlowProvider>
        <StageCanvas />
      </ReactFlowProvider>
    );
    const nodeWrapper = container.querySelector<HTMLElement>(
      '.react-flow__node[data-id="stage-1"]'
    );
    nodeWrapper?.focus();
    expect(nodeWrapper).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('img', { name: 'Optional' })).toHaveFocus();
  });

  it('selects the stage on click and keeps its keyboard handling while the pill has focus', async () => {
    const user = userEvent.setup();
    render(
      <ReactFlowProvider>
        <StageCanvas />
      </ReactFlowProvider>
    );
    const pill = screen.getByRole('img', { name: 'Optional' });

    // d3-drag needs event.view, which user-event leaves unset; an un-prevented mousedown lets the browser focus the pill.
    expect(fireEvent(pill, mouseEvent('mousedown'))).toBe(true);
    fireEvent(window, mouseEvent('mouseup'));
    fireEvent(pill, mouseEvent('click'));
    expect(changesOfType('select')).toContainEqual({
      id: 'stage-1',
      type: 'select',
      selected: true,
    });

    pill.focus();
    await user.keyboard('{ArrowRight}');
    expect(changesOfType('position').length).toBeGreaterThan(0);

    await user.keyboard('{Delete}');
    expect(changesOfType('remove')).toContainEqual({ id: 'stage-1', type: 'remove' });
  });
});
