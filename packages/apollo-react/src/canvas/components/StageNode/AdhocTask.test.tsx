import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { NodeMenuItem } from '../NodeContextMenu';
import { AdhocTaskItem } from './AdhocTask';
import type { StageTaskItem } from './StageNode.types';

const createTask = (id: string, label?: string): StageTaskItem => ({
  id,
  label: label ?? `Task ${id}`,
  isAdhoc: true,
});

const createMenuItems = (onRemoveClick: () => void): NodeMenuItem[] => [
  {
    id: 'replace-task',
    label: 'Replace task',
    onClick: vi.fn(),
  },
  {
    type: 'divider' as const,
  },
  {
    id: 'remove-task',
    label: 'Delete task',
    onClick: onRemoveClick,
  },
];

describe('AdhocTaskItem', () => {
  const defaultProps = {
    task: createTask('adhoc-1', 'Adhoc Task'),
    taskExecution: undefined,
    isSelected: false,
    contextMenuItems: [] as NodeMenuItem[],
    onTaskClick: vi.fn(),
  };

  describe('Rendering', () => {
    it('renders task with correct testid', () => {
      render(<AdhocTaskItem {...defaultProps} />);

      expect(screen.getByTestId('stage-task-adhoc-1')).toBeInTheDocument();
    });

    it('renders task label', () => {
      render(<AdhocTaskItem {...defaultProps} />);

      expect(screen.getByText('Adhoc Task')).toBeInTheDocument();
    });

    it('renders with selected state', () => {
      render(<AdhocTaskItem {...defaultProps} isSelected={true} />);

      expect(screen.getByTestId('stage-task-adhoc-1')).toBeInTheDocument();
    });
  });

  describe('Task Click Behavior', () => {
    it('calls onTaskClick when task is clicked', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();

      render(<AdhocTaskItem {...defaultProps} onTaskClick={onTaskClick} />);

      const task = screen.getByTestId('stage-task-adhoc-1');
      await user.click(task);

      expect(onTaskClick).toHaveBeenCalledTimes(1);
      expect(onTaskClick).toHaveBeenCalledWith(expect.any(Object), 'adhoc-1');
    });

    it('prevents task click when menu is open', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <AdhocTaskItem {...defaultProps} onTaskClick={onTaskClick} contextMenuItems={menuItems} />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-adhoc-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Replace task')).toBeInTheDocument();
      });

      // Try to click the task while menu is open
      const task = screen.getByTestId('stage-task-adhoc-1');
      await user.click(task);

      expect(onTaskClick).not.toHaveBeenCalled();
    });

    it('allows task click after menu is closed', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <AdhocTaskItem {...defaultProps} onTaskClick={onTaskClick} contextMenuItems={menuItems} />
      );

      // Open menu
      const menuButton = screen.getByTestId('stage-task-menu-adhoc-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Replace task')).toBeInTheDocument();
      });

      // Click a menu item to close it
      const replaceItem = screen.getByText('Replace task');
      await user.click(replaceItem);

      await waitFor(() => {
        expect(screen.queryByText('Replace task')).not.toBeInTheDocument();
      });

      // Now task click should work
      const task = screen.getByTestId('stage-task-adhoc-1');
      await user.click(task);

      expect(onTaskClick).toHaveBeenCalledWith(expect.any(Object), 'adhoc-1');
    });
  });

  describe('Play Button', () => {
    it('does not render play button when onTaskPlay is not provided', () => {
      render(<AdhocTaskItem {...defaultProps} />);

      expect(screen.queryByTestId('stage-task-play-adhoc-1')).not.toBeInTheDocument();
    });

    it('renders play button when onTaskPlay is provided', () => {
      const onTaskPlay = vi.fn().mockResolvedValue(undefined);

      render(<AdhocTaskItem {...defaultProps} onTaskPlay={onTaskPlay} />);

      expect(screen.getByTestId('stage-task-play-adhoc-1')).toBeInTheDocument();
    });

    it('calls onTaskPlay when play button is clicked', async () => {
      const user = userEvent.setup();
      const onTaskPlay = vi.fn().mockResolvedValue(undefined);

      render(<AdhocTaskItem {...defaultProps} onTaskPlay={onTaskPlay} />);

      const playButton = screen.getByTestId('stage-task-play-adhoc-1');
      await user.click(playButton);

      expect(onTaskPlay).toHaveBeenCalledWith('adhoc-1');
    });

    it('does not trigger task click when play button is clicked', async () => {
      const user = userEvent.setup();
      const onTaskClick = vi.fn();
      const onTaskPlay = vi.fn().mockResolvedValue(undefined);

      render(<AdhocTaskItem {...defaultProps} onTaskClick={onTaskClick} onTaskPlay={onTaskPlay} />);

      const playButton = screen.getByTestId('stage-task-play-adhoc-1');
      await user.click(playButton);

      expect(onTaskClick).not.toHaveBeenCalled();
    });

    it('shows loading indicator while task play is in progress', async () => {
      const user = userEvent.setup();
      let resolvePlay: () => void;
      const onTaskPlay = vi.fn(
        () =>
          new Promise<void>((resolve) => {
            resolvePlay = resolve;
          })
      );

      render(<AdhocTaskItem {...defaultProps} onTaskPlay={onTaskPlay} />);

      const playButton = screen.getByTestId('stage-task-play-adhoc-1');
      await user.click(playButton);

      // Should show circular progress while loading
      await waitFor(() => {
        expect(screen.getByTestId('ap-circular-progress')).toBeInTheDocument();
      });

      // Resolve the play promise
      resolvePlay!();

      // Loading indicator should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('ap-circular-progress')).not.toBeInTheDocument();
      });
    });

    it('recovers from play error and hides loading indicator', async () => {
      const user = userEvent.setup();
      const onTaskPlay = vi.fn().mockRejectedValue(new Error('play failed'));

      render(<AdhocTaskItem {...defaultProps} onTaskPlay={onTaskPlay} />);

      const playButton = screen.getByTestId('stage-task-play-adhoc-1');
      await user.click(playButton);

      // Loading should eventually clear after error
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Context Menu', () => {
    it('renders menu button when contextMenuItems are provided', () => {
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(<AdhocTaskItem {...defaultProps} contextMenuItems={menuItems} />);

      expect(screen.getByTestId('stage-task-menu-adhoc-1')).toBeInTheDocument();
    });

    it('does not render menu button when contextMenuItems is empty', () => {
      render(<AdhocTaskItem {...defaultProps} contextMenuItems={[]} />);

      expect(screen.queryByTestId('stage-task-menu-adhoc-1')).not.toBeInTheDocument();
    });

    it('opens menu when button is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(<AdhocTaskItem {...defaultProps} contextMenuItems={menuItems} />);

      const menuButton = screen.getByTestId('stage-task-menu-adhoc-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Replace task')).toBeInTheDocument();
        expect(screen.getByText('Delete task')).toBeInTheDocument();
      });
    });

    it('triggers menu item onClick when clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(<AdhocTaskItem {...defaultProps} contextMenuItems={menuItems} />);

      const menuButton = screen.getByTestId('stage-task-menu-adhoc-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Delete task')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete task'));

      expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it('closes menu after menu item is clicked', async () => {
      const user = userEvent.setup();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(<AdhocTaskItem {...defaultProps} contextMenuItems={menuItems} />);

      const menuButton = screen.getByTestId('stage-task-menu-adhoc-1');
      await user.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText('Delete task')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Delete task'));

      await waitFor(() => {
        expect(screen.queryByText('Delete task')).not.toBeInTheDocument();
      });
    });
  });

  describe('onMenuOpen callback', () => {
    it('calls onMenuOpen when menu is opened', async () => {
      const user = userEvent.setup();
      const onMenuOpen = vi.fn();
      const onRemove = vi.fn();
      const menuItems = createMenuItems(onRemove);

      render(
        <AdhocTaskItem {...defaultProps} contextMenuItems={menuItems} onMenuOpen={onMenuOpen} />
      );

      const menuButton = screen.getByTestId('stage-task-menu-adhoc-1');
      await user.click(menuButton);

      expect(onMenuOpen).toHaveBeenCalled();
    });
  });
});
