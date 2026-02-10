import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ListItem } from '../Toolbox';
import { StageNode } from './StageNode';
import type { StageNodeProps, StageTaskItem } from './StageNode.types';

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
    open,
    children,
    onClose,
  }: {
    open: boolean;
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
    onItemSelect,
    onClose,
  }: {
    title: string;
    initialItems: ListItem[];
    onItemSelect?: (item: ListItem) => void;
    onClose?: () => void;
  }) => (
    <div data-testid="toolbox">
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
    onMenuOpen,
    contextMenuItems,
  }: {
    task: StageTaskItem;
    onMenuOpen?: () => void;
    contextMenuItems?: Array<{ id: string; label: string; onClick: () => void }>;
  }) => (
    <div data-testid={`draggable-task-${task.id}`}>
      <div data-testid={`task-label-${task.id}`}>{task.label}</div>
      {onMenuOpen && (
        <button type="button" data-testid={`task-menu-button-${task.id}`} onClick={onMenuOpen}>
          Open Menu
        </button>
      )}
      {contextMenuItems && (
        <div data-testid={`task-menu-items-${task.id}`}>
          {contextMenuItems.map((item, index) => (
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
  ),
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

// Mock useNodeSelection
vi.mock('../NodePropertiesPanel/hooks', () => ({
  useNodeSelection: () => ({
    setSelectedNodeId: vi.fn(),
  }),
}));

// Mock useViewport
vi.mock('@uipath/apollo-react/canvas/xyflow/react', async () => {
  const actual = await vi.importActual('@uipath/apollo-react/canvas/xyflow/react');
  return {
    ...actual,
    useViewport: () => ({ zoom: 1 }),
    useStore: () => vi.fn(() => null),
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
} as StageNodeProps & { width?: number };

const renderStageNode = (props: Partial<StageNodeProps> = {}) => {
  return render(
    <ReactFlowProvider>
      <StageNode {...defaultProps} {...props} />
    </ReactFlowProvider>
  );
};

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
      expect(replaceMenuItem).toHaveTextContent('Replace Task');
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
      expect(buttons[0]).toHaveTextContent('Replace Task');
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

    it('should use custom replaceTaskLabel when provided', async () => {
      const user = userEvent.setup();
      const onReplaceTaskFromToolbox = vi.fn();
      renderStageNode({
        onReplaceTaskFromToolbox,
        replaceTaskLabel: 'Custom Replace Label',
      });

      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      await user.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      await user.click(replaceMenuItem);

      await waitFor(() => {
        const toolboxTitle = screen.getByTestId('toolbox-title');
        expect(toolboxTitle).toHaveTextContent('Custom Replace Label');
      });
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
      const onReplaceTaskFromToolbox = vi.fn();
      const { rerender } = renderStageNode({ onReplaceTaskFromToolbox, selected: true });

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      userEvent.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      userEvent.click(replaceMenuItem);

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
      const onReplaceTaskFromToolbox = vi.fn();
      const onAddTaskFromToolbox = vi.fn();
      const { rerender } = renderStageNode({
        onReplaceTaskFromToolbox,
        onAddTaskFromToolbox,
        selected: true,
      });

      // Open replace task toolbox
      const taskMenuButton = screen.getByTestId('task-menu-button-task-1');
      userEvent.click(taskMenuButton);

      const replaceMenuItem = screen.getByTestId('menu-item-task-1-replace-task');
      userEvent.click(replaceMenuItem);

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

describe('StageNode - Add Task Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show the add icon by default when addTaskLoading is not set', () => {
    const onTaskAdd = vi.fn();
    renderStageNode({ onTaskAdd });

    // The add icon should be present, no spinner
    expect(screen.queryByTestId('ap-circular-progress')).not.toBeInTheDocument();
  });

  it('should show a loading spinner instead of the add icon when addTaskLoading is true', () => {
    const onTaskAdd = vi.fn();
    renderStageNode({ onTaskAdd, addTaskLoading: true });

    expect(screen.getByTestId('ap-circular-progress')).toBeInTheDocument();
  });

  it('should disable the add task button when addTaskLoading is true', () => {
    const onTaskAdd = vi.fn();
    renderStageNode({ onTaskAdd, addTaskLoading: true });

    const spinner = screen.getByTestId('ap-circular-progress');
    // The disabled button is the closest button ancestor of the spinner
    const button = spinner.closest('button');
    expect(button).toBeDisabled();
  });

  it('should not call onTaskAdd when button is disabled while loading', () => {
    const onTaskAdd = vi.fn();
    renderStageNode({ onTaskAdd, addTaskLoading: true });

    const spinner = screen.getByTestId('ap-circular-progress');
    const button = spinner.closest('button') as HTMLButtonElement;

    // Button is disabled and has pointer-events: none, preventing any clicks
    expect(button).toBeDisabled();
    button.click();
    expect(onTaskAdd).not.toHaveBeenCalled();
  });

  it('should show the add icon when addTaskLoading is false', () => {
    const onTaskAdd = vi.fn();
    renderStageNode({ onTaskAdd, addTaskLoading: false });

    expect(screen.queryByTestId('ap-circular-progress')).not.toBeInTheDocument();
  });

  it('should switch from spinner back to add icon when addTaskLoading changes to false', () => {
    const onTaskAdd = vi.fn();
    const { rerender } = renderStageNode({ onTaskAdd, addTaskLoading: true });

    expect(screen.getByTestId('ap-circular-progress')).toBeInTheDocument();

    rerender(
      <ReactFlowProvider>
        <StageNode {...defaultProps} onTaskAdd={onTaskAdd} addTaskLoading={false} />
      </ReactFlowProvider>
    );

    expect(screen.queryByTestId('ap-circular-progress')).not.toBeInTheDocument();
  });
});
