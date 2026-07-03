import { describe, expect, it, vi } from 'vitest';
import { NodeRegistryProvider } from '../../core';
import type { NodeManifest } from '../../schema/node-definition/node-manifest';
import { render, screen } from '../../utils/testing';
import type { ListItem, ToolboxProps } from '../Toolbox';
import { AddNodePanel } from './AddNodePanel';
import type { NodeItemData } from './AddNodePanel.types';

// Mock usePreviewNode hook to avoid ReactFlow dependencies in tests
vi.mock('../../hooks', () => ({
  usePreviewNode: () => ({
    previewNode: null,
    previewNodeConnectionInfo: null,
  }),
}));

// Mock Toolbox to test only AddNodePanel's data transformation logic
vi.mock('../Toolbox', () => ({
  Toolbox: ({
    title,
    initialItems,
    onClose,
    onItemSelect,
    renderEmptyState,
    searchPlaceholder,
  }: ToolboxProps<NodeItemData>) => (
    <div data-testid="toolbox-mock">
      <div data-testid="toolbox-title">{title}</div>
      <div data-testid="toolbox-search-placeholder">{searchPlaceholder}</div>
      <div data-testid="toolbox-items">{JSON.stringify(initialItems)}</div>
      <button type="button" data-testid="toolbox-close" onClick={onClose}>
        Close
      </button>
      <button
        type="button"
        data-testid="toolbox-select-first"
        onClick={() => initialItems[0] && onItemSelect(initialItems[0])}
      >
        Select First
      </button>
      {/* Match real Toolbox: only invoke renderEmptyState when there are no items. */}
      {renderEmptyState && initialItems.length === 0 && (
        <div data-testid="toolbox-empty-state">
          {renderEmptyState({ currentCategory: undefined })}
        </div>
      )}
    </div>
  ),
}));

