import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import TreeView, { type TreeViewItem } from './tree-view';

const tree: TreeViewItem[] = [
  {
    id: 'root',
    name: 'Root',
    type: 'folder',
    children: [{ id: 'child', name: 'Child', type: 'file' }],
  },
];

describe('TreeView', () => {
  it('renders children through AnimatePresence after expansion', async () => {
    const user = userEvent.setup();
    render(<TreeView data={tree} title="Files" />);

    expect(screen.queryByText('Child')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(await screen.findByText('Child')).toBeInTheDocument();
  });
});
