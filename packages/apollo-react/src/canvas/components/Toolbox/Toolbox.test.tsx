import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, type UserEvent, userEvent } from '../../utils/testing';
import type { ListItem } from './ListView';
import { Toolbox } from './Toolbox';

describe('Toolbox', () => {
  const mockItems: ListItem[] = [
    {
      id: 'item-1',
      name: 'Item 1',
      data: { value: 'data-1' },
      icon: { name: 'star' },
    },
    {
      id: 'item-2',
      name: 'Item 2',
      data: { value: 'data-2' },
      icon: { name: 'favorite' },
      children: [
        {
          id: 'child-1',
          name: 'Child 1',
          data: { value: 'child-data-1' },
          icon: { name: 'child_care' },
        },
      ],
    },
  ];

  const defaultProps = {
    title: 'Test Toolbox',
    initialItems: mockItems,
    onClose: vi.fn(),
    onItemSelect: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render title correctly', () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.getByText('Test Toolbox')).toBeInTheDocument();
    });

    it('should render search box', () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument();
    });

    it('should render all items in ListView', () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should pass loading state to ListView', () => {
      render(<Toolbox {...defaultProps} loading={true} />);

      // ListView items should be disabled when loading
      const items = screen.getAllByRole('option');

      for (const item of items) {
        expect(item).toBeDisabled();
      }
    });
  });

  describe('Navigation', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should not show back button initially', () => {
      render(<Toolbox {...defaultProps} />);

      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    it('should navigate to children when item with children is clicked', async () => {
      render(<Toolbox {...defaultProps} />);

      await user.click(screen.getByText('Item 2'));

      // Should show child item
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      // Should update title
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      // Parent items should not be visible
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('should show back button after navigating to children', async () => {
      render(<Toolbox {...defaultProps} />);

      await user.click(screen.getByText('Item 2'));

      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('should navigate back to parent when back button is clicked', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to children
      await user.click(screen.getByText('Item 2'));

      // Click back button
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Should show parent items again
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      // Should update title back to original
      expect(screen.getByText('Test Toolbox')).toBeInTheDocument();
    });

    it('should call onItemSelect when item without children is clicked', async () => {
      const onItemSelect = vi.fn();
      render(<Toolbox {...defaultProps} onItemSelect={onItemSelect} />);

      await user.click(screen.getByText('Item 1'));

      expect(onItemSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'item-1',
          name: 'Item 1',
        })
      );
    });

    it('should not call onItemSelect when item with children is clicked', async () => {
      const onItemSelect = vi.fn();
      render(<Toolbox {...defaultProps} onItemSelect={onItemSelect} />);

      await user.click(screen.getByText('Item 2'));

      expect(onItemSelect).not.toHaveBeenCalled();
    });
  });

  describe('Search', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should show empty state when no items match search', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');

      await user.type(searchInput, 'NonExistent');

      expect(screen.getByText('No matching nodes found')).toBeInTheDocument();
    });

    it('should clear search when input is cleared', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');

      // Type search query
      await user.type(searchInput, '1');

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // Clear search
      await user.clear(searchInput);

      // Should show all items again
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should search nested children', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');

      await user.type(searchInput, 'Child');

      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // Should not show parent that doesn't match
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('should disable sections during search', async () => {
      const itemsWithSections: ListItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
          data: {},
          section: 'Section A',
        },
        {
          id: 'item-2',
          name: 'Item 2',
          data: {},
          section: 'Section B',
        },
      ];

      render(<Toolbox {...defaultProps} initialItems={itemsWithSections} />);

      const searchInput = screen.getByPlaceholderText('Search');

      await user.type(searchInput, 'Item');

      // Wait for search to complete
      expect(screen.getByText('Item 1')).toBeInTheDocument();

      // Sections should not be visible during search
      expect(screen.queryByText('Section A')).not.toBeInTheDocument();
      expect(screen.queryByText('Section B')).not.toBeInTheDocument();
    });

    it('should use custom onSearch function if provided', async () => {
      const onSearch = vi.fn().mockResolvedValue([
        {
          id: 'custom-result',
          name: 'Custom Result',
          data: {},
        },
      ]);

      render(<Toolbox {...defaultProps} onSearch={onSearch} />);

      const searchInput = screen.getByPlaceholderText('Search');

      await user.type(searchInput, 'custom');

      expect(screen.getByText('Custom Result')).toBeInTheDocument();
    });

    it('should clear search when Escape is pressed during search', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');

      // Type search query
      await user.type(searchInput, 'Item 1');

      expect(screen.getByText('Item 1')).toBeInTheDocument();

      // Press Escape
      await user.keyboard('{Escape}');

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });
  });

  describe('Keyboard shortcuts', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should close toolbox when Escape is pressed at root level', async () => {
      const onClose = vi.fn();
      render(<Toolbox {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('should navigate back when Escape is pressed in nested view', async () => {
      const onClose = vi.fn();
      render(<Toolbox {...defaultProps} onClose={onClose} />);

      // Navigate to children
      await user.click(screen.getByText('Item 2'));

      // Press Escape
      await user.keyboard('{Escape}');

      // Should navigate back, not close
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard navigation', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    const getActiveItem = () => document.querySelector('[aria-selected="true"]');

    it('should move focus from search to first item on ArrowDown', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toHaveFocus();

      // ArrowDown from search should highlight first item
      await user.keyboard('{ArrowDown}');

      const activeItem = getActiveItem();
      expect(activeItem).toBeInTheDocument();
      expect(activeItem).toHaveTextContent('Item 1');
    });

    it('should move focus back to search on ArrowUp from first item', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');

      // Navigate to first item
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // ArrowUp should return to search
      await user.keyboard('{ArrowUp}');
      expect(getActiveItem()).not.toBeInTheDocument();
      expect(searchInput).toHaveFocus();
    });

    it('should navigate between items with ArrowDown/ArrowUp', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to first item
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // Navigate to second item
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      // Navigate back to first item
      await user.keyboard('{ArrowUp}');
      expect(getActiveItem()).toHaveTextContent('Item 1');
    });

    it('should select item with Enter', async () => {
      const onItemSelect = vi.fn();
      render(<Toolbox {...defaultProps} onItemSelect={onItemSelect} />);

      // Navigate to first item and press Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(onItemSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'item-1', name: 'Item 1' })
      );
    });

    it('should navigate into children with Enter on item with children', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to Item 2 (has children) and press Enter
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      await user.keyboard('{Enter}');

      // Should now show children
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      // Active index should reset
      expect(getActiveItem()).not.toBeInTheDocument();
    });

    it('should jump to first item on Home', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to second item
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      // Home should jump to first item
      await user.keyboard('{Home}');
      expect(getActiveItem()).toHaveTextContent('Item 1');
    });

    it('should jump to last item on End', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to first item
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // End should jump to last item
      await user.keyboard('{End}');
      expect(getActiveItem()).toHaveTextContent('Item 2');
    });

    it('should reset active index when search query changes', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to an item
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // Type in search — focus returns to input, active index resets
      const searchInput = screen.getByPlaceholderText('Search');
      await user.click(searchInput);
      await user.type(searchInput, 'a');

      expect(getActiveItem()).not.toBeInTheDocument();
    });

    it('should reset active index when navigating into children', async () => {
      render(<Toolbox {...defaultProps} />);

      // Highlight Item 2 (has children)
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      // Click to navigate into children — active index should reset
      await user.click(screen.getByText('Item 2'));
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(getActiveItem()).not.toBeInTheDocument();
    });

    it('should skip section headers during navigation', async () => {
      const itemsWithSections: ListItem[] = [
        {
          id: 'unsectioned',
          name: 'Unsectioned Item',
          data: {},
          icon: { name: 'star' },
        },
        {
          id: 'sectioned-1',
          name: 'Sectioned Item 1',
          data: {},
          icon: { name: 'star' },
          section: 'Group A',
        },
        {
          id: 'sectioned-2',
          name: 'Sectioned Item 2',
          data: {},
          icon: { name: 'star' },
          section: 'Group A',
        },
      ];

      render(<Toolbox {...defaultProps} initialItems={itemsWithSections} />);

      // First ArrowDown: Unsectioned Item
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Unsectioned Item');

      // Second ArrowDown: should skip "Group A" header and land on Sectioned Item 1
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Sectioned Item 1');

      // Third ArrowDown: Sectioned Item 2
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Sectioned Item 2');
    });

    it('should work with ArrowDown after search filters results', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');
      await user.type(searchInput, 'Child');

      // Wait for search results
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // ArrowDown from search into filtered results
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Child 1');
    });

    it('should navigate into children with ArrowRight on item with children', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to Item 2 (has children)
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      // ArrowRight should drill into children
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('should not navigate with ArrowRight on leaf item', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to Item 1 (no children)
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // ArrowRight should do nothing
      await user.keyboard('{ArrowRight}');
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should navigate back with ArrowLeft when in nested view', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const timedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Toolbox {...defaultProps} />);

      // Navigate to Item 2 and drill in with ArrowRight
      await timedUser.keyboard('{ArrowDown}');
      await timedUser.keyboard('{ArrowDown}');
      await timedUser.keyboard('{ArrowRight}');
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // Advance past transition duration (150ms)
      await act(() => vi.advanceTimersByTimeAsync(200));

      // Highlight a child
      await timedUser.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Child 1');

      // ArrowLeft should go back to parent
      await timedUser.keyboard('{ArrowLeft}');
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should wrap to first item when ArrowDown is pressed at last item', async () => {
      render(<Toolbox {...defaultProps} />);

      // Navigate to last item (Item 2)
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      // ArrowDown at last item should wrap to first
      await user.keyboard('{ArrowDown}');
      expect(getActiveItem()).toHaveTextContent('Item 1');
    });

    it('should move focus down with Tab and up with Shift+Tab', async () => {
      render(<Toolbox {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search');
      expect(searchInput).toHaveFocus();

      // Tab from search should highlight first item
      await user.keyboard('{Tab}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // Tab should move to next item
      await user.keyboard('{Tab}');
      expect(getActiveItem()).toHaveTextContent('Item 2');

      // Shift+Tab should move back up
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(getActiveItem()).toHaveTextContent('Item 1');

      // Shift+Tab from first item should return to search
      await user.keyboard('{Shift>}{Tab}{/Shift}');
      expect(getActiveItem()).not.toBeInTheDocument();
      expect(searchInput).toHaveFocus();
    });

    it('should navigate back with ArrowLeft from empty search input in nested view', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const timedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Toolbox {...defaultProps} />);

      // Navigate into children
      await timedUser.keyboard('{ArrowDown}');
      await timedUser.keyboard('{ArrowDown}');
      await timedUser.keyboard('{ArrowRight}');
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // Advance past transition duration
      await act(() => vi.advanceTimersByTimeAsync(200));

      // Focus is on search input (activeIndex === -1), search is empty
      // ArrowLeft should navigate back
      await timedUser.keyboard('{ArrowLeft}');
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not navigate back with ArrowLeft when search has text', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const timedUser = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      render(<Toolbox {...defaultProps} />);

      // Navigate into children
      await timedUser.keyboard('{ArrowDown}');
      await timedUser.keyboard('{ArrowDown}');
      await timedUser.keyboard('{ArrowRight}');
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      // Advance past transition duration
      await act(() => vi.advanceTimersByTimeAsync(200));

      // Type in search box
      const searchInput = screen.getByPlaceholderText('Search');
      await timedUser.type(searchInput, 'Child');

      // ArrowLeft should not navigate back — allow cursor movement in search
      await timedUser.keyboard('{ArrowLeft}');
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();

      vi.useRealTimers();
    });
  });

  describe('Callbacks', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should call onBack callback when navigating back', async () => {
      const onBack = vi.fn();
      render(<Toolbox {...defaultProps} onBack={onBack} />);

      // Navigate to children
      await user.click(screen.getByText('Item 2'));

      // Click back
      await user.click(screen.getByRole('button', { name: /back/i }));

      expect(onBack).toHaveBeenCalled();
    });
  });

  describe('Smart item updates (initialItems prop changes)', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
    });

    it('should update items when at root level and initialItems change', () => {
      const initialItems: ListItem[] = [
        {
          id: 'item-1',
          name: 'Initial Item 1',
          data: {},
          icon: { name: 'star' },
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={initialItems} />);

      expect(screen.getByText('Initial Item 1')).toBeInTheDocument();

      const updatedItems: ListItem[] = [
        {
          id: 'item-1',
          name: 'Updated Item 1',
          data: {},
          icon: { name: 'star' },
        },
        {
          id: 'item-2',
          name: 'New Item 2',
          data: {},
          icon: { name: 'favorite' },
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={updatedItems} />);

      // Should show updated items
      expect(screen.getByText('Updated Item 1')).toBeInTheDocument();
      expect(screen.getByText('New Item 2')).toBeInTheDocument();
    });

    it('should preserve navigation and update children when initialItems change during nested view', async () => {
      const v1Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent v1',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-1',
              name: 'Child v1',
              data: {},
              icon: { name: 'file' },
            },
          ],
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={v1Items} />);

      // Navigate to children
      await user.click(screen.getByText('Parent v1'));
      expect(screen.getByText('Child v1')).toBeInTheDocument();
      expect(screen.getByText('Parent v1')).toBeInTheDocument(); // Title

      // Update items while in nested view
      const v2Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent v2 Updated',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-1',
              name: 'Child v2 Updated',
              data: {},
              icon: { name: 'file' },
            },
            {
              id: 'child-2',
              name: 'New Child',
              data: {},
              icon: { name: 'file' },
            },
          ],
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={v2Items} />);

      // Should still be in children view with updated data
      expect(screen.getByText('Child v2 Updated')).toBeInTheDocument();
      expect(screen.getByText('New Child')).toBeInTheDocument();
      // Title should update to new parent name
      expect(screen.getByText('Parent v2 Updated')).toBeInTheDocument();
      // Should not navigate back to root
      expect(screen.queryByText('Test Toolbox')).not.toBeInTheDocument();
    });

    it('should keep stale items when parent is removed from initialItems', async () => {
      const v1Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent 1',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-1',
              name: 'Original Child',
              data: {},
              icon: { name: 'file' },
            },
          ],
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={v1Items} />);

      // Navigate to children
      await user.click(screen.getByText('Parent 1'));
      expect(screen.getByText('Original Child')).toBeInTheDocument();

      // Update items - remove parent
      const v2Items: ListItem[] = [
        {
          id: 'parent-2',
          name: 'Different Parent',
          data: {},
          icon: { name: 'folder' },
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={v2Items} />);

      // Should keep showing original child (stale data)
      expect(screen.getByText('Original Child')).toBeInTheDocument();
      // User can still navigate back and see updated items
      await user.click(screen.getByRole('button', { name: /back/i }));
      expect(screen.getByText('Different Parent')).toBeInTheDocument();
      expect(screen.queryByText('Parent 1')).not.toBeInTheDocument();
    });

    it('should update navigation stack with refreshed parent data', async () => {
      const v1Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent v1',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-1',
              name: 'Child 1',
              data: {},
              icon: { name: 'file' },
              children: [
                {
                  id: 'grandchild-1',
                  name: 'Grandchild v1',
                  data: {},
                  icon: { name: 'file' },
                },
              ],
            },
          ],
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={v1Items} />);

      // Navigate: Root -> Parent -> Child
      await user.click(screen.getByText('Parent v1'));
      await user.click(screen.getByText('Child 1'));
      expect(screen.getByText('Grandchild v1')).toBeInTheDocument();

      // Update items while at deepest level
      const v2Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent v2 Updated',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-1',
              name: 'Child 1 Updated',
              data: {},
              icon: { name: 'file' },
              children: [
                {
                  id: 'grandchild-1',
                  name: 'Grandchild v2 Updated',
                  data: {},
                  icon: { name: 'file' },
                },
              ],
            },
          ],
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={v2Items} />);

      // Should show updated grandchild
      expect(screen.getByText('Grandchild v2 Updated')).toBeInTheDocument();

      // Navigate back once
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Should show updated child
      expect(screen.getByText('Child 1 Updated')).toBeInTheDocument();

      // Navigate back again
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Should show updated parent
      expect(screen.getByText('Parent v2 Updated')).toBeInTheDocument();
    });

    it('should handle dynamic children (function) when initialItems update', async () => {
      const dynamicChildrenFn = vi.fn().mockResolvedValue([
        {
          id: 'dynamic-child-1',
          name: 'Dynamically Loaded Child',
          data: {},
          icon: { name: 'file' },
        },
      ]);

      const v1Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent with Dynamic Children',
          data: {},
          icon: { name: 'folder' },
          children: dynamicChildrenFn,
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={v1Items} />);

      // Navigate to trigger dynamic loading
      await user.click(screen.getByText('Parent with Dynamic Children'));
      expect(dynamicChildrenFn).toHaveBeenCalledWith('parent-1', 'Parent with Dynamic Children');
      expect(screen.getByText('Dynamically Loaded Child')).toBeInTheDocument();

      // Update items - parent still has function-based children
      const v2Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent Updated',
          data: {},
          icon: { name: 'folder' },
          children: dynamicChildrenFn, // Same function reference
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={v2Items} />);

      // Should keep showing the dynamically loaded children
      // (not re-fetch since children are already loaded)
      expect(screen.getByText('Dynamically Loaded Child')).toBeInTheDocument();
      // Title should update
      expect(screen.getByText('Parent Updated')).toBeInTheDocument();
      // Should not call the function again
      expect(dynamicChildrenFn).toHaveBeenCalledTimes(1);
    });

    it('should not trigger updates when initialItems reference is the same', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
          data: {},
          icon: { name: 'star' },
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={items} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();

      // Rerender with same reference
      rerender(<Toolbox {...defaultProps} initialItems={items} />);

      // Should still show the same item (no re-render issues)
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should update items when multiple properties change at once', async () => {
      const v1Items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
          data: { value: 'v1' },
          icon: { name: 'star' },
          color: 'red',
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={v1Items} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();

      // Update with all properties changed
      const v2Items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Item 1 Updated',
          data: { value: 'v2' },
          icon: { name: 'favorite' },
          color: 'blue',
          description: 'New description',
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={v2Items} />);

      // Should show updated item
      expect(screen.getByText('Item 1 Updated')).toBeInTheDocument();
      expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
    });

    it('should handle adding and removing items at nested level', async () => {
      const v1Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-1',
              name: 'Child 1',
              data: {},
              icon: { name: 'file' },
            },
            {
              id: 'child-2',
              name: 'Child 2',
              data: {},
              icon: { name: 'file' },
            },
          ],
        },
      ];

      const { rerender } = render(<Toolbox {...defaultProps} initialItems={v1Items} />);

      // Navigate to children
      await user.click(screen.getByText('Parent'));
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();

      // Update: remove child-1, add child-3
      const v2Items: ListItem[] = [
        {
          id: 'parent-1',
          name: 'Parent',
          data: {},
          icon: { name: 'folder' },
          children: [
            {
              id: 'child-2',
              name: 'Child 2',
              data: {},
              icon: { name: 'file' },
            },
            {
              id: 'child-3',
              name: 'Child 3',
              data: {},
              icon: { name: 'file' },
            },
          ],
        },
      ];

      rerender(<Toolbox {...defaultProps} initialItems={v2Items} />);

      // Should show updated children list
      expect(screen.queryByText('Child 1')).not.toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });
});
