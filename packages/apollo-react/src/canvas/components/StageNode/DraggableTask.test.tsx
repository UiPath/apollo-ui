import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { NodeMenuItem } from '../NodeContextMenu';
import { DraggableTask } from './DraggableTask';
import type { DraggableTaskProps } from './DraggableTask.types';

// Mock dnd-kit
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transition: undefined,
    transform: null,
    isDragging: false,
  }),
}));

const createTask = (id: string, label?: string) => ({
  id,
  label: label ?? `Task ${id}`,
});

const createMenuItems = (onRemoveClick: () => void): NodeMenuItem[] => [
  {
    id: 'move-up',
    label: 'Move Up',
    onClick: vi.fn(),
  },
  {
    id: 'move-down',
    label: 'Move Down',
    onClick: vi.fn(),
  },
  {
    type: 'divider' as const,
  },
  {
    id: 'remove-task',
    label: 'Remove task from stage',
    onClick: onRemoveClick,
  },
];

const defaultProps: DraggableTaskProps = {
  task: createTask('task-1', 'Test Task'),
  taskExecution: undefined,
  isSelected: false,
  isParallel: false,
  contextMenuItems: [],
  onTaskClick: vi.fn(),
  isDragDisabled: false,
  zoom: 1,
};

describe('DraggableTask', () => {
  describe('Menu Button Rendering', () => {
    it('renders menu button with correct testid when onMenuOpen is provided', () => {
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask {...defaultProps} onMenuOpen={onMenuOpen} contextMenuItems={menuItems} />
      );

      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      expect(menuButton).toBeInTheDocument();
    });

    it('renders menu button when contextMenuItems are provided', () => {
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(<DraggableTask {...defaultProps} contextMenuItems={menuItems} />);

      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      expect(menuButton).toBeInTheDocument();
    });

    it('does not render menu button when contextMenuItems is empty and onMenuOpen is not provided', () => {
      render(<DraggableTask {...defaultProps} contextMenuItems={[]} />);

      const menuButton = screen.queryByTestId('stage-task-menu-task-1');
      expect(menuButton).not.toBeInTheDocument();
    });

    it('renders menu button with icon', () => {
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask {...defaultProps} onMenuOpen={onMenuOpen} contextMenuItems={menuItems} />
      );

      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      expect(menuButton).toBeInTheDocument();
      // Button should be rendered as a button element
      expect(menuButton.tagName).toBe('BUTTON');
    });
  });

  describe('Menu Opening and Closing', () => {
    it('opens menu when button is clicked', async () => {
      const user = userEvent.setup();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask {...defaultProps} onMenuOpen={onMenuOpen} contextMenuItems={menuItems} />
      );

      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      // Menu should open - check for menu items
      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
      });
    });

    it('does not trigger task click when menu button is clicked', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask
          {...defaultProps}
          onTaskClick={onTaskClick}
          onMenuOpen={onMenuOpen}
          contextMenuItems={menuItems}
        />
      );

      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      // Task click should NOT be called
      expect(onTaskClick).not.toHaveBeenCalled();
    });

    it('prevents task selection when menu is open', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask
          {...defaultProps}
          onTaskClick={onTaskClick}
          onMenuOpen={onMenuOpen}
          contextMenuItems={menuItems}
        />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
      });

      // Try to click on task
      const task = screen.getByTestId('stage-task-task-1');
      await user.click(task);

      // Task click should still not be called (menu is open)
      expect(onTaskClick).not.toHaveBeenCalled();
    });

    it('prevents task selection when menu is open', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask
          {...defaultProps}
          onTaskClick={onTaskClick}
          onMenuOpen={onMenuOpen}
          contextMenuItems={menuItems}
        />
      );

      // Open menu first
      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
      });

      // Try to click on task while menu is open
      const task = screen.getByTestId('stage-task-task-1');
      await user.click(task);

      // Task click should not be called (menu is open)
      expect(onTaskClick).not.toHaveBeenCalled();
    });
  });

  describe('Menu Item Interaction', () => {
    it('triggers menu item onClick when menu item is clicked', async () => {
      const user = userEvent.setup();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask {...defaultProps} onMenuOpen={onMenuOpen} contextMenuItems={menuItems} />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Remove task from stage')).toBeInTheDocument();
      });

      // Click remove menu item
      const removeMenuItem = screen.getByText('Remove task from stage');
      await user.click(removeMenuItem);

      // onRemove should be called
      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('closes menu after menu item is clicked', async () => {
      const user = userEvent.setup();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask {...defaultProps} onMenuOpen={onMenuOpen} contextMenuItems={menuItems} />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
      });

      // Click a menu item
      const moveUpItem = screen.getByText('Move Up');
      await user.click(moveUpItem);

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByText('Move Up')).not.toBeInTheDocument();
      });
    });

    it('includes divider in menu items', async () => {
      const user = userEvent.setup();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask {...defaultProps} onMenuOpen={onMenuOpen} contextMenuItems={menuItems} />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
      });

      // Check that menu items before and after divider exist
      expect(screen.getByText('Move Down')).toBeInTheDocument();
      expect(screen.getByText('Remove task from stage')).toBeInTheDocument();
    });
  });

  describe('Task Click Behavior', () => {
    it('calls onTaskClick when task is clicked and no menus are open', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();

      render(<DraggableTask {...defaultProps} onTaskClick={onTaskClick} />);

      const task = screen.getByTestId('stage-task-task-1');
      await user.click(task);

      expect(onTaskClick).toHaveBeenCalledTimes(1);
      expect(onTaskClick).toHaveBeenCalledWith(expect.any(Object), 'task-1');
    });

    it('allows task click after menu is closed', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <DraggableTask
          {...defaultProps}
          onTaskClick={onTaskClick}
          onMenuOpen={onMenuOpen}
          contextMenuItems={menuItems}
        />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-task-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Move Up')).toBeInTheDocument();
      });

      // Click a menu item to close it
      const moveUpItem = screen.getByText('Move Up');
      await user.click(moveUpItem);

      await waitFor(() => {
        expect(screen.queryByText('Move Up')).not.toBeInTheDocument();
      });

      // Now task click should work
      const task = screen.getByTestId('stage-task-task-1');
      await user.click(task);

      expect(onTaskClick).toHaveBeenCalledWith(expect.any(Object), 'task-1');
    });
  });

  describe('Task Rendering', () => {
    it('renders task label', () => {
      render(<DraggableTask {...defaultProps} />);

      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('renders with selected state', () => {
      const { container } = render(<DraggableTask {...defaultProps} isSelected={true} />);

      const task = screen.getByTestId('stage-task-task-1');
      expect(task).toBeInTheDocument();
      // The task should be rendered (selected state is applied via styled-components)
      expect(container.querySelector('[data-testid="stage-task-task-1"]')).toBeInTheDocument();
    });

    it('renders with parallel state', () => {
      const { container } = render(<DraggableTask {...defaultProps} isParallel={true} />);

      const task = screen.getByTestId('stage-task-task-1');
      expect(task).toBeInTheDocument();
      // The task should be rendered (parallel state is applied via styled-components)
      expect(container.querySelector('[data-testid="stage-task-task-1"]')).toBeInTheDocument();
    });
  });
});
