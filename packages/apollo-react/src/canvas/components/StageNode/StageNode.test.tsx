import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../utils/testing';
import type { ListItem } from '../Toolbox';
import { StageNode } from './StageNode';
import type { StageNodeProps, StageTaskItem } from './StageNode.types';
import { StageHeaderChipType } from './StageNode.types';

// Mock DndContext and related components
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="dnd-context">{children}</div>
  ),
  DragOverlay: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  closestCenter: vi.fn(),
  KeyboardSensor: vi.fn(),
  PointerSensor: vi.fn(),
  useSensor: vi.fn(() => vi.fn()),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
  }),
  SortableContext: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  verticalListSortingStrategy: {},
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: {
    Transform: vi.fn(),
    Translate: vi.fn(),
  },
}));

// Mock FloatingCanvasPanel
vi.mock('../FloatingCanvasPanel', () => ({
  FloatingCanvasPanel: ({
    open = true,
    children,
    onClose,
  }: {
    open?: boolean;
    children?: React.ReactNode;
    onClose?: () => void;
  }) =>
    open ? (
      <div data-testid="floating-canvas-panel">
        {children}
        {onClose && (
          <button type="button" data-testid="panel-close" onClick={onClose}>
            Close Panel
          </button>
        )}
      </div>
    ) : null,
}));

// Mock Toolbox
vi.mock('../Toolbox', () => ({
  Toolbox: ({
    title,
    initialItems,
    loading,
    onItemSelect,
    onClose,
  }: {
    title: string;
    initialItems: ListItem[];
    loading?: boolean;
    onItemSelect?: (item: ListItem) => void;
    onClose?: () => void;
  }) => (
    <div data-testid="toolbox" data-loading={loading}>
      <div data-testid="toolbox-title">{title}</div>
      <div data-testid="toolbox-items-count">{initialItems.length}</div>
      {initialItems.map((item, index) => (
        <button
          key={item.id || index}
          type="button"
          data-testid={`toolbox-item-${item.id || index}`}
          onClick={() => onItemSelect?.(item)}
        >
          {item.name || item.id}
        </button>
      ))}
      {onClose && (
        <button type="button" data-testid="toolbox-close" onClick={onClose}>
          Close Toolbox
        </button>
      )}
    </div>
  ),
}));

