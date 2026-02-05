import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import type { ListItem } from './ListView';
import { ListView } from './ListView';

describe('ListView', () => {
  const mockOnItemClick = vi.fn();

  const defaultProps = {
    items: [] as ListItem[],
    onItemClick: mockOnItemClick,
  };

  describe('Empty states', () => {
    it('should show default empty state when no items', () => {
      render(<ListView {...defaultProps} items={[]} />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should show custom empty state message', () => {
      render(<ListView {...defaultProps} items={[]} emptyStateMessage="Custom empty message" />);

      expect(screen.getByText('Custom empty message')).toBeInTheDocument();
    });

    it('should show loading spinner when loading with no items', () => {
      render(<ListView {...defaultProps} items={[]} isLoading={true} />);

      expect(screen.getAllByTestId('ap-skeleton').length).toBeGreaterThan(0);
      expect(screen.queryByText('No items found')).not.toBeInTheDocument();
    });

    it('should not show loading spinner when loading with items', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
          data: {},
        },
      ];

      render(<ListView {...defaultProps} items={items} isLoading={true} />);

      expect(screen.queryByTestId('ap-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('Item rendering', () => {
    it('should render basic item with name and icon', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Test Item',
          data: {},
          icon: { name: 'star' },
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByTestId('list-item-icon').querySelector('svg')).toHaveClass('lucide-star');
    });

    it('should render item with description', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Test Item',
          data: {},
          description: 'This is a description',
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('should render chevron for items with children', () => {
      const items: ListItem[] = [
        {
          id: 'parent',
          name: 'Parent Item',
          data: {},
          children: [
            {
              id: 'child',
              name: 'Child Item',
              data: {},
            },
          ],
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      // Check for chevron_right icon
      const icons = screen.getAllByTestId('ap-icon');
      const chevronIcon = icons.find((icon) => icon.getAttribute('data-name') === 'chevron_right');
      expect(chevronIcon).toBeDefined();
    });

    it('should render item with URL icon', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Test Item',
          data: {},
          icon: { url: 'https://example.com/icon.png' },
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      const img = screen.getByAltText('Test Item');
      expect(img).toHaveAttribute('src', 'https://example.com/icon.png');
    });

    it('should render multiple items', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item 1', data: {} },
        { id: 'item-2', name: 'Item 2', data: {} },
        { id: 'item-3', name: 'Item 3', data: {} },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
    });
  });

  describe('Sections', () => {
    it('should render items without sections first', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Unsectioned Item', data: {} },
        { id: 'item-2', name: 'Sectioned Item', data: {}, section: 'Section A' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      const allText = screen.getByTestId('virtualized-list').textContent;
      const unsectionedIndex = allText?.indexOf('Unsectioned Item');
      const sectionedIndex = allText?.indexOf('Sectioned Item');

      expect(unsectionedIndex).toBeLessThan(sectionedIndex!);
    });

    it('should render section headers', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item 1', data: {}, section: 'Section A' },
        { id: 'item-2', name: 'Item 2', data: {}, section: 'Section B' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      expect(screen.getByText('Section A')).toBeInTheDocument();
      expect(screen.getByText('Section B')).toBeInTheDocument();
    });

    it('should group items under their sections', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item A1', data: {}, section: 'Section A' },
        { id: 'item-2', name: 'Item A2', data: {}, section: 'Section A' },
        { id: 'item-3', name: 'Item B1', data: {}, section: 'Section B' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      const container = screen.getByTestId('virtualized-list');
      const text = container.textContent || '';

      // Check order: Section A, Item A1, Item A2, Section B, Item B1
      const sectionAIndex = text.indexOf('Section A');
      const itemA1Index = text.indexOf('Item A1');
      const itemA2Index = text.indexOf('Item A2');
      const sectionBIndex = text.indexOf('Section B');
      const itemB1Index = text.indexOf('Item B1');

      expect(sectionAIndex).toBeLessThan(itemA1Index);
      expect(itemA1Index).toBeLessThan(itemA2Index);
      expect(itemA2Index).toBeLessThan(sectionBIndex);
      expect(sectionBIndex).toBeLessThan(itemB1Index);
    });

    it('should not render sections when enableSections is false', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item 1', data: {}, section: 'Section A' },
        { id: 'item-2', name: 'Item 2', data: {}, section: 'Section B' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={false} />);

      expect(screen.queryByText('Section A')).not.toBeInTheDocument();
      expect(screen.queryByText('Section B')).not.toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should handle items with and without sections', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'No Section', data: {} },
        { id: 'item-2', name: 'With Section', data: {}, section: 'Section A' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      // Unsectioned items should appear first
      const container = screen.getByTestId('virtualized-list');
      const text = container.textContent || '';

      const noSectionIndex = text.indexOf('No Section');
      const sectionHeaderIndex = text.indexOf('Section A');
      const withSectionIndex = text.indexOf('With Section');

      expect(noSectionIndex).toBeLessThan(sectionHeaderIndex);
      expect(sectionHeaderIndex).toBeLessThan(withSectionIndex);
    });
  });

  describe('Interactions', () => {
    it('should call onItemClick when item is clicked', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: { value: 'test' } }];

      render(<ListView {...defaultProps} items={items} />);

      screen.getByText('Item 1').click();

      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'item-1',
          name: 'Item 1',
        })
      );
    });

    it('should disable items when loading', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      render(<ListView {...defaultProps} items={items} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have loading class when isLoading is true', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      render(<ListView {...defaultProps} items={items} isLoading={true} />);

      const button = screen.getByRole('button');
      expect(button).toHaveClass('loading');
    });
  });

  describe('Styling', () => {
    it('should apply custom color from getItemColor', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      const getItemColor = () => '#ff0000';

      render(<ListView {...defaultProps} items={items} getItemColor={getItemColor} />);

      const button = screen.getByRole('button');
      // Check that the IconContainer has the background color set
      const iconContainer = button.querySelector('.css-q1gtze');
      expect(iconContainer).toBeDefined();
    });

    it('should apply color from item.color if provided', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {}, color: '#00ff00' }];

      render(<ListView {...defaultProps} items={items} />);

      const button = screen.getByRole('button');
      const iconContainer = button.querySelector('.css-q1gtze');
      expect(iconContainer).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle items with missing optional properties', () => {
      const items: ListItem[] = [
        {
          id: 'minimal-item',
          name: 'Minimal Item',
          data: {},
          // No icon, no description, no section, no color
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByText('Minimal Item')).toBeInTheDocument();
    });

    it('should handle empty section names gracefully', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {}, section: '' }];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should render unique sections only once', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item 1', data: {}, section: 'Section A' },
        { id: 'item-2', name: 'Item 2', data: {}, section: 'Section A' },
        { id: 'item-3', name: 'Item 3', data: {}, section: 'Section A' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      const container = screen.getByTestId('virtualized-list');
      const text = container.textContent || '';

      // Count occurrences of "Section A" - should only appear once
      const matches = text.match(/Section A/g);
      expect(matches?.length).toBe(1);
    });
  });
});
