import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FileTreeView as PublicFileTreeView, TreeView } from '@/index';
import FileTreeView, { type FileTreeViewItem, type FileTreeViewSelectionMode } from './tree-view';

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

  describe('toggleCheckOnRowClick', () => {
    const checkTree: FileTreeViewItem[] = [
      {
        id: 'parent',
        name: 'Parent',
        type: 'folder',
        children: [
          { id: 'a', name: 'A', type: 'file', checked: true },
          { id: 'b', name: 'B', type: 'file' },
        ],
      },
      { id: 'solo', name: 'Solo', type: 'file' },
      { id: 'off', name: 'Off', type: 'file', disabled: true },
    ];

    const renderTree = (
      toggleCheckOnRowClick = true,
      selectionMode: FileTreeViewSelectionMode = 'none'
    ) => {
      const onCheckChange = vi.fn();
      render(
        <FileTreeView
          data={checkTree}
          showCheckboxes
          toggleCheckOnRowClick={toggleCheckOnRowClick}
          selectionMode={selectionMode}
          onCheckChange={onCheckChange}
        />
      );
      return onCheckChange;
    };

    const row = (name: string) =>
      screen.getByText(name).closest('[role="treeitem"]') as HTMLElement;

    it('toggles a leaf when its row is clicked', async () => {
      const onCheckChange = renderTree();

      await userEvent.click(row('Solo'));

      expect(onCheckChange).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'solo' }),
        true
      );
    });

    it('checks a partly-checked parent when its row is clicked', async () => {
      const onCheckChange = renderTree();

      await userEvent.click(row('Parent'));

      expect(onCheckChange).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'parent' }),
        true
      );
    });

    it('toggles the focused row with the keyboard', async () => {
      const onCheckChange = renderTree();

      row('Solo').focus();
      await userEvent.keyboard(' ');

      expect(onCheckChange).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'solo' }),
        true
      );
    });

    it('toggles once when the checkbox itself is clicked', async () => {
      const onCheckChange = renderTree();

      await userEvent.click(screen.getByRole('button', { name: 'Toggle access for Solo' }));

      expect(onCheckChange).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'solo' }),
        true
      );
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('expands, without toggling, on %s from the expand chevron', async (_, key) => {
      const onCheckChange = renderTree();

      screen.getByRole('button', { name: 'Expand Parent' }).focus();
      await userEvent.keyboard(key);

      expect(await screen.findByText('B')).toBeInTheDocument();
      expect(onCheckChange).not.toHaveBeenCalled();
    });

    it.each([
      ['Enter', '{Enter}'],
      ['Space', ' '],
    ])('toggles once on %s from the checkbox', async (_, key) => {
      const onCheckChange = renderTree();

      screen.getByRole('button', { name: 'Toggle access for Solo' }).focus();
      await userEvent.keyboard(key);

      expect(onCheckChange).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({ id: 'solo' }),
        true
      );
    });

    it('does not toggle a parent that is only expanded', async () => {
      const onCheckChange = renderTree();

      await userEvent.click(screen.getByRole('button', { name: 'Expand Parent' }));

      expect(onCheckChange).not.toHaveBeenCalled();
    });

    it('ignores row clicks on a disabled item', async () => {
      const onCheckChange = renderTree();

      await userEvent.click(row('Off'));

      expect(onCheckChange).not.toHaveBeenCalled();
    });

    it('keeps row-click selection and expansion when selection is enabled', async () => {
      const onCheckChange = renderTree(true, 'multiple');

      await userEvent.click(row('Solo'));
      await userEvent.click(row('Parent'));
      await userEvent.click(row('Parent'));

      expect(row('Parent')).toHaveAttribute('aria-selected', 'true');
      expect(await screen.findByText('B')).toBeInTheDocument();
      expect(onCheckChange).not.toHaveBeenCalled();
    });

    it('leaves row clicks alone when the prop is off', async () => {
      const onCheckChange = renderTree(false);

      await userEvent.click(row('Solo'));

      expect(onCheckChange).not.toHaveBeenCalled();
    });
  });

  it('keeps the deprecated TreeView export working', () => {
    expect(TreeView).toBe(PublicFileTreeView);
    expect(PublicFileTreeView).toBe(FileTreeView);
    render(<TreeView data={tree} title="Files" />);
    expect(screen.getByText('Root')).toBeInTheDocument();
  });
});