// Mock DraggableTask
vi.mock('./DraggableTask', () => ({
  DraggableTask: ({
    task,
    isDragDisabled,
    getContextMenuItems,
  }: {
    task: StageTaskItem;
    isDragDisabled?: boolean;
    getContextMenuItems?: (
      task: StageTaskItem
    ) => Array<{ id?: string; label?: string; onClick?: () => void }>;
  }) => {
    const [menuItems, setMenuItems] = React.useState<
      Array<{ id?: string; label?: string; onClick?: () => void }>
    >([]);
    return (
      <div
        data-testid={`draggable-task-${task.id}`}
        data-drag-disabled={isDragDisabled ? 'true' : 'false'}
      >
        <div data-testid={`task-label-${task.id}`}>{task.label}</div>
        {getContextMenuItems && (
          <button
            type="button"
            data-testid={`task-menu-button-${task.id}`}
            onClick={() => {
              setMenuItems(getContextMenuItems(task));
            }}
          >
            Open Menu
          </button>
        )}
        {menuItems.length > 0 && (
          <div data-testid={`task-menu-items-${task.id}`}>
            {menuItems.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                data-testid={`menu-item-${task.id}-${item.id || index}`}
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
  TaskContent: ({ task }: { task: StageTaskItem }) => <div>{task.label}</div>,
}));

// Mock NodeContextMenu
vi.mock('../NodeContextMenu', () => ({
  NodeContextMenu: ({ isVisible }: { isVisible: boolean }) =>
    isVisible ? <div data-testid="node-context-menu">Context Menu</div> : null,
}));

// Mock useConnectedHandles
vi.mock('../BaseCanvas/ConnectedHandlesContext', () => ({
  useConnectedHandles: () => new Set(),
}));

// Mock useButtonHandles
vi.mock('../ButtonHandle/useButtonHandles', () => ({
  useButtonHandles: () => null,
}));

vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    useReactFlow: () => ({
      setNodes: vi.fn(),
    }),
    useStore: (selector: (state: Record<string, unknown>) => unknown) => {
      const mockState = {
        transform: [0, 0, 1],
        connectionClickStartHandle: null,
      };
      return selector(mockState);
    },
  };
});

const createTask = (id: string, label?: string): StageTaskItem => ({
  id,
  label: label ?? `Task ${id}`,
});

const defaultProps = {
  dragging: false,
  selected: true,
  id: 'stage-1',
  width: 300,
  stageDetails: {
    label: 'Test Stage',
    tasks: [[createTask('task-1', 'Task 1')]],
  },
  taskOptions: [
    { id: 'option-1', name: 'Option 1', data: {} },
    { id: 'option-2', name: 'Option 2', data: {} },
  ],
} as StageNodeProps;

const renderStageNode = (props: Partial<StageNodeProps> = {}) => {
  return render(
    <ReactFlowProvider>
      <StageNode {...defaultProps} {...props} />
    </ReactFlowProvider>
  );
};

describe('StageNode - Test Hooks', () => {
  it('renders a stable test id for the stage header', () => {
    renderStageNode();

    expect(screen.getByTestId('stage-header-stage-1')).toBeInTheDocument();
  });
});

describe('StageNode - Replace Task Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Replace Task Menu Item', () => {
    it('should show replace task menu item when onTaskReplace is provided', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      renderStageNode({ onReplaceTaskFromToolbox });

      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      expect(taskMenuButton).toBeInTheDocument();

      // Open the menu
      await user.click(taskMenuButton);

      // Check if replace task menu item is present
      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      expect(replaceMenuItem).toBeInTheDocument();
      expect(replaceMenuItem).toHaveTextContent('Replace task');
    });

    it('should not show replace task menu item when onTaskReplace is not provided', async () => {
      const user = userEvent.setup();
      // Need onTaskGroupModification to show menu button, but not onReplaceTaskFromToolbox
      const onTaskGroupModification = vi.fn();
      renderStageNode({ onReplaceTaskFromToolbox: undefined, onTaskGroupModification });

      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      // Replace task menu item should not be present
      const replaceMenuItem = screen.queryByTestId('menu-item-task-1-replace-task');
      expect(replaceMenuItem).not.toBeInTheDocument();
    });

    it('should show replace task menu item before regroup options', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const onTaskGroupModification = vi.fn();
      renderStageNode({ onReplaceTaskFromToolbox, onTaskGroupModification });

      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const menuItems = screen.getByTestId('task-menu-items-task-1');
      const buttons = menuItems.querySelectorAll('button');

      // First item should be replace task
      expect(buttons[0]).toHaveTextContent('Replace task');
    });
  });

  describe('Replace Task Toolbox', () => {
    it('should open replace task toolbox when replace task menu item is clicked', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      renderStageNode({ onReplaceTaskFromToolbox });

      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        const toolbox = screen.getByTestId('toolbox');
        expect(toolbox).toBeInTheDocument();
      });

      // Check toolbox title
      const toolboxTitle = screen.getByTestId('toolbox-title');
      expect(toolboxTitle).toHaveTextContent('Replace task');
    });

    it('should display task options in replace task toolbox', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const taskOptions: ListItem[] = [
        { id: 'option-1', name: 'Option 1', data: {} },
        { id: 'option-2', name: 'Option 2', data: {} },
        { id: 'option-3', name: 'Option 3', data: {} },
      ];

      renderStageNode({ onReplaceTaskFromToolbox, taskOptions });

      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        const toolbox = screen.getByTestId('toolbox');
        expect(toolbox).toBeInTheDocument();
      });

      // Check that all options are displayed
      expect(screen.getByTestId('toolbox-item-option-1')).toBeInTheDocument();
      expect(screen.getByTestId('toolbox-item-option-2')).toBeInTheDocument();
      expect(screen.getByTestId('toolbox-item-option-3')).toBeInTheDocument();
    });
  });

  describe('Replace Task Callback', () => {
    it('should call onTaskReplace with correct parameters when task is selected', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const taskOptions: ListItem<StageTaskItem>[] = [
        { id: 'new-task', name: 'New Task', data: { id: 'new-task', label: 'New Task' } },
      ];

      renderStageNode({ onReplaceTaskFromToolbox, taskOptions });

      // Open menu and click replace
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Select a task from toolbox
      const taskOption = screen.getByTestId('toolbox-item-new-task');
      await user.click(taskOption);

      // Verify onReplaceTaskFromToolbox was called with correct parameters
      await waitFor(() => {
        expect(onReplaceTaskFromToolbox).toHaveBeenCalledTimes(1);
        expect(onReplaceTaskFromToolbox).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'new-task' }),
          0, // groupIndex
          0 // taskIndex
        );
      });
    });

    it('should pass correct groupIndex and taskIndex for parallel tasks', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const tasks: StageTaskItem[][] = [
        [createTask('task-1', 'Task 1'), createTask('task-2', 'Task 2')], // Parallel group
        [createTask('task-3', 'Task 3')],
      ];
      const taskOptions: ListItem<StageTaskItem>[] = [
        { id: 'new-task', name: 'New Task', data: { id: 'new-task', label: 'New Task' } },
      ];

      renderStageNode({
        onReplaceTaskFromToolbox,
        taskOptions,
        stageDetails: {
          ...defaultProps.stageDetails,
          tasks,
        },
      });

      // Open menu for task-2 (index 1 in group 0)
      const taskMenuButton = screen.getByTestId('task-menu-button-task-2');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-2-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Select a task
      const taskOption = screen.getByTestId('toolbox-item-new-task');
      await user.click(taskOption);

      // Verify correct groupIndex (0) and taskIndex (1)
      await waitFor(() => {
        expect(onReplaceTaskFromToolbox).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'new-task' }),
          0, // groupIndex
          1 // taskIndex
        );
      });
    });
  });

  describe('Replace Task State Management', () => {
    it('should close replace task toolbox after task selection', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const taskOptions: ListItem<StageTaskItem>[] = [
        { id: 'new-task', name: 'New Task', data: { id: 'new-task', label: 'New Task' } },
      ];

      renderStageNode({ onReplaceTaskFromToolbox, taskOptions });

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Select a task
      const taskOption = screen.getByTestId('toolbox-item-new-task');
      await user.click(taskOption);

      // Toolbox should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('toolbox')).not.toBeInTheDocument();
      });
    });

    it('should close replace task toolbox when close button is clicked', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      renderStageNode({ onReplaceTaskFromToolbox });

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Click close button
      const closeButton = screen.getByTestId('toolbox-close');
      await user.click(closeButton);

      // Toolbox should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('toolbox')).not.toBeInTheDocument();
      });
    });

    it('should reset replace task state when node is deselected', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const { rerender } = renderStageNode({ onReplaceTaskFromToolbox, selected: true });

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Deselect the node
      rerender(
        <ReactFlowProvider>
          <StageNode {...defaultProps} {...{ onReplaceTaskFromToolbox, selected: false }} />
        </ReactFlowProvider>
      );

      // Toolbox should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('toolbox')).not.toBeInTheDocument();
      });
    });

    it('should reset both add task and replace task states when node is deselected', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const onAddTaskFromToolbox = vi.fn();
      const { rerender } = renderStageNode({
        onReplaceTaskFromToolbox,
        onAddTaskFromToolbox,
        selected: true,
      });

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Deselect the node
      rerender(
        <ReactFlowProvider>
          <StageNode
            {...defaultProps}
            {...{ onReplaceTaskFromToolbox, onAddTaskFromToolbox, selected: false }}
          />
        </ReactFlowProvider>
      );

      // Both toolboxes should be closed
      await waitFor(() => {
        const toolboxes = screen.queryAllByTestId('toolbox');
        expect(toolboxes).toHaveLength(0);
      });
    });
  });

  describe('Replace Task with Task State Reference', () => {
    it('should use ref for taskStateReference instead of state', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      const tasks: StageTaskItem[][] = [
        [createTask('task-1', 'Task 1')],
        [createTask('task-2', 'Task 2')],
      ];
      const taskOptions: ListItem<StageTaskItem>[] = [
        { id: 'new-task', name: 'New Task', data: { id: 'new-task', label: 'New Task' } },
      ];

      renderStageNode({
        onReplaceTaskFromToolbox,
        taskOptions,
        stageDetails: {
          ...defaultProps.stageDetails,
          tasks,
        },
      });

      // Open menu for task-2 (groupIndex: 1, taskIndex: 0)
      const taskMenuButton = screen.getByTestId('task-menu-button-task-2');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-2-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        expect(screen.getByTestId('toolbox')).toBeInTheDocument();
      });

      // Select a task
      const taskOption = screen.getByTestId('toolbox-item-new-task');
      await user.click(taskOption);

      // Verify correct indices are passed (groupIndex: 1, taskIndex: 0)
      await waitFor(() => {
        expect(onReplaceTaskFromToolbox).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'new-task' }),
          1, // groupIndex
          0 // taskIndex
        );
      });
    });
  });

  describe('Replace Task Panel Rendering', () => {
    it('should render FloatingCanvasPanel for replace task when onTaskReplace is provided', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      renderStageNode({ onReplaceTaskFromToolbox });

      // Initially, panel should not be visible
      expect(screen.queryByTestId('floating-canvas-panel')).not.toBeInTheDocument();

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      // Panel should be visible
      await waitFor(() => {
        expect(screen.getByTestId('floating-canvas-panel')).toBeInTheDocument();
      });
    });

    it('should not render replace task FloatingCanvasPanel when onTaskReplace is not provided', () => {
      renderStageNode({ onReplaceTaskFromToolbox: undefined });

      // Panel should not exist
      const panels = screen.queryAllByTestId('floating-canvas-panel');
      // Only add task panel might exist if onAddTaskFromToolbox is provided
      expect(panels.length).toBeLessThanOrEqual(1);
    });
  });
});