describe('AddNodePanel', () => {
  const mockCategories = [
    {
      id: 'agents',
      name: 'Agents',
      icon: 'agent',
      sortOrder: 1,
      color: '#0000FF',
      colorDark: '#0000AA',
      tags: [],
    },
    {
      id: 'tools',
      name: 'Tools',
      icon: 'tool',
      sortOrder: 1,
      color: '#0000FF',
      colorDark: '#0000AA',
      tags: [],
    },
  ];
  const mockRegistrations: NodeManifest[] = [
    {
      nodeType: 'agent-node',
      version: '1.0.0',
      category: 'agents',
      tags: ['agent', 'ai'],
      sortOrder: 0,
      display: {
        label: 'Agent Node',
        icon: 'smart_toy',
        description: 'An agent node',
      },
      handleConfiguration: [],
    },
    {
      nodeType: 'tool-node',
      version: '1.0.0',
      category: 'tools',
      tags: ['tool'],
      sortOrder: 0,
      display: {
        label: 'Tool Node',
        icon: 'handyman',
        description: 'A tool node',
      },
      description: 'A tool node',
      handleConfiguration: [],
    },
  ];

  const mockManifest = {
    version: '1.0.0',
    categories: mockCategories,
    nodes: mockRegistrations,
  };

  const mockOnNodeSelect = vi.fn();
  const mockOnClose = vi.fn();

  const defaultProps = {
    onNodeSelect: mockOnNodeSelect,
    onClose: mockOnClose,
  };

  it("should render with title 'Add node'", () => {
    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    expect(screen.getByTestId('toolbox-title')).toHaveTextContent('Add node');
  });

  it('should default the search placeholder to "Search nodes"', () => {
    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    expect(screen.getByTestId('toolbox-search-placeholder')).toHaveTextContent('Search nodes');
  });

  it('should forward a custom searchPlaceholder to Toolbox', () => {
    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} searchPlaceholder="Search agents" />
      </NodeRegistryProvider>
    );

    expect(screen.getByTestId('toolbox-search-placeholder')).toHaveTextContent('Search agents');
  });

  it('should transform empty registry into empty list items', () => {
    render(
      <NodeRegistryProvider manifest={{ version: '1.0.0', categories: [], nodes: [] }}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    const items = JSON.parse(screen.getByTestId('toolbox-items').textContent);
    expect(items).toEqual([]);
  });

  it('should transform registry data into hierarchical ListItems', () => {
    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    const items = JSON.parse(screen.getByTestId('toolbox-items').textContent);

    // Should have 2 categories
    expect(items).toHaveLength(2);

    // Check Agents category
    expect(items[0]).toMatchObject({
      id: 'agents',
      name: 'Agents',
    });
    expect(items[0].children).toHaveLength(1);
    expect(items[0].children[0]).toMatchObject({
      id: 'agent-node',
      name: 'Agent Node',
      icon: { name: 'smart_toy' },
      data: {
        type: 'agent-node',
        category: 'agents',
      },
    });

    // Check Tools category
    expect(items[1]).toMatchObject({
      id: 'tools',
      name: 'Tools',
    });
    expect(items[1].children).toHaveLength(1);
    expect(items[1].children[0]).toMatchObject({
      id: 'tool-node',
      name: 'Tool Node',
      icon: { name: 'handyman' },
      description: 'A tool node',
      data: {
        type: 'tool-node',
        category: 'tools',
      },
    });
  });

  it('should call onNodeSelect with correct data when item is selected', () => {
    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    screen.getByTestId('toolbox-select-first').click();

    expect(mockOnNodeSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Agents',
        children: expect.arrayContaining([
          expect.objectContaining({
            name: 'Agent Node',
          }),
        ]),
      })
    );
  });

  it('should call onClose when Toolbox close is triggered', () => {
    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    screen.getByTestId('toolbox-close').click();

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should filter out empty categories from the list', () => {
    const registrations: NodeManifest[] = [
      {
        nodeType: 'agent-node',
        version: '1.0.0',
        category: 'agents',
        tags: ['agent', 'ai'],
        sortOrder: 0,
        display: {
          label: 'Agent Node',
          icon: 'smart_toy',
          description: 'An agent node',
        },
        handleConfiguration: [],
      },
    ];

    render(
      <NodeRegistryProvider registrations={registrations}>
        <AddNodePanel {...defaultProps} />
      </NodeRegistryProvider>
    );

    const items = JSON.parse(screen.getByTestId('toolbox-items').textContent);

    // Should only have 1 category (agents), empty category should be filtered out
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('agent-node');
  });

  it('should forward renderEmptyState through to Toolbox when items are empty', () => {
    const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">empty</div>);

    // Pass items={[]} so the (gated) mock path invokes renderEmptyState — same
    // behavior as the real Toolbox, which only calls the prop when ListView
    // would render the empty state.
    render(<AddNodePanel {...defaultProps} items={[]} renderEmptyState={renderEmptyState} />);

    expect(screen.getByTestId('toolbox-empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('custom-empty')).toHaveTextContent('empty');
    expect(renderEmptyState).toHaveBeenCalledWith({ currentCategory: undefined });
  });

  it('should not invoke renderEmptyState when items are present', () => {
    const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">should not render</div>);

    render(
      <NodeRegistryProvider manifest={mockManifest}>
        <AddNodePanel {...defaultProps} renderEmptyState={renderEmptyState} />
      </NodeRegistryProvider>
    );

    expect(screen.queryByTestId('toolbox-empty-state')).not.toBeInTheDocument();
    expect(renderEmptyState).not.toHaveBeenCalled();
  });

  it('should support custom nodeOptions instead of registry', () => {
    const customOptions: ListItem[] = [
      {
        id: 'custom-1',
        name: 'Custom Node 1',
        data: { id: 'custom-1', type: 'custom-type' },
        icon: { name: 'star' },
      },
      {
        id: 'custom-2',
        name: 'Custom Node 2',
        data: { id: 'custom-2', type: 'custom-type' },
        icon: { name: 'favorite' },
      },
    ];

    render(<AddNodePanel {...defaultProps} items={customOptions} />);

    const items = JSON.parse(screen.getByTestId('toolbox-items').textContent);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      id: 'custom-1',
      name: 'Custom Node 1',
      icon: { name: 'star' },
    });
    expect(items[1]).toMatchObject({
      id: 'custom-2',
      name: 'Custom Node 2',
      icon: { name: 'favorite' },
    });
  });
});
