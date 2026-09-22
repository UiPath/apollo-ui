import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FolderPicker, FolderPickerContent, type FolderPickerEntry } from './folder-picker';

const TREE: Record<string, string[]> = {
  '': ['OneDrive', 'Shared with me'],
  OneDrive: ['Documents', 'Pictures'],
  'OneDrive/Documents': ['Reports'],
  'Shared with me': [],
};

const loadChildren = (path: string[]): Promise<FolderPickerEntry[]> =>
  Promise.resolve((TREE[path.join('/')] ?? []).map((name) => ({ name })));

describe('FolderPickerContent', () => {
  it('lists the root level and confirms a highlighted folder', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={onSelect} />);

    const row = await screen.findByRole('option', { name: 'OneDrive' });
    await user.click(row);
    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('disables Select at the root until something is highlighted', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('option', { name: 'OneDrive' });
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();

    await user.click(screen.getByRole('option', { name: 'OneDrive' }));
    expect(screen.getByRole('button', { name: 'Select' })).toBeEnabled();
  });

  it('drills in on the chevron and confirms the browsed folder with nothing highlighted', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    expect(await screen.findByRole('option', { name: 'Documents' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('drills in on double click', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.dblClick(await screen.findByRole('option', { name: 'OneDrive' }));
    expect(await screen.findByRole('option', { name: 'Pictures' })).toBeInTheDocument();
  });

  it('jumps back up through the breadcrumb', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await user.click(await screen.findByRole('button', { name: 'Open Documents' }));
    expect(await screen.findByRole('option', { name: 'Reports' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Root' }));
    expect(await screen.findByRole('option', { name: 'Shared with me' })).toBeInTheDocument();
  });

  it('caches a visited level instead of re-requesting it', async () => {
    const user = userEvent.setup();
    const spy = vi.fn(loadChildren);
    render(<FolderPickerContent onLoadChildren={spy} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('option', { name: 'Documents' });
    await user.click(screen.getByRole('button', { name: 'Root' }));
    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('option', { name: 'Documents' });

    // Root plus OneDrive: the second visit to OneDrive is served from cache.
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('filters the current level and shows a no-match message', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('option', { name: 'OneDrive' });
    await user.type(screen.getByPlaceholderText('Search...'), 'shared');

    expect(screen.getByRole('option', { name: 'Shared with me' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'OneDrive' })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search...'));
    await user.type(screen.getByPlaceholderText('Search...'), 'zzz');
    expect(screen.getByText(/No folders match/)).toBeInTheDocument();
  });

  it('clears the search through its clear control, which only appears with a value', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('option', { name: 'OneDrive' });
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search...'), 'shared');
    expect(screen.queryByRole('option', { name: 'OneDrive' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('option', { name: 'OneDrive' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('empties the search on Escape while keeping the browsed level', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('option', { name: 'Documents' });

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'pict');
    expect(screen.queryByRole('option', { name: 'Documents' })).not.toBeInTheDocument();

    await user.type(input, '{Escape}');
    expect(input).toHaveValue('');
    expect(screen.getByRole('option', { name: 'Documents' })).toBeInTheDocument();
  });

  it('shows an empty state for a folder with no subfolders', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open Shared with me' }));
    expect(await screen.findByText('No subfolders.')).toBeInTheDocument();
  });

  it('surfaces a load failure without losing the current list', async () => {
    const user = userEvent.setup();
    render(
      <FolderPickerContent
        onLoadChildren={(path) =>
          path.length > 0 ? Promise.reject(new Error('No access.')) : loadChildren(path)
        }
        onSelect={vi.fn()}
      />
    );

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    expect(await screen.findByText('No access.')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'OneDrive' })).toBeInTheDocument();
  });

  it('resumes browsing at the parent of initialPath with that folder highlighted', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        initialPath="/OneDrive/Documents"
      />
    );

    const row = await screen.findByRole('option', { name: 'Documents' });
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('hides the open affordance for a known leaf', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={() => Promise.resolve([{ name: 'Invoices', hasChildren: false }])}
        onSelect={vi.fn()}
      />
    );

    await screen.findByRole('option', { name: 'Invoices' });
    expect(screen.queryByRole('button', { name: 'Open Invoices' })).not.toBeInTheDocument();
  });
});

describe('FolderPicker', () => {
  it('opens from the field, confirms a folder and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Select a folder/ }));
    await user.click(await screen.findByRole('option', { name: 'OneDrive' }));
    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });
  });

  it('clears the value through the field control', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker value="/OneDrive" onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Clear folder' }));
    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('offers no clear control when there is no value', () => {
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Clear folder' })).not.toBeInTheDocument();
  });

  it('cancels without reporting a selection', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Select a folder/ }));
    await user.click(await screen.findByRole('option', { name: 'OneDrive' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