describe('StageNode - DnD in read-only mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tasks: StageTaskItem[][] = [[createTask('task-1')], [createTask('task-2')]];

  it('disables task drag when isReadOnly is true', () => {
    renderStageNode({
      stageDetails: { ...defaultProps.stageDetails, tasks, isReadOnly: true },
      onTaskReorder: vi.fn(),
    });

    expect(screen.getByTestId('draggable-task-task-1')).toHaveAttribute(
      'data-drag-disabled',
      'true'
    );
    expect(screen.getByTestId('draggable-task-task-2')).toHaveAttribute(
      'data-drag-disabled',
      'true'
    );
  });

  it('enables task drag when isReadOnly is false and onTaskReorder is provided', () => {
    renderStageNode({
      stageDetails: { ...defaultProps.stageDetails, tasks },
      onTaskReorder: vi.fn(),
    });

    expect(screen.getByTestId('draggable-task-task-1')).toHaveAttribute(
      'data-drag-disabled',
      'false'
    );
  });

  it('disables task drag when onTaskReorder is not provided', () => {
    renderStageNode({
      stageDetails: { ...defaultProps.stageDetails, tasks },
      onTaskReorder: undefined,
    });

    expect(screen.getByTestId('draggable-task-task-1')).toHaveAttribute(
      'data-drag-disabled',
      'true'
    );
  });
});

