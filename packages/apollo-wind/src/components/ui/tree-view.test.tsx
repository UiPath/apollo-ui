import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
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
});
