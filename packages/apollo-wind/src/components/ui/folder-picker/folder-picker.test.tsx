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

/** Resolves each level only when the returned trigger is called. */
function deferredLoader() {
  const pending: Array<{ path: string; resolve: (entries: FolderPickerEntry[]) => void }> = [];
  const load = (path: string[]) =>
    new Promise<FolderPickerEntry[]>((resolve) => {
      pending.push({ path: path.join('/'), resolve });
    });
  const flush = (path: string) => {
    const hit = pending.find((p) => p.path === path);
    if (!hit) throw new Error(`no pending load for "${path}"`);
    hit.resolve((TREE[path] ?? []).map((name) => ({ name })));
  };
  return { load, flush, pending };
}

describe('FolderPickerContent', () => {
  it('lists the root level and confirms a highlighted folder', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={onSelect} />);

    const row = await screen.findByRole('treeitem', { name: 'OneDrive' });
    await user.click(row);
    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('marks the highlighted folder with a tick, not with the hover fill', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    const row = await screen.findByRole('treeitem', { name: 'OneDrive' });
    expect(row.querySelector('svg')).not.toBeNull(); // the folder glyph

    await user.click(row);
    expect(row).toHaveAttribute('aria-selected', 'true');

    // The fill belongs to the cursor, so a highlighted row must not claim it:
    // it resolves to the same value as the hover fill in every theme.
    expect(row).not.toHaveClass('bg-surface-overlay');
  });

  it('treats a folder named after an Object property as uncached', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    // `constructor` and `toString` resolve on the prototype chain, so an
    // object-keyed cache reports them as already loaded and hands back a
    // function in place of the level's rows.
    const load = vi.fn((path: string[]) =>
      Promise.resolve(
        path.length === 0 ? [{ name: 'constructor' }, { name: 'toString' }] : [{ name: 'Inside' }]
      )
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={onSelect} />);

    const row = await screen.findByRole('treeitem', { name: 'constructor' });
    await user.dblClick(row);

    // The level must be fetched, not read off the prototype.
    expect(await screen.findByRole('treeitem', { name: 'Inside' })).toBeInTheDocument();
    expect(load).toHaveBeenCalledWith(['constructor']);
  });

  it('opens a folder from the Open control by keyboard', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    // Focus the row's own Open control, then activate it the standard way.
    screen.getByRole('button', { name: 'Open OneDrive' }).focus();
    await user.keyboard('{Enter}');

    // The key must reach the button rather than being taken by the row, which
    // would toggle the draft and leave the level unchanged.
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
  });

  it('disables Select at the root until something is highlighted', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();

    await user.click(screen.getByRole('treeitem', { name: 'OneDrive' }));
    expect(screen.getByRole('button', { name: 'Select' })).toBeEnabled();
  });

  it('drills in on the chevron and confirms the browsed folder with nothing highlighted', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('drills in on double click', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.dblClick(await screen.findByRole('treeitem', { name: 'OneDrive' }));
    expect(await screen.findByRole('treeitem', { name: 'Pictures' })).toBeInTheDocument();
  });

  it('jumps back up through the breadcrumb', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await user.click(await screen.findByRole('button', { name: 'Open Documents' }));
    expect(await screen.findByRole('treeitem', { name: 'Reports' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Root' }));
    expect(await screen.findByRole('treeitem', { name: 'Shared with me' })).toBeInTheDocument();
  });

  it('caches a visited level instead of re-requesting it', async () => {
    const user = userEvent.setup();
    const spy = vi.fn(loadChildren);
    render(<FolderPickerContent onLoadChildren={spy} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('treeitem', { name: 'Documents' });
    await user.click(screen.getByRole('button', { name: 'Root' }));
    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('treeitem', { name: 'Documents' });

    // Root plus OneDrive: the second visit to OneDrive is served from cache.
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('filters the current level and shows a no-match message', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    await user.type(screen.getByPlaceholderText('Search...'), 'shared');

    expect(screen.getByRole('treeitem', { name: 'Shared with me' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'OneDrive' })).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText('Search...'));
    await user.type(screen.getByPlaceholderText('Search...'), 'zzz');
    expect(screen.getByText(/No folders match/)).toBeInTheDocument();
  });

  it('clears the search through its clear control, which only appears with a value', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();

    await user.type(screen.getByPlaceholderText('Search...'), 'shared');
    expect(screen.queryByRole('treeitem', { name: 'OneDrive' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByRole('treeitem', { name: 'OneDrive' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search...')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('empties the search on Escape while keeping the browsed level', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('treeitem', { name: 'Documents' });

    const input = screen.getByPlaceholderText('Search...');
    await user.type(input, 'pict');
    expect(screen.queryByRole('treeitem', { name: 'Documents' })).not.toBeInTheDocument();

    await user.type(input, '{Escape}');
    expect(input).toHaveValue('');
    expect(screen.getByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
  });

  it('does not let a slow request overwrite a later cached navigation', async () => {
    const user = userEvent.setup();
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    flush('');
    await screen.findByRole('treeitem', { name: 'OneDrive' });

    // Cache OneDrive, then come back to the root so it is served from cache.
    await user.click(screen.getByRole('button', { name: 'Open OneDrive' }));
    flush('OneDrive');
    await screen.findByRole('treeitem', { name: 'Documents' });
    await user.click(screen.getByRole('button', { name: 'Root' }));
    await screen.findByRole('treeitem', { name: 'OneDrive' });

    // Start a slow drill into the uncached "Shared with me", then navigate to
    // cached OneDrive before it resolves.
    await user.click(screen.getByRole('button', { name: 'Open Shared with me' }));
    await user.click(screen.getByRole('button', { name: 'Open OneDrive' }));
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();

    // The abandoned response must not pull the view back to "Shared with me".
    flush('Shared with me');
    await waitFor(() => {
      expect(screen.getByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
    });
    expect(screen.getByText('OneDrive')).toBeInTheDocument();
  });

  it('loads an uncached breadcrumb target and drops the stale draft', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={onSelect}
        initialPath="/OneDrive/Documents"
      />
    );

    await screen.findByRole('treeitem', { name: 'Documents' });

    // Root was never loaded, since browsing resumed at /OneDrive.
    await user.click(screen.getByRole('button', { name: 'Root' }));
    expect(await screen.findByRole('treeitem', { name: 'OneDrive' })).toBeInTheDocument();

    // The draft from the old level must not survive the jump.
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
  });

  it('waits for the first load instead of flashing an empty state', async () => {
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    expect(screen.queryByText('No subfolders.')).not.toBeInTheDocument();

    flush('');
    expect(await screen.findByRole('treeitem', { name: 'OneDrive' })).toBeInTheDocument();
  });

  it('does not drill into a known leaf by keyboard or double click', async () => {
    const user = userEvent.setup();
    const load = vi.fn(() => Promise.resolve([{ name: 'Invoices', hasChildren: false }]));
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    const row = await screen.findByRole('treeitem', { name: 'Invoices' });
    row.focus();
    await user.keyboard('{ArrowRight}');
    await user.dblClick(row);

    // Only the initial root load.
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('omits Cancel when the consumer provides no handler', async () => {
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it('seeds the search box from initialSearch', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        initialSearch="shared"
      />
    );

    expect(screen.getByPlaceholderText('Search...')).toHaveValue('shared');
    // The seed must survive the content's own first fetch.
    expect(await screen.findByRole('treeitem', { name: 'Shared with me' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'OneDrive' })).not.toBeInTheDocument();
  });

  it('drops a seeded search once the user navigates', async () => {
    const user = userEvent.setup();
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        initialSearch="shared"
      />
    );

    await user.click(await screen.findByRole('button', { name: 'Open Shared with me' }));
    expect(screen.getByPlaceholderText('Search...')).toHaveValue('');
  });

  it('gives the list an accessible name', async () => {
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);
    expect(await screen.findByRole('tree', { name: 'Folders' })).toBeInTheDocument();
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
    expect(screen.getByRole('treeitem', { name: 'OneDrive' })).toBeInTheDocument();
  });

  it('resumes browsing at the parent of initialPath with that folder highlighted', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        initialPath="/OneDrive/Documents"
      />
    );

    const row = await screen.findByRole('treeitem', { name: 'Documents' });
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('hides the open affordance for a known leaf', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={() => Promise.resolve([{ name: 'Invoices', hasChildren: false }])}
        onSelect={vi.fn()}
      />
    );

    await screen.findByRole('treeitem', { name: 'Invoices' });
    expect(screen.queryByRole('button', { name: 'Open Invoices' })).not.toBeInTheDocument();
  });
});

describe('FolderPicker', () => {
  it('opens from the field, confirms a folder and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /Select a folder/ }));
    await user.click(await screen.findByRole('treeitem', { name: 'OneDrive' }));
    await user.click(screen.getByRole('button', { name: 'Select' }));

    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });
  });

  it('puts focus in the search when it opens', async () => {
    const user = userEvent.setup();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Select a folder/ }));

    expect(await screen.findByPlaceholderText('Search...')).toHaveFocus();
  });

  it('clears the value through the field control', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker value="/OneDrive" onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Clear folder' }));
    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('keeps a custom trigger inert while disabled', async () => {
    const user = userEvent.setup();
    render(
      <FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} disabled>
        <button type="button">Choose folder</button>
      </FolderPicker>
    );

    await user.click(screen.getByRole('button', { name: 'Choose folder' }));
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
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
    await user.click(await screen.findByRole('treeitem', { name: 'OneDrive' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