describe('StageNode - hideParallelOptions', () => {
  it('should show parallel options when hideParallelOptions is not set', async () => {
    const user = userEvent.setup();
    const onTaskGroupModification = vi.fn();
    const tasks: StageTaskItem[][] = [
      [createTask('task-1', 'Task 1')],
      [createTask('task-2', 'Task 2')],
      [createTask('task-3', 'Task 3')],
    ];

    renderStageNode({
      onTaskGroupModification,
      stageDetails: { ...defaultProps.stageDetails, tasks },
    });

    await user.click(screen.getByTestId('task-menu-button-task-2'));

    const menuItems = screen.getByTestId('task-menu-items-task-2');
    expect(menuItems.querySelector('[data-testid="menu-item-task-2-move-up"]')).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-move-down"]')
    ).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-group-with-up"]')
    ).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-group-with-down"]')
    ).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-remove-task"]')
    ).toBeInTheDocument();
  });

  it('should hide parallel options but keep move and delete when hideParallelOptions is true', async () => {
    const user = userEvent.setup();
    const onTaskGroupModification = vi.fn();
    const tasks: StageTaskItem[][] = [
      [createTask('task-1', 'Task 1')],
      [createTask('task-2', 'Task 2')],
      [createTask('task-3', 'Task 3')],
    ];

    renderStageNode({
      onTaskGroupModification,
      hideParallelOptions: true,
      stageDetails: { ...defaultProps.stageDetails, tasks },
    });

    await user.click(screen.getByTestId('task-menu-button-task-2'));

    const menuItems = screen.getByTestId('task-menu-items-task-2');
    expect(menuItems.querySelector('[data-testid="menu-item-task-2-move-up"]')).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-move-down"]')
    ).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-remove-task"]')
    ).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-group-with-up"]')
    ).not.toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-2-group-with-down"]')
    ).not.toBeInTheDocument();
  });

  it('should hide ungroup/split options for parallel groups when hideParallelOptions is true', async () => {
    const user = userEvent.setup();
    const onTaskGroupModification = vi.fn();
    const tasks: StageTaskItem[][] = [
      [createTask('task-1', 'Task 1'), createTask('task-2', 'Task 2')], // parallel group
      [createTask('task-3', 'Task 3')],
    ];

    renderStageNode({
      onTaskGroupModification,
      hideParallelOptions: true,
      stageDetails: { ...defaultProps.stageDetails, tasks },
    });

    await user.click(screen.getByTestId('task-menu-button-task-1'));

    const menuItems = screen.getByTestId('task-menu-items-task-1');
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-1-remove-task"]')
    ).toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-1-ungroup"]')
    ).not.toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-1-split"]')
    ).not.toBeInTheDocument();
    expect(
      menuItems.querySelector('[data-testid="menu-item-task-1-remove-group"]')
    ).not.toBeInTheDocument();
  });

  it('should show only delete for a single task when hideParallelOptions is true', async () => {
    const user = userEvent.setup();
    const onTaskGroupModification = vi.fn();
    const tasks: StageTaskItem[][] = [[createTask('task-1', 'Task 1')]];

    renderStageNode({
      onTaskGroupModification,
      hideParallelOptions: true,
      stageDetails: { ...defaultProps.stageDetails, tasks },
    });

    await user.click(screen.getByTestId('task-menu-button-task-1'));

    const menuItems = screen.getByTestId('task-menu-items-task-1');
    const buttons = menuItems.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Delete task');
  });
});

