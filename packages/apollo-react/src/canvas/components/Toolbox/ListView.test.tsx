import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { CanvasThemeProvider } from '../BaseCanvas/CanvasThemeContext';
import type { ListItem, RenderItem } from './ListView';
import {
  getRenderItemHeight,
  ListView,
  ROW_HEIGHT_DIVIDER,
  ROW_HEIGHT_ITEM,
  ROW_HEIGHT_ITEM_TWO_LINE,
  ROW_HEIGHT_SECTION,
  ROW_HEIGHT_SECTION_FIRST,
} from './ListView';

describe('getRenderItemHeight', () => {
  const itemOf = (item: Partial<ListItem>): RenderItem<ListItem> => ({
    type: 'item',
    item: { id: 'x', name: 'X', data: {}, ...item },
  });

  it('sizes a plain item as a single-line row', () => {
    expect(getRenderItemHeight(itemOf({}))).toBe(ROW_HEIGHT_ITEM);
  });

  it('sizes an item with an inline description as a two-line row', () => {
    expect(getRenderItemHeight(itemOf({ description: 'Finance Ops · v1' }))).toBe(
      ROW_HEIGHT_ITEM_TWO_LINE
    );
  });

  it('keeps a detail-only item single-line (detail is tooltip-only)', () => {
    expect(getRenderItemHeight(itemOf({ detail: 'Hover-only explanation' }))).toBe(ROW_HEIGHT_ITEM);
  });

  it('sizes section headers, using the tighter height for the first', () => {
    expect(getRenderItemHeight({ type: 'section', sectionName: 'A', first: true })).toBe(
      ROW_HEIGHT_SECTION_FIRST
    );
    expect(getRenderItemHeight({ type: 'section', sectionName: 'A', first: false })).toBe(
      ROW_HEIGHT_SECTION
    );
  });

  it('sizes dividers and skeletons', () => {
    expect(getRenderItemHeight({ type: 'divider' })).toBe(ROW_HEIGHT_DIVIDER);
    expect(getRenderItemHeight({ type: 'skeleton' })).toBe(ROW_HEIGHT_ITEM);
  });

  it('falls back to the single-line height for an undefined render item', () => {
    expect(getRenderItemHeight(undefined)).toBe(ROW_HEIGHT_ITEM);
  });
});

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

    it('should call renderEmptyState and render its result when items are empty', () => {
      const renderEmptyState = vi.fn(() => (
        <div data-testid="custom-empty">Bring your own empty state</div>
      ));
      render(<ListView {...defaultProps} items={[]} renderEmptyState={renderEmptyState} />);

      expect(renderEmptyState).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });

    it('should let renderEmptyState replace the default icon + message', () => {
      render(
        <ListView
          {...defaultProps}
          items={[]}
          emptyStateMessage="Default message"
          renderEmptyState={() => <div>Custom render wins</div>}
        />
      );

      expect(screen.getByText('Custom render wins')).toBeInTheDocument();
      expect(screen.queryByText('Default message')).not.toBeInTheDocument();
    });

    it('should not call renderEmptyState when items are present', () => {
      const renderEmptyState = vi.fn(() => <div>Should not render</div>);
      const items: ListItem[] = [{ id: 'a', name: 'A', data: {} }];

      render(<ListView {...defaultProps} items={items} renderEmptyState={renderEmptyState} />);

      expect(renderEmptyState).not.toHaveBeenCalled();
      expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
    });

    it('should not call renderEmptyState while isLoading produces skeleton rows', () => {
      const renderEmptyState = vi.fn(() => <div>Should not render</div>);

      render(
        <ListView
          {...defaultProps}
          items={[]}
          isLoading={true}
          renderEmptyState={renderEmptyState}
        />
      );

      // isLoading + empty items → 3 default skeletons render → renderedItems is
      // non-empty → renderEmptyState is bypassed.
      expect(renderEmptyState).not.toHaveBeenCalled();
      expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(3);
    });

    it('should not call renderEmptyState while loadingSkeleton produces rows', () => {
      const renderEmptyState = vi.fn(() => <div>Should not render</div>);

      render(
        <ListView
          {...defaultProps}
          items={[]}
          loadingSkeleton={true}
          renderEmptyState={renderEmptyState}
        />
      );

      expect(renderEmptyState).not.toHaveBeenCalled();
      expect(screen.queryByText('Should not render')).not.toBeInTheDocument();
      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(3);
    });

    it('should show loading spinner when loading with no items', () => {
      render(<ListView {...defaultProps} items={[]} isLoading={true} />);

      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
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

      expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });
  });

  describe('loadingSkeleton', () => {
    it('should render the default 3 skeleton rows when loadingSkeleton=true and items is empty', () => {
      render(<ListView {...defaultProps} items={[]} loadingSkeleton={true} />);

      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(3);
      expect(screen.queryByText('No items found')).not.toBeInTheDocument();
    });

    it('should respect a custom skeleton count', () => {
      render(<ListView {...defaultProps} items={[]} loadingSkeleton={{ count: 5 }} />);

      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(5);
    });

    it('should render section headers + per-section skeletons when sections are provided', () => {
      render(
        <ListView
          {...defaultProps}
          items={[]}
          loadingSkeleton={{
            sections: [
              { name: 'Published', count: 2 },
              { name: 'In this solution', count: 1 },
            ],
          }}
        />
      );

      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getByText('In this solution')).toBeInTheDocument();
      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(3);
    });

    it('should append skeletons after real items while loadingSkeleton is active', () => {
      // The whole point of `loadingSkeleton` is "more on the way" — skeletons
      // must keep rendering even after some content has loaded.
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      render(<ListView {...defaultProps} items={items} loadingSkeleton={true} />);

      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(3);
    });

    it('should drop skeletons once loadingSkeleton is cleared', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      const { rerender } = render(
        <ListView {...defaultProps} items={items} loadingSkeleton={true} />
      );
      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(3);

      rerender(<ListView {...defaultProps} items={items} loadingSkeleton={undefined} />);
      expect(screen.queryByTestId('list-item-skeleton')).not.toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    it('should not apply the .loading row class while loadingSkeleton is active with items', () => {
      // `loadingSkeleton` is independent of `isLoading`; it only swaps the
      // empty-state for skeletons and must not dim/disable other rows.
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      render(<ListView {...defaultProps} items={items} loadingSkeleton={true} />);

      const option = screen.getByRole('option');
      expect(option).not.toHaveClass('loading');
      expect(option).not.toBeDisabled();
    });

    it('should prefer loadingSkeleton over isLoading for the empty state when both are set', () => {
      // Sections-aware skeleton wins over the legacy 3-row default so consumers
      // can opt into preemptive headers without having to gate isLoading.
      render(
        <ListView
          {...defaultProps}
          items={[]}
          isLoading={true}
          loadingSkeleton={{ sections: [{ name: 'Published', count: 1 }] }}
        />
      );

      expect(screen.getByText('Published')).toBeInTheDocument();
      expect(screen.getAllByTestId('list-item-skeleton')).toHaveLength(1);
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

    it('should render description as an inline second line', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Invoice routing',
          data: {},
          description: 'this solution · v3',
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByText('Invoice routing')).toBeInTheDocument();
      expect(screen.getByText('this solution · v3')).toBeInTheDocument();
    });

    it('should not render detail inline (it is tooltip-only)', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Test Item',
          data: {},
          detail: 'Hover-only explanation',
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.queryByText('Hover-only explanation')).not.toBeInTheDocument();
    });

    it('should render a badge tag when the item has one', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'New record',
          data: {},
          badge: 'TRIGGER',
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      const badge = screen.getByTestId('list-item-badge');
      expect(badge).toHaveTextContent('TRIGGER');
    });

    it('should render a divider before items flagged with dividerBefore', () => {
      const items: ListItem[] = [
        { id: 'a', name: 'Alpha', data: {} },
        { id: 'b', name: 'Beta', data: {}, dividerBefore: true },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByTestId('list-item-divider')).toBeInTheDocument();
    });

    it('should suppress a leading divider when the first item sets dividerBefore', () => {
      const items: ListItem[] = [{ id: 'a', name: 'Alpha', data: {}, dividerBefore: true }];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.queryByTestId('list-item-divider')).not.toBeInTheDocument();
    });

    it('should not render dividers in flat mode (search results)', () => {
      // Search results are leaves collected from the browse tree, so they can
      // carry dividerBefore; flat mode must ignore it like it does sections.
      const items: ListItem[] = [
        { id: 'a', name: 'Alpha', data: {} },
        { id: 'b', name: 'Beta', data: {}, dividerBefore: true },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={false} />);

      expect(screen.getByText('Beta')).toBeInTheDocument();
      expect(screen.queryByTestId('list-item-divider')).not.toBeInTheDocument();
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

      // Check for chevron-right icon
      const chevronIcon = document.querySelector('.lucide-chevron-right');
      expect(chevronIcon).toBeInTheDocument();
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

    it('should render an initials badge when the item has no icon source', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Microsoft Azure AI Foundry', data: {} }];

      render(<ListView {...defaultProps} items={items} />);

      const badge = screen.getByTestId('list-item-initials-badge');
      expect(badge).toHaveTextContent('M');
      // Decorative — the row's name is already announced separately.
      expect(badge).toHaveAttribute('aria-hidden', 'true');
    });

    it('should not render the initials badge when an icon source is provided', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Foo', data: {}, icon: { name: 'star' } },
        { id: 'item-2', name: 'Bar', data: {}, icon: { url: 'https://example.com/x.svg' } },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.queryByTestId('list-item-initials-badge')).not.toBeInTheDocument();
    });

    it('should not render the initials badge when icon.Component is provided', () => {
      const CustomIcon = () => <span data-testid="custom-icon">★</span>;
      const items: ListItem[] = [
        { id: 'item-1', name: 'Foo', data: {}, icon: { Component: CustomIcon } },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.queryByTestId('list-item-initials-badge')).not.toBeInTheDocument();
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should fall back to the initials badge when icon source is present but empty', () => {
      // Defensive: `ListItem.icon` is a TS interface, not Zod-validated, so a
      // mapping bug upstream can produce `{ url: '' }` / `{ name: '' }`. The
      // truthy guards in IconContainer should treat these as "no source".
      const items: ListItem[] = [
        { id: 'item-1', name: 'Empty URL', data: {}, icon: { url: '' } },
        { id: 'item-2', name: 'Empty Name', data: {}, icon: { name: '' } },
      ];

      render(<ListView {...defaultProps} items={items} />);

      const badges = screen.getAllByTestId('list-item-initials-badge');
      expect(badges).toHaveLength(2);
      expect(badges[0]).toHaveTextContent('E');
    });

    it('should keep the first emoji intact in the initials badge instead of slicing a surrogate pair', () => {
      const items: ListItem[] = [{ id: 'item-1', name: '🤖 Robot Agent', data: {} }];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.getByTestId('list-item-initials-badge')).toHaveTextContent('🤖');
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

  describe('Row styling (contentColor / trailingIcon)', () => {
    it('should apply contentColor to the name and leading icon and render the trailing icon', () => {
      const items: ListItem[] = [
        {
          id: 'create-1',
          name: 'Create new agent',
          data: {},
          icon: { name: 'plus' },
          contentColor: 'var(--canvas-primary)',
          trailingIcon: { name: 'arrow-up-right', color: 'var(--canvas-primary)' },
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      const label = screen.getByText('Create new agent');
      // jsdom leaves CSS custom properties unresolved, so assert the raw
      // inline declaration rather than computed style.
      expect((label as HTMLElement).style.color).toBe('var(--canvas-primary)');
      const iconContainer = screen.getByTestId('list-item-icon');
      expect(iconContainer.style.color).toBe('var(--canvas-primary)');
      expect(screen.getByTestId('list-item-trailing-icon')).toBeInTheDocument();
    });

    it('should not render a trailing icon on rows that do not declare one', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Regular', data: {} }];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.queryByTestId('list-item-trailing-icon')).not.toBeInTheDocument();
    });

    it('should prefer the drill-in chevron over the trailing icon when the row has children', () => {
      const items: ListItem[] = [
        {
          id: 'parent',
          name: 'Options',
          data: {},
          trailingIcon: { name: 'arrow-up-right' },
          children: [{ id: 'child', name: 'Child', data: {} }],
        },
      ];

      render(<ListView {...defaultProps} items={items} />);

      expect(screen.queryByTestId('list-item-trailing-icon')).not.toBeInTheDocument();
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

    it('should render spaced uppercase section headers without a rule', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item A1', data: {}, section: 'Section A' },
        { id: 'item-2', name: 'Item B1', data: {}, section: 'Section B' },
        { id: 'item-3', name: 'Item C1', data: {}, section: 'Section C' },
      ];

      render(<ListView {...defaultProps} items={items} enableSections={true} />);

      // Headers are the separator themselves — no rule element is rendered.
      expect(screen.getAllByTestId('list-section-header')).toHaveLength(3);
      expect(screen.queryByTestId('list-section-rule')).not.toBeInTheDocument();
      const label = screen.getByText('Section A');
      expect(label).toHaveClass('uppercase');
      expect(label).toHaveClass('font-bold');
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
        }),
        0
      );
    });

    it('should disable items when loading', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      render(<ListView {...defaultProps} items={items} isLoading={true} />);

      const option = screen.getByRole('option');
      expect(option).toBeDisabled();
    });

    it('should have loading class when isLoading is true', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {} }];

      render(<ListView {...defaultProps} items={items} isLoading={true} />);

      const option = screen.getByRole('option');
      expect(option).toHaveClass('loading');
    });
  });

  describe('Styling', () => {
    it('should apply color from item.color if provided', () => {
      const items: ListItem[] = [{ id: 'item-1', name: 'Item 1', data: {}, color: 'rgb(1,2,3)' }];

      render(<ListView {...defaultProps} items={items} />);

      const iconContainer = screen.getByTestId('list-item-icon');
      expect(iconContainer).toHaveStyle({ background: 'rgb(1,2,3)' });
    });

    it('should use dark color in dark mode', () => {
      const items: ListItem[] = [
        {
          id: 'item-1',
          name: 'Item 1',
          data: {},
          color: 'rgb(1,2,3)',
          colorDark: 'rgb(3,2,1)',
        },
      ];
      render(
        <CanvasThemeProvider isDarkMode={true}>
          <ListView {...defaultProps} items={items} />
        </CanvasThemeProvider>
      );

      const iconContainer = screen.getByTestId('list-item-icon');
      expect(iconContainer).toHaveStyle({ background: 'rgb(3,2,1)' });
    });

    it('should default to a transparent icon background when the item has no color', () => {
      const items: ListItem[] = [
        { id: 'item-1', name: 'Item 1', data: {}, icon: { name: 'star' } },
      ];

      render(<ListView {...defaultProps} items={items} />);

      const iconContainer = screen.getByTestId('list-item-icon');
      expect(getComputedStyle(iconContainer).backgroundColor).toBe('transparent');
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
