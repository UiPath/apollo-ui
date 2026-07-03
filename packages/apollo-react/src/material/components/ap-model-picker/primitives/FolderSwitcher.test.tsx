import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FolderSwitcher } from './FolderSwitcher';

const FOLDERS = [
  { id: 'guid-a', label: 'Shared' },
  { id: 'guid-b', label: 'Finance' },
];

function renderSwitcher(ui: React.ReactElement) {
  // No I18nProvider: useSafeLingui falls back to English defaults.
  return render(ui);
}

describe('<FolderSwitcher>', () => {
  it('renders the All folders sentinel when unscoped', () => {
    renderSwitcher(<FolderSwitcher folders={FOLDERS} value={null} onChange={() => {}} />);
    expect(screen.getByText('All folders')).toBeInTheDocument();
  });

  it('falls back to the sentinel label when the value is unknown', () => {
    renderSwitcher(<FolderSwitcher folders={FOLDERS} value="not-a-folder" onChange={() => {}} />);
    expect(screen.getByText('All folders')).toBeInTheDocument();
  });

  it('opens the menu and emits the picked folder id', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitcher(<FolderSwitcher folders={FOLDERS} value={null} onChange={onChange} />);

    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('menuitem', { name: /Finance/ }));

    expect(onChange).toHaveBeenCalledWith('guid-b');
    // Selecting closes the menu.
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('emits null when the All folders sentinel is picked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderSwitcher(<FolderSwitcher folders={FOLDERS} value="guid-a" onChange={onChange} />);

    expect(screen.getByText('Shared')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { expanded: false }));
    await user.click(screen.getByRole('menuitem', { name: /All folders/ }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('hides the sentinel when showAllFolders is false', async () => {
    const user = userEvent.setup();
    renderSwitcher(
      <FolderSwitcher folders={FOLDERS} value="guid-a" onChange={() => {}} showAllFolders={false} />
    );

    await user.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getAllByRole('menuitem')).toHaveLength(FOLDERS.length);
    expect(screen.queryByRole('menuitem', { name: /All folders/ })).not.toBeInTheDocument();
  });
});