describe('StageNode - ReadOnly Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render task kebab menu when isReadOnly is true', () => {
    const onTaskGroupModification = vi.fn();
    const tasks: StageTaskItem[][] = [
      [createTask('task-1', 'Task 1')],
      [createTask('task-2', 'Task 2')],
    ];

    renderStageNode({
      onTaskGroupModification,
      stageDetails: { ...defaultProps.stageDetails, tasks, isReadOnly: true },
    });

    expect(screen.queryByTestId('task-menu-button-task-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('task-menu-button-task-2')).not.toBeInTheDocument();
  });

  it('should not render adhoc task kebab menu when isReadOnly is true', () => {
    const onTaskGroupModification = vi.fn();
    const adhocTask = createTask('adhoc-1', 'Adhoc Task 1');
    adhocTask.isAdhoc = true;
    const tasks: StageTaskItem[][] = [[adhocTask]];

    renderStageNode({
      onTaskGroupModification,
      stageDetails: { ...defaultProps.stageDetails, tasks, isReadOnly: true },
    });

    expect(screen.queryByTestId('task-menu-button-adhoc-1')).not.toBeInTheDocument();
  });
});

describe('StageNode - SLA Indicator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getSlaIndicator = () => screen.getByTestId('stage-sla-stage-1');

  it('does not render the SLA indicator when slaText is undefined', () => {
    renderStageNode({
      execution: { stageStatus: {}, taskStatus: {} },
    });

    expect(screen.queryByTestId('stage-sla-stage-1')).not.toBeInTheDocument();
  });

  it('does not render the SLA indicator when only duration is provided', () => {
    renderStageNode({
      execution: {
        stageStatus: { duration: 'Duration: 1h 30m' },
        taskStatus: {},
      },
    });

    expect(screen.queryByTestId('stage-sla-stage-1')).not.toBeInTheDocument();
  });

  it('renders slaText without an icon when slaIcon is omitted', () => {
    renderStageNode({
      execution: {
        stageStatus: { slaText: 'SLA: 10 days remaining' },
        taskStatus: {},
      },
    });

    const indicator = getSlaIndicator();
    expect(indicator).toHaveTextContent('SLA: 10 days remaining');
    expect(indicator).not.toHaveAttribute('data-sla-icon');
    expect(indicator.querySelector('svg')).toBeNull();
  });

  it('renders a warning icon and text when slaIcon is "warning"', () => {
    renderStageNode({
      execution: {
        stageStatus: { slaText: 'SLA: 1 day remaining', slaIcon: 'warning' },
        taskStatus: {},
      },
    });

    const indicator = getSlaIndicator();
    expect(indicator).toHaveTextContent('SLA: 1 day remaining');
    expect(indicator).toHaveAttribute('data-sla-icon', 'warning');
    expect(indicator.querySelector('svg')).not.toBeNull();
  });

  it('renders an error icon and text when slaIcon is "error"', () => {
    renderStageNode({
      execution: {
        stageStatus: { slaText: 'SLA: 1 day overdue', slaIcon: 'error' },
        taskStatus: {},
      },
    });

    const indicator = getSlaIndicator();
    expect(indicator).toHaveTextContent('SLA: 1 day overdue');
    expect(indicator).toHaveAttribute('data-sla-icon', 'error');
    expect(indicator.querySelector('svg')).not.toBeNull();
  });

  it('renders both duration and slaText as independent lines when both are provided', () => {
    renderStageNode({
      execution: {
        stageStatus: {
          duration: 'Duration: 1h 30m',
          slaText: 'SLA: 1 day remaining',
          slaIcon: 'warning',
        },
        taskStatus: {},
      },
    });

    expect(screen.getByText('Duration: 1h 30m')).toBeInTheDocument();
    const indicator = getSlaIndicator();
    expect(indicator).toHaveTextContent('SLA: 1 day remaining');
    expect(indicator).toHaveAttribute('data-sla-icon', 'warning');
  });
});

describe('StageNode - Status Icon', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const warningExecution = {
    stageStatus: { status: 'Warning' as const, label: 'This stage has validation warnings.' },
    taskStatus: {},
  };

  it('does not render the status icon when status is undefined', () => {
    renderStageNode({ execution: { stageStatus: {}, taskStatus: {} } });

    expect(screen.queryByTestId('stage-status-stage-1')).not.toBeInTheDocument();
  });

  it('invokes onStatusClick without propagating to onStageClick', async () => {
    const onStatusClick = vi.fn();
    const onStageClick = vi.fn();
    renderStageNode({ execution: warningExecution, onStatusClick, onStageClick });

    await userEvent.click(screen.getByTestId('stage-status-stage-1'));

    expect(onStatusClick).toHaveBeenCalledTimes(1);
    expect(onStageClick).not.toHaveBeenCalled();
  });

  it('propagates the click to onStageClick when onStatusClick is not provided', async () => {
    const onStageClick = vi.fn();
    renderStageNode({ execution: warningExecution, onStageClick });

    await userEvent.click(screen.getByTestId('stage-status-stage-1'));

    expect(onStageClick).toHaveBeenCalledTimes(1);
  });
});

