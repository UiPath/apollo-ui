import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import TreeView, { type TreeViewItem } from './tree-view';

const simpleTree: TreeViewItem[] = [
  {
    id: 'cat-1',
    name: 'Folder A',
    type: 'folder',
    children: [
      { id: 'leaf-1', name: 'File 1', type: 'file' },
      { id: 'leaf-2', name: 'File 2', type: 'file' },
    ],
  },
  { id: 'leaf-top', name: 'Top File', type: 'file' },
];

const nestedTree: TreeViewItem[] = [
  {
    id: 'cat-outer',
    name: 'Outer',
    type: 'folder',
    children: [
      {
        id: 'cat-inner',
        name: 'Inner',
        type: 'folder',
        children: [{ id: 'leaf-deep', name: 'Deep File', type: 'file' }],
      },
    ],
  },
];

describe('TreeView – renderCategoryLabel / renderItemLabel', () => {
  it('renders default item.name for category and leaf rows when no custom renderers are provided', () => {
    render(<TreeView data={simpleTree} />);

    expect(screen.getByText('Folder A')).toBeInTheDocument();
    expect(screen.getByText('Top File')).toBeInTheDocument();
  });

  it('calls renderCategoryLabel for category rows and renders its output', () => {
    const renderCategoryLabel = vi.fn((item: TreeViewItem) => (
      <span data-testid={`cat-${item.id}`}>CATEGORY:{item.name}</span>
    ));

    render(<TreeView data={simpleTree} renderCategoryLabel={renderCategoryLabel} />);

    expect(screen.getByTestId('cat-cat-1')).toHaveTextContent('CATEGORY:Folder A');
    const calledIds = renderCategoryLabel.mock.calls.map(([item]) => item.id);
    expect(calledIds).toContain('cat-1');
  });

  it('calls renderItemLabel for leaf rows and renders its output', () => {
    const renderItemLabel = vi.fn((item: TreeViewItem) => (
      <span data-testid={`leaf-${item.id}`}>LEAF:{item.name}</span>
    ));

    render(<TreeView data={simpleTree} renderItemLabel={renderItemLabel} />);

    expect(screen.getByTestId('leaf-leaf-top')).toHaveTextContent('LEAF:Top File');
    const calledIds = renderItemLabel.mock.calls.map(([item]) => item.id);
    expect(calledIds).toContain('leaf-top');
  });

  it('keeps renderers scope-isolated (category renderer never sees leaves and vice versa)', () => {
    const renderCategoryLabel = vi.fn((item: TreeViewItem) => <span>{item.name}</span>);
    const renderItemLabel = vi.fn((item: TreeViewItem) => <span>{item.name}</span>);

    render(
      <TreeView
        data={simpleTree}
        renderCategoryLabel={renderCategoryLabel}
        renderItemLabel={renderItemLabel}
      />
    );

    for (const [item] of renderCategoryLabel.mock.calls) {
      expect(item.children).toBeDefined();
    }
    for (const [item] of renderItemLabel.mock.calls) {
      expect(item.children).toBeUndefined();
    }
  });

  it('threads both renderers to nested descendants', async () => {
    const user = userEvent.setup();
    const renderCategoryLabel = vi.fn((item: TreeViewItem) => (
      <span data-testid={`cat-${item.id}`}>{item.name}</span>
    ));
    const renderItemLabel = vi.fn((item: TreeViewItem) => (
      <span data-testid={`leaf-${item.id}`}>{item.name}</span>
    ));

    render(
      <TreeView
        data={nestedTree}
        renderCategoryLabel={renderCategoryLabel}
        renderItemLabel={renderItemLabel}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Expand' }));

    await waitFor(() => {
      expect(screen.getByTestId('cat-cat-inner')).toBeInTheDocument();
      expect(screen.getByTestId('leaf-leaf-deep')).toBeInTheDocument();
    });
  });

  it('preserves chevron expand/collapse when renderCategoryLabel is provided', async () => {
    const user = userEvent.setup();
    render(
      <TreeView
        data={simpleTree}
        renderCategoryLabel={(item) => <span>CATEGORY:{item.name}</span>}
      />
    );

    expect(screen.queryByText('File 1')).not.toBeInTheDocument();

    const row = document.querySelector('[data-id="cat-1"]') as HTMLElement;
    expect(row).not.toBeNull();
    const chevron = within(row).getAllByRole('button')[0]!;
    await user.click(chevron);

    await waitFor(() => {
      expect(screen.getByText('File 1')).toBeInTheDocument();
    });
  });

  it('preserves the access-rights checkbox on a category when renderCategoryLabel is provided', () => {
    render(
      <TreeView
        data={simpleTree}
        showCheckboxes
        renderCategoryLabel={(item) => <span>CATEGORY:{item.name}</span>}
      />
    );

    expect(screen.getByLabelText('Toggle access for Folder A')).toBeInTheDocument();
  });

  it('does not render a selection checkbox on category rows (leaf-only by design)', () => {
    render(
      <TreeView
        data={simpleTree}
        selectionMode="multiple"
        showSelectionCheckboxes
        renderCategoryLabel={(item) => <span>CATEGORY:{item.name}</span>}
      />
    );

    expect(screen.queryByLabelText('Select Folder A')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Select Top File')).toBeInTheDocument();
  });

  it('preserves the selection checkbox on a leaf when renderItemLabel is provided', async () => {
    const user = userEvent.setup();
    const handleSelectionChange = vi.fn();

    render(
      <TreeView
        data={simpleTree}
        selectionMode="multiple"
        showSelectionCheckboxes
        onSelectionChange={handleSelectionChange}
        renderItemLabel={(item) => <span>LEAF:{item.name}</span>}
      />
    );

    const checkbox = screen.getByLabelText('Select Top File');
    await user.click(checkbox);

    await waitFor(() => {
      expect(handleSelectionChange).toHaveBeenCalled();
    });
    const lastCall = handleSelectionChange.mock.calls.at(-1)?.[0] as TreeViewItem[];
    expect(lastCall.map((i) => i.id)).toContain('leaf-top');
  });
});
