import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileTreeView as PublicFileTreeView, TreeView } from '@/index';
import FileTreeView, { type FileTreeViewItem } from './tree-view';

const tree: FileTreeViewItem[] = [
  {
    id: 'root',
    name: 'Root',
    type: 'folder',
    children: [{ id: 'child', name: 'Child', type: 'file' }],
  },
];

describe('FileTreeView', () => {
  it('renders children through AnimatePresence after expansion', async () => {
    const user = userEvent.setup();
    render(<FileTreeView data={tree} title="Files" />);

    expect(screen.queryByText('Child')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(await screen.findByText('Child')).toBeInTheDocument();
  });

  it('keeps the deprecated TreeView export working', () => {
    expect(TreeView).toBe(PublicFileTreeView);
    expect(PublicFileTreeView).toBe(FileTreeView);
    render(<TreeView data={tree} title="Files" />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });

  it('toggles the checkbox when its label is clicked', async () => {
    const user = userEvent.setup();
    const onCheckChange = vi.fn();
    render(
      <FileTreeView
        data={[{ id: 'a', name: 'Alpha', type: 'file', checked: false }]}
        showCheckboxes
        selectionMode="none"
        onCheckChange={onCheckChange}
      />
    );

    await user.click(screen.getByText('Alpha'));

    expect(onCheckChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), true);
  });

  it('toggles from the label in any selection mode, leaving the rest of the row to select', async () => {
    const user = userEvent.setup();
    const onCheckChange = vi.fn();
    render(
      <FileTreeView
        data={[{ id: 'a', name: 'Alpha', type: 'file', checked: false }]}
        showCheckboxes
        onCheckChange={onCheckChange}
      />
    );
    const row = screen.getByRole('treeitem', { name: /Alpha/ });

    await user.click(screen.getByText('Alpha'));
    expect(onCheckChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), true);
    expect(row).toHaveAttribute('aria-selected', 'false');

    onCheckChange.mockClear();
    await user.click(row);
    expect(onCheckChange).not.toHaveBeenCalled();
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('opens no context menu on right-click when there are no menu items', () => {
    render(<FileTreeView data={tree} title="Files" />);

    fireEvent.contextMenu(screen.getByText('Root'));

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('opens the context menu on right-click when menu items are given', async () => {
    render(
      <FileTreeView
        data={tree}
        title="Files"
        menuItems={[{ id: 'rename', label: 'Rename', action: vi.fn() }]}
      />
    );

    fireEvent.contextMenu(screen.getByText('Root'));

    expect(await screen.findByRole('menuitem', { name: 'Rename' })).toBeInTheDocument();
  });

  it('toggles with Space but not Enter when nothing is selectable', async () => {
    const user = userEvent.setup();
    const onCheckChange = vi.fn();
    render(
      <FileTreeView
        data={[{ id: 'a', name: 'Alpha', type: 'file', checked: false }]}
        showCheckboxes
        selectionMode="none"
        onCheckChange={onCheckChange}
      />
    );

    screen.getByRole('treeitem', { name: /Alpha/ }).focus();
    await user.keyboard('{Enter}');
    expect(onCheckChange).not.toHaveBeenCalled();

    await user.keyboard(' ');
    expect(onCheckChange).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }), true);
  });

  it('expands a folder with Enter when nothing is selectable', async () => {
    const user = userEvent.setup();
    render(<FileTreeView data={tree} showCheckboxes selectionMode="none" />);

    screen.getByRole('treeitem', { name: /Root/ }).focus();
    await user.keyboard('{Enter}');

    expect(await screen.findByText('Child')).toBeInTheDocument();
  });

  it('exposes the check state on the row, mixed for a partly checked folder', () => {
    render(
      <FileTreeView
        data={[
          {
            id: 'root',
            name: 'Root',
            type: 'folder',
            children: [
              { id: 'a', name: 'A', type: 'file', checked: true },
              { id: 'b', name: 'B', type: 'file', checked: false },
            ],
          },
        ]}
        showCheckboxes
        selectionMode="none"
      />
    );

    expect(screen.getByRole('treeitem', { name: /Root/ })).toHaveAttribute('aria-checked', 'mixed');
  });

  it('does not toggle a disabled row from its checkbox', async () => {
    const user = userEvent.setup();
    const onCheckChange = vi.fn();
    render(
      <FileTreeView
        data={[{ id: 'a', name: 'Alpha', type: 'file', checked: false, disabled: true }]}
        showCheckboxes
        selectionMode="none"
        onCheckChange={onCheckChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Toggle access for Alpha' }));

    expect(onCheckChange).not.toHaveBeenCalled();
  });

  it.each([
    '{Enter}',
    ' ',
  ])('expands a folder with %s when nothing is selectable and there are no checkboxes', async (key) => {
    const user = userEvent.setup();
    render(<FileTreeView data={tree} selectionMode="none" />);

    screen.getByRole('treeitem', { name: /Root/ }).focus();
    await user.keyboard(key);

    expect(await screen.findByText('Child')).toBeInTheDocument();
  });
});