describe('StageNode - Header Chips', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render chips when headerChips is undefined', () => {
    renderStageNode();
    expect(
      screen.queryByRole('button', { name: StageHeaderChipType.Entry })
    ).not.toBeInTheDocument();
  });

  it('should not render chips when headerChips is an empty array', () => {
    renderStageNode({ stageDetails: { ...defaultProps.stageDetails, headerChips: [] } });
    expect(
      screen.queryByRole('button', { name: StageHeaderChipType.Entry })
    ).not.toBeInTheDocument();
  });

  it('should render a chip for each entry in headerChips', () => {
    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [{ type: StageHeaderChipType.Entry }, { type: StageHeaderChipType.Exit }],
      },
    });

    expect(screen.getByRole('button', { name: StageHeaderChipType.Entry })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: StageHeaderChipType.Exit })).toBeInTheDocument();
  });

  it('should render chip count when count is provided', () => {
    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [{ type: StageHeaderChipType.Entry, count: 3 }],
      },
    });

    const chip = screen.getByRole('button', { name: StageHeaderChipType.Entry });
    expect(chip).toHaveTextContent('3');
  });

  it('should not render count text when count is undefined', () => {
    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [{ type: StageHeaderChipType.Exit }],
      },
    });

    const chip = screen.getByRole('button', { name: StageHeaderChipType.Exit });
    expect(chip).not.toHaveTextContent(/\d/);
  });

  it('should call chip onClick when chip is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [{ type: StageHeaderChipType.ReturnToOrigin, onClick }],
      },
    });

    await user.click(screen.getByRole('button', { name: StageHeaderChipType.ReturnToOrigin }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should use string tooltip as aria-label', () => {
    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [{ type: StageHeaderChipType.Entry, tooltip: 'Entry condition' }],
      },
    });

    expect(screen.getByRole('button', { name: 'Entry condition' })).toBeInTheDocument();
  });

  it('should fall back to chip type as aria-label when tooltip is a ReactNode', () => {
    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [{ type: StageHeaderChipType.Completion, tooltip: <span>Completion</span> }],
      },
    });

    expect(
      screen.getByRole('button', { name: StageHeaderChipType.Completion })
    ).toBeInTheDocument();
  });
});

describe('StageNode - Status Badges', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const optionalBadge = () => screen.queryByTestId('stage-optional-badge-stage-1');
  const endsCaseBadge = () => screen.queryByTestId('stage-ends-case-badge-stage-1');

  const withChips = (
    chips: { type: StageHeaderChipType; label?: string; tooltip?: string; onClick?: () => void }[]
  ) => ({
    stageDetails: { ...defaultProps.stageDetails, headerChips: chips },
  });

  it('does not render status badges by default', () => {
    renderStageNode();
    expect(optionalBadge()).not.toBeInTheDocument();
    expect(endsCaseBadge()).not.toBeInTheDocument();
  });

  it('renders the Optional badge with the default label', () => {
    renderStageNode(withChips([{ type: StageHeaderChipType.Optional }]));
    const badge = optionalBadge();
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Optional');
    expect(endsCaseBadge()).not.toBeInTheDocument();
  });

  it('renders the Ends case badge with the default label', () => {
    renderStageNode(withChips([{ type: StageHeaderChipType.EndsCase }]));
    const badge = endsCaseBadge();
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Ends case');
    expect(optionalBadge()).not.toBeInTheDocument();
  });

  it('renders both status badges when both chips are present', () => {
    renderStageNode(
      withChips([{ type: StageHeaderChipType.Optional }, { type: StageHeaderChipType.EndsCase }])
    );
    expect(optionalBadge()).toBeInTheDocument();
    expect(endsCaseBadge()).toBeInTheDocument();
  });

  it('uses consumer-supplied chip labels when provided', () => {
    renderStageNode(
      withChips([
        { type: StageHeaderChipType.Optional, label: 'Opcional' },
        { type: StageHeaderChipType.EndsCase, label: 'Finaliza caso' },
      ])
    );
    expect(optionalBadge()).toHaveTextContent('Opcional');
    expect(endsCaseBadge()).toHaveTextContent('Finaliza caso');
  });

  it('falls back to the default label when an empty label is supplied', () => {
    renderStageNode(withChips([{ type: StageHeaderChipType.Optional, label: '' }]));
    expect(optionalBadge()).toHaveTextContent('Optional');
  });

  it('renders an interactive button when an onClick is provided', () => {
    renderStageNode(withChips([{ type: StageHeaderChipType.Optional, onClick: vi.fn() }]));
    expect(optionalBadge()?.tagName).toBe('BUTTON');
  });

  it('renders a non-interactive span when no onClick is provided', () => {
    renderStageNode(withChips([{ type: StageHeaderChipType.Optional }]));
    expect(optionalBadge()?.tagName).toBe('SPAN');
  });

  it('calls the chip onClick when the badge is clicked', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderStageNode(withChips([{ type: StageHeaderChipType.EndsCase, onClick }]));

    await user.click(endsCaseBadge() as HTMLElement);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders status badges alongside SLA text and interactive chips', () => {
    renderStageNode({
      stageDetails: {
        ...defaultProps.stageDetails,
        headerChips: [
          { type: StageHeaderChipType.Entry },
          { type: StageHeaderChipType.Optional },
          { type: StageHeaderChipType.EndsCase },
        ],
      },
      execution: {
        stageStatus: { slaText: 'SLA: 3 days' },
        taskStatus: {},
      },
    });
    expect(screen.getByTestId('stage-sla-stage-1')).toHaveTextContent('SLA: 3 days');
    expect(screen.getByRole('button', { name: StageHeaderChipType.Entry })).toBeInTheDocument();
    expect(optionalBadge()).toBeInTheDocument();
    expect(endsCaseBadge()).toBeInTheDocument();
  });
});

