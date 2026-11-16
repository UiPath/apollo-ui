import userEvent from '@testing-library/user-event';
import type { Node, NodeChange, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider, useNodesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { BaseCanvas } from '../BaseCanvas';
import { StageNode } from './StageNode';
import type { StageNodeBaseProps } from './StageNode.types';

// The shared setup mocks XYFlow; whether a key reaches the stage depends on the real node wrapper.
vi.unmock('@uipath/apollo-react/canvas/xyflow/react');

type StageFlowNode = Node<StageNodeBaseProps & Record<string, unknown>>;

const onNodesChangeSpy = vi.fn<(changes: NodeChange<StageFlowNode>[]) => void>();

const tasks = [[{ id: 'task-1', label: 'Task 1' }], [{ id: 'task-2', label: 'Task 2' }]];

const stageWithTasks = (data: Partial<StageNodeBaseProps> = {}): StageFlowNode => ({
  id: 'stage-1',
  type: 'stage',
  position: { x: 0, y: 0 },
  // Without layout in happy-dom the node is never measured, so fixed dimensions make it visible.
  width: 300,
  height: 200,
  data: { stageDetails: { label: 'Stage 1', tasks }, ...data },
});

function TestStageNode({ id, selected, dragging, width, data }: NodeProps<StageFlowNode>) {
  return <StageNode id={id} selected={selected} dragging={dragging} width={width} {...data} />;
}

const nodeTypes = { stage: TestStageNode };

function StageCanvas({ node }: { node: StageFlowNode }) {
  const [nodes, , onNodesChange] = useNodesState([node]);
  const handleNodesChange = useCallback(
    (changes: NodeChange<StageFlowNode>[]) => {
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
        onlyRenderVisibleElements={false}
        onNodesChange={handleNodesChange}
      />
    </div>
  );
}

const renderStage = (node: StageFlowNode) =>
  render(
    <ReactFlowProvider>
      <StageCanvas node={node} />
    </ReactFlowProvider>
  );

beforeEach(() => {
  onNodesChangeSpy.mockReset();
});

describe('StageNode task activation in a real canvas', () => {
  it('opens a task on click and hands the click to onTaskClick', async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();
    renderStage(stageWithTasks({ onTaskClick, onTaskReorder: vi.fn() }));

    await user.click(screen.getByTestId('stage-task-card-task-1'));

    expect(onTaskClick).toHaveBeenCalledTimes(1);
    expect(onTaskClick).toHaveBeenCalledWith('task-1', expect.objectContaining({ type: 'click' }));
  });
});
