import userEvent from '@testing-library/user-event';
import type { Node, NodeChange, NodeProps } from '@uipath/apollo-react/canvas/xyflow/react';
import { ReactFlowProvider, useNodesState } from '@uipath/apollo-react/canvas/xyflow/react';
import { useCallback } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../utils/testing';
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

// The sortable wrapper around a task card: the task's tab stop while the section is reorderable.
const taskRow = (taskId: string) =>
  screen.getByTestId(`stage-task-card-${taskId}`).closest<HTMLElement>('[role="button"]');

// dnd-kit's live region, which announces every keyboard pick-up, move and drop.
const dragAnnouncement = () => document.querySelector('[id^="DndLiveRegion"]')?.textContent ?? '';

const stageSelected = () =>
  onNodesChangeSpy.mock.calls
    .flatMap(([changes]) => changes)
    .some((c) => c.type === 'select' && c.id === 'stage-1' && c.selected);

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

  it('opens a reorderable task with Enter, keeping focus on it and leaving the stage unselected', async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();
    renderStage(stageWithTasks({ onTaskClick, onTaskReorder: vi.fn() }));
    const row = taskRow('task-1');
    row?.focus();

    await user.keyboard('{Enter}');

    expect(onTaskClick).toHaveBeenCalledTimes(1);
    expect(onTaskClick).toHaveBeenCalledWith(
      'task-1',
      expect.objectContaining({ type: 'keydown' })
    );
    expect(stageSelected()).toBe(false);
    expect(row).toHaveFocus();
    expect(dragAnnouncement()).toBe('');
    // The row is the tab stop, so the card inside it must not be a second one.
    expect(screen.getByTestId('stage-task-card-task-1')).not.toHaveAttribute('tabindex');
  });

  it('tells screen reader users that Enter opens a task and Space reorders it', () => {
    renderStage(stageWithTasks({ onTaskClick: vi.fn(), onTaskReorder: vi.fn() }));

    expect(taskRow('task-1')).toHaveAccessibleDescription(
      /^Press Enter to open the task\. To reorder it, press Space to pick it up/
    );
  });

  it('picks a task up with Space to reorder it, without opening it or selecting the stage', async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();
    renderStage(stageWithTasks({ onTaskClick, onTaskReorder: vi.fn() }));
    taskRow('task-1')?.focus();

    await user.keyboard(' ');
    await waitFor(() => expect(dragAnnouncement()).toMatch(/item task-1/));

    await user.keyboard('{Escape}');
    await waitFor(() => expect(dragAnnouncement()).toMatch(/Dragging was cancelled/));
    await waitFor(() => expect(taskRow('task-1')).toHaveFocus());
    expect(onTaskClick).not.toHaveBeenCalled();
    expect(stageSelected()).toBe(false);
  });

  it('leaves Space on the task menu button to the menu', async () => {
    const user = userEvent.setup();
    renderStage(
      stageWithTasks({
        onTaskClick: vi.fn(),
        onTaskReorder: vi.fn(),
        onTaskGroupModification: vi.fn(),
      })
    );
    screen.getByTestId('stage-task-menu-task-1').focus();

    await user.keyboard(' ');

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(dragAnnouncement()).toBe('');
    expect(stageSelected()).toBe(false);
  });

  it('opens a task with Enter or Space in a read-only stage, where the card is the tab stop', async () => {
    const user = userEvent.setup();
    const onTaskClick = vi.fn();
    renderStage(
      stageWithTasks({
        onTaskClick,
        onTaskReorder: vi.fn(),
        stageDetails: { label: 'Stage 1', tasks, isReadOnly: true },
      })
    );
    const card = screen.getByTestId('stage-task-card-task-1');
    expect(card).toHaveAttribute('role', 'button');
    card.focus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');

    expect(onTaskClick).toHaveBeenCalledTimes(2);
    expect(onTaskClick).toHaveBeenNthCalledWith(
      1,
      'task-1',
      expect.objectContaining({ type: 'keydown', key: 'Enter' })
    );
    expect(stageSelected()).toBe(false);
  });
});