describe('StageNode - Add Task Button', () => {
  it('disables the add task button when loadingTaskIds is non-empty', () => {
    renderStageNode({
      onTaskAdd: vi.fn(),
      loadingTaskIds: new Set(['loading-task']),
    });

    expect(screen.getByRole('button', { name: 'Add task' })).toBeDisabled();
  });

  it('does not invoke onTaskAdd when the disabled add task button is clicked', async () => {
    const user = userEvent.setup();
    const onTaskAdd = vi.fn();
    renderStageNode({ onTaskAdd, loadingTaskIds: new Set(['loading-task']) });

    await user.click(screen.getByRole('button', { name: 'Add task' }));

    expect(onTaskAdd).not.toHaveBeenCalled();
  });

  it('enables the add task button when loadingTaskIds is empty', () => {
    renderStageNode({ onTaskAdd: vi.fn(), loadingTaskIds: new Set() });

    expect(screen.getByRole('button', { name: 'Add task' })).not.toBeDisabled();
  });
});

describe('StageNode - Stage status icon tooltip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the status icon with the status name as aria-label and tooltip when no host label is supplied', () => {
    renderStageNode({
      execution: { stageStatus: { status: 'InProgress' }, taskStatus: {} },
    });

    const statusButton = screen.getByRole('button', { name: 'In progress' });
    expect(statusButton).toBeInTheDocument();
  });

  it('uses the host-supplied error label as the aria-label so screen readers match the tooltip', () => {
    renderStageNode({
      execution: {
        stageStatus: { status: 'Failed', label: 'Activity X threw NullReferenceException' },
        taskStatus: {},
      },
    });

    expect(
      screen.getByRole('button', { name: 'Activity X threw NullReferenceException' })
    ).toBeInTheDocument();
  });

  it('uses "In progress" as the aria-label for the InProgress status', () => {
    renderStageNode({
      execution: { stageStatus: { status: 'InProgress' as const }, taskStatus: {} },
    });

    expect(screen.getByRole('button', { name: 'In progress' })).toBeInTheDocument();
  });
});

describe('StageTitleInput - input attributes', () => {
  const enterEditMode = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Test Stage' }));
    return screen.getByDisplayValue('Test Stage') as HTMLInputElement;
  };

  it('suppresses browser autocomplete on the stage title input', async () => {
    const user = userEvent.setup();
    renderStageNode({ onStageTitleChange: vi.fn() });

    const input = await enterEditMode(user);
    expect(input).toHaveAttribute('autocomplete', 'off');
  });

  it('uses a per-stage unique name derived from the stage id', async () => {
    const user = userEvent.setup();
    renderStageNode({ onStageTitleChange: vi.fn() });

    const input = await enterEditMode(user);
    expect(input).toHaveAttribute('name', 'stage-title-stage-1');
  });

  it('generates a different name for each stage so browsers do not group inputs', async () => {
    const user = userEvent.setup();
    const { unmount } = renderStageNode({ id: 'stage-a', onStageTitleChange: vi.fn() });
    let input = await enterEditMode(user);
    expect(input).toHaveAttribute('name', 'stage-title-stage-a');
    unmount();

    renderStageNode({ id: 'stage-b', onStageTitleChange: vi.fn() });
    input = await enterEditMode(user);
    expect(input).toHaveAttribute('name', 'stage-title-stage-b');
  });
});

describe('StageNode - getTaskContextMenuItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithCallback = (
    getTaskContextMenuItems?: StageNodeProps['getTaskContextMenuItems']
  ) =>
    renderStageNode({
      stageDetails: {
        label: 'Test Stage',
        tasks: [[{ id: 'task-1', label: 'Task 1' }]],
      },
      getTaskContextMenuItems,
    });

  it('appends items returned by getTaskContextMenuItems to the task menu', async () => {
    const user = userEvent.setup();
    const onCustom = vi.fn();
    renderWithCallback(() => [{ id: 'custom-action', label: 'Custom Action', onClick: onCustom }]);

    await user.click(screen.getByTestId('task-menu-button-task-1'));

    expect(screen.getByTestId('menu-item-task-1-custom-action')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-task-1-custom-action')).toHaveTextContent('Custom Action');
  });

  it('passes the task and group context to the callback', async () => {
    const user = userEvent.setup();
    const getTaskContextMenuItems = vi.fn().mockReturnValue([]);
    renderStageNode({
      stageDetails: {
        label: 'Test Stage',
        tasks: [[{ id: 'task-a', label: 'Task A' }]],
      },
      onReplaceTaskFromToolbox: vi.fn(), // ensure the menu renders
      getTaskContextMenuItems,
    });

    await user.click(screen.getByTestId('task-menu-button-task-a'));

    expect(getTaskContextMenuItems).toHaveBeenCalledWith({
      task: expect.objectContaining({ id: 'task-a', label: 'Task A' }),
      taskGroupType: 'sequential',
      isParallel: false,
    });
  });

  it('does not render the task menu trigger when the callback returns an empty array and no other actions are provided', () => {
    renderWithCallback(() => []);

    expect(screen.queryByTestId('task-menu-button-task-1')).not.toBeInTheDocument();
  });

  it('does not render the task menu trigger when the callback returns undefined and no other actions are provided', () => {
    renderWithCallback(() => undefined);

    expect(screen.queryByTestId('task-menu-button-task-1')).not.toBeInTheDocument();
  });

  it('invokes the item onClick when the menu item is clicked', async () => {
    const user = userEvent.setup();
    const onCustom = vi.fn();
    renderWithCallback(() => [
      { id: 'go-to-definition', label: 'Go to definition', onClick: onCustom },
    ]);

    await user.click(screen.getByTestId('task-menu-button-task-1'));
    await user.click(screen.getByTestId('menu-item-task-1-go-to-definition'));

    expect(onCustom).toHaveBeenCalledTimes(1);
  });
});

// Sequential tasks render through DraggableTask, which is mocked in this suite
// (see vi.mock('./DraggableTask') above), so the real breakpoint dot cannot be
// asserted here for that path. The sequential path is covered against the real
// component in DraggableTask.test.tsx; the ad hoc and event-driven paths use the
// real task components and are verified below.
describe('StageNode - Breakpoints on adhoc and event-driven tasks', () => {
  it('renders a breakpoint marker on an armed adhoc task', () => {
    renderStageNode({
      stageDetails: {
        label: 'Test Stage',
        isReadOnly: true,
        tasks: [[{ id: 'adhoc-1', label: 'Adhoc Task', isAdhoc: true }]],
      },
      execution: {
        stageStatus: {},
        taskStatus: { 'adhoc-1': { breakpoint: true } },
      },
    });

    expect(screen.getByTestId('stage-task-breakpoint-adhoc-1')).toBeInTheDocument();
  });

  it('renders a breakpoint marker on an armed event-driven task', () => {
    renderStageNode({
      stageDetails: {
        label: 'Test Stage',
        isReadOnly: true,
        tasks: [[{ id: 'evt-1', label: 'Event Task', taskGroupType: 'event-driven' }]],
      },
      execution: {
        stageStatus: {},
        taskStatus: { 'evt-1': { breakpoint: true } },
      },
    });

    expect(screen.getByTestId('stage-task-breakpoint-evt-1')).toBeInTheDocument();
  });

  it('does not render a breakpoint marker on an unarmed adhoc task', () => {
    renderStageNode({
      stageDetails: {
        label: 'Test Stage',
        isReadOnly: true,
        tasks: [[{ id: 'adhoc-1', label: 'Adhoc Task', isAdhoc: true }]],
      },
      execution: {
        stageStatus: {},
        taskStatus: {},
      },
    });

    expect(screen.queryByTestId('stage-task-breakpoint-adhoc-1')).not.toBeInTheDocument();
  });
});
