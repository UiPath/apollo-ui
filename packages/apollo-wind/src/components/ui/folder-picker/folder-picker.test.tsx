import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  FolderPicker,
  FolderPickerContent,
  type FolderPickerEntry,
  keepFolderSearchOnEscape,
} from './folder-picker';

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

  it('makes the tree a single tab stop', async () => {
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    const tree = screen.getByRole('tree');
    const tabStops = tree.querySelectorAll('[tabindex="0"]');
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0]).toBe(screen.getByRole('treeitem', { name: 'OneDrive' }));
    expect(screen.getByRole('button', { name: 'Open OneDrive' })).toHaveAttribute('tabindex', '-1');
  });

  it('moves between rows with the arrow, Home and End keys', async () => {
    const user = userEvent.setup();
    const load = vi.fn(() =>
      Promise.resolve([{ name: 'A' }, { name: 'B', disabled: true }, { name: 'C' }, { name: 'D' }])
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    const a = await screen.findByRole('treeitem', { name: 'A' });
    a.focus();
    await user.keyboard('{ArrowDown}');
    // Disabled rows are skipped.
    expect(screen.getByRole('treeitem', { name: 'C' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('treeitem', { name: 'D' })).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('treeitem', { name: 'C' })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(a).toHaveFocus();
    expect(a).toHaveAttribute('tabindex', '0');
  });

  it('follows focus into an opened folder and back out with ArrowLeft', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    const oneDrive = await screen.findByRole('treeitem', { name: 'OneDrive' });
    oneDrive.focus();
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'Documents' })).toHaveFocus());

    await user.keyboard('{ArrowLeft}');
    // Back at the root, on the folder just left.
    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'OneDrive' })).toHaveFocus());
  });

  it('drops entries whose name would collide with another path', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const load = vi.fn(() => Promise.resolve([{ name: 'a/b' }, { name: '' }, { name: 'a' }]));
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    expect(await screen.findByRole('treeitem', { name: 'a' })).toBeInTheDocument();
    expect(screen.getAllByRole('treeitem')).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps only the first of two siblings with the same name', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const load = vi.fn(() =>
      Promise.resolve([
        { name: 'Docs', label: 'First' },
        { name: 'Docs', label: 'Second' },
      ])
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    expect(await screen.findByRole('treeitem', { name: 'First' })).toBeInTheDocument();
    expect(screen.queryByRole('treeitem', { name: 'Second' })).not.toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('keeps focus in the tree after a breadcrumb jump', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('treeitem', { name: 'Documents' });
    screen.getByRole('button', { name: 'Root' }).focus();
    await user.keyboard('{Enter}');

    // Lands on the folder just left, not on the document body.
    await waitFor(() => expect(screen.getByRole('treeitem', { name: 'OneDrive' })).toHaveFocus());
  });

  it('returns focus to the search input when the search is cleared', async () => {
    const user = userEvent.setup();
    render(
      <FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} initialSearch="One" />
    );

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    screen.getByRole('button', { name: 'Clear search' }).focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('textbox', { name: 'Search...' })).toHaveFocus();
    expect(screen.getByRole('textbox', { name: 'Search...' })).toHaveValue('');
  });

  it('treats an initialPath of "/" as the root, with nothing to confirm', async () => {
    render(
      <FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} initialPath="/" />
    );

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
  });

  it('matches a non-canonical initialPath to its row', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        initialPath="/OneDrive//Documents/"
      />
    );

    const row = await screen.findByRole('treeitem', { name: 'Documents' });
    expect(row).toHaveAttribute('aria-selected', 'true');
  });

  it('reports a failure whose error has no message', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={() => Promise.reject(new Error(''))}
        onSelect={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this folder.');
    expect(screen.queryByText('No subfolders.')).not.toBeInTheDocument();
  });

  it("states each row's depth with aria-level", async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    expect(await screen.findByRole('treeitem', { name: 'OneDrive' })).toHaveAttribute(
      'aria-level',
      '1'
    );
    await user.click(screen.getByRole('button', { name: 'Open OneDrive' }));
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toHaveAttribute(
      'aria-level',
      '2'
    );
  });

  it('leaves focus where the user moved it during a slow load', async () => {
    const user = userEvent.setup();
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    flush('');
    const row = await screen.findByRole('treeitem', { name: 'OneDrive' });
    row.focus();
    await user.keyboard('{ArrowRight}');

    // The user moves on to the search while OneDrive is still loading.
    const search = screen.getByRole('textbox', { name: 'Search...' });
    search.focus();
    flush('OneDrive');

    await screen.findByRole('treeitem', { name: 'Documents' });
    expect(search).toHaveFocus();
  });

  it('drops an initialPath its parent no longer lists', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        initialPath="/Missing"
      />
    );

    await screen.findByRole('treeitem', { name: 'OneDrive' });
    // Nothing is highlighted and the root cannot be confirmed.
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
  });

  it('returns focus to the folder whose open failed', async () => {
    const user = userEvent.setup();
    render(
      <FolderPickerContent
        onLoadChildren={(path) =>
          path.length > 0 ? Promise.reject(new Error('No access.')) : loadChildren(path)
        }
        onSelect={vi.fn()}
      />
    );

    const shared = await screen.findByRole('treeitem', { name: 'Shared with me' });
    shared.focus();
    await user.keyboard('{ArrowRight}');

    await screen.findByRole('alert');
    expect(shared).toHaveFocus();
    expect(shared).toHaveAttribute('tabindex', '0');
  });

  it('keeps the row the user moved to when a slow open fails', async () => {
    const user = userEvent.setup();
    let reject: (reason: Error) => void = () => {};
    render(
      <FolderPickerContent
        onLoadChildren={(path) =>
          path.length > 0
            ? new Promise((_, fail) => {
                reject = fail;
              })
            : loadChildren(path)
        }
        onSelect={vi.fn()}
      />
    );

    const oneDrive = await screen.findByRole('treeitem', { name: 'OneDrive' });
    const shared = screen.getByRole('treeitem', { name: 'Shared with me' });
    oneDrive.focus();
    await user.keyboard('{ArrowRight}');
    // The old level stays usable while OneDrive loads, and Down moves on from
    // the row being opened, not from the first row.
    await user.keyboard('{ArrowDown}');
    expect(shared).toHaveFocus();

    reject(new Error('No access.'));
    await screen.findByRole('alert');
    expect(shared).toHaveFocus();
    expect(shared).toHaveAttribute('tabindex', '0');
    expect(oneDrive).toHaveAttribute('tabindex', '-1');
  });

  it('hands focus to the rows once a retry loads them', async () => {
    const user = userEvent.setup();
    const load = vi
      .fn<(path: string[]) => Promise<FolderPickerEntry[]>>()
      .mockRejectedValueOnce(new Error('Offline.'))
      .mockImplementation(loadChildren);
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    const first = await screen.findByRole('treeitem', { name: 'OneDrive' });
    await waitFor(() => expect(first).toHaveFocus());
  });

  it('keeps focus on the list while a retry is in flight', async () => {
    const user = userEvent.setup();
    let attempts = 0;
    render(
      <FolderPickerContent
        onLoadChildren={() =>
          attempts++ === 0 ? Promise.reject(new Error('Offline.')) : new Promise(() => {})
        }
        onSelect={vi.fn()}
      />
    );

    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('Loading…')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Folders' })).toHaveFocus();
  });

  it('retries the crumb target that failed, not the level left on screen', async () => {
    const user = userEvent.setup();
    const load = vi
      .fn<(path: string[]) => Promise<FolderPickerEntry[]>>()
      .mockRejectedValueOnce(new Error('OneDrive offline.'))
      .mockRejectedValueOnce(new Error('Root offline.'))
      .mockImplementation(loadChildren);
    render(
      <FolderPickerContent
        onLoadChildren={load}
        onSelect={vi.fn()}
        initialPath="/OneDrive/Documents"
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('OneDrive offline.');
    await user.click(screen.getByRole('button', { name: 'Root' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Root offline.');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(load).toHaveBeenLastCalledWith([]);
    expect(await screen.findByRole('treeitem', { name: 'Shared with me' })).toBeInTheDocument();
  });

  it('keeps the search when retrying the level on screen', async () => {
    const user = userEvent.setup();
    const load = vi
      .fn<(path: string[]) => Promise<FolderPickerEntry[]>>()
      .mockRejectedValueOnce(new Error('Offline.'))
      .mockImplementation(loadChildren);
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} initialSearch="One" />);

    await screen.findByRole('alert');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('treeitem', { name: 'OneDrive' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search...' })).toHaveValue('One');
    expect(screen.queryByRole('treeitem', { name: 'Shared with me' })).not.toBeInTheDocument();
  });

  it('keeps messages out of the tree, which owns only treeitems', async () => {
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
    const alert = await screen.findByRole('alert');
    const tree = screen.getByRole('tree');
    expect(tree).not.toContainElement(alert);
    for (const child of Array.from(tree.children)) {
      expect(child).toHaveAttribute('role', 'treeitem');
    }
  });

  it('renders no empty tree for a folder with no subfolders', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open Shared with me' }));
    expect(await screen.findByText('No subfolders.')).toBeInTheDocument();
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });

  it('retries a first load that failed, without keeping the initial path', async () => {
    const user = userEvent.setup();
    const load = vi
      .fn<(path: string[]) => Promise<FolderPickerEntry[]>>()
      .mockRejectedValueOnce(new Error('Offline.'))
      .mockImplementation(loadChildren);
    render(
      <FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} initialPath="/OneDrive" />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Offline.');
    // Nothing on screen vouches for `/OneDrive`.
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('treeitem', { name: 'OneDrive' })).toBeInTheDocument();
  });

  it('labels breadcrumb segments as their rows were labelled', async () => {
    const user = userEvent.setup();
    const load = vi.fn((path: string[]) =>
      Promise.resolve(path.length === 0 ? [{ name: 'f-42', label: 'Invoices' }] : [])
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open Invoices' }));
    await screen.findByText('No subfolders.');
    expect(
      screen.getByText('Invoices', { selector: '[data-slot="breadcrumb-page"]' })
    ).toBeInTheDocument();
    expect(screen.queryByText('f-42')).not.toBeInTheDocument();
  });

  it('does not let a click on a disabled row take the roving focus', async () => {
    const user = userEvent.setup();
    const load = vi.fn(() =>
      Promise.resolve([{ name: 'A' }, { name: 'C' }, { name: 'B', disabled: true }])
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    const disabledRow = await screen.findByRole('treeitem', { name: 'B' });
    await user.click(disabledRow);
    expect(disabledRow).not.toHaveFocus();
    expect(disabledRow).not.toHaveAttribute('tabindex');
    expect(screen.getByRole('treeitem', { name: 'A' })).toHaveAttribute('tabindex', '0');
  });

  it('lets Left climb back out of an empty folder', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    const shared = await screen.findByRole('treeitem', { name: 'Shared with me' });
    shared.focus();
    await user.keyboard('{ArrowRight}');
    await screen.findByText('No subfolders.');

    // Focus falls back to the list region, which still answers Left.
    await user.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(screen.getByRole('treeitem', { name: 'Shared with me' })).toHaveFocus()
    );
  });

  it('keeps a failed drill as an inline alert while the search hides every row', async () => {
    const user = userEvent.setup();
    const load = vi.fn((path: string[]) =>
      path.length > 0 ? Promise.reject(new Error('No access.')) : loadChildren(path)
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('alert');
    await user.type(screen.getByRole('textbox', { name: 'Search...' }), 'zzz');

    expect(screen.getByRole('alert')).toHaveTextContent('No access.');
    expect(screen.getByText('No folders match “zzz”.')).toBeInTheDocument();
    // No Retry: it would re-request the cached level, not the failed folder.
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  it('drops a search typed into the old level while the next one loads', async () => {
    const user = userEvent.setup();
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    flush('');
    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    const search = screen.getByRole('textbox', { name: 'Search...' });
    await user.type(search, 'Pic');
    flush('OneDrive');

    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
    expect(search).toHaveValue('');
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

  it('drops a row highlighted on the old level while a drill is pending', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={onSelect} />);

    flush('');
    await screen.findByRole('treeitem', { name: 'OneDrive' });

    // The root stays clickable while OneDrive is in flight.
    await user.click(screen.getByRole('button', { name: 'Open OneDrive' }));
    await user.click(screen.getByRole('treeitem', { name: 'Shared with me' }));

    flush('OneDrive');
    await screen.findByRole('treeitem', { name: 'Documents' });

    // Select must confirm the folder on screen, not the sibling left behind.
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('ignores another jump to a crumb that is already loading', async () => {
    const user = userEvent.setup();
    const { load, flush, pending } = deferredLoader();
    render(
      <FolderPickerContent
        onLoadChildren={load}
        onSelect={vi.fn()}
        initialPath="/OneDrive/Documents/Reports"
      />
    );

    flush('OneDrive/Documents');
    await screen.findByRole('treeitem', { name: 'Reports' });
    const crumb = screen.getByRole('button', { name: 'OneDrive' });
    await user.click(crumb);
    await user.click(crumb);

    // The first level plus a single request for OneDrive.
    expect(pending.map((p) => p.path)).toEqual(['OneDrive/Documents', 'OneDrive']);
    flush('OneDrive');
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
  });

  it('keeps a leaf highlighted after a double click, which cannot open it', async () => {
    const user = userEvent.setup();
    const load = vi.fn((path: string[]) =>
      Promise.resolve(path.length === 0 ? [{ name: 'Notes', hasChildren: false }] : [])
    );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    const leaf = await screen.findByRole('treeitem', { name: 'Notes' });
    await user.dblClick(leaf);
    expect(leaf).toHaveAttribute('aria-selected', 'true');
    // Already highlighted, it stays so rather than toggling off.
    await user.dblClick(leaf);
    expect(leaf).toHaveAttribute('aria-selected', 'true');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('ignores another open on a row that is already loading', async () => {
    const user = userEvent.setup();
    const { load, flush, pending } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    flush('');
    const row = await screen.findByRole('treeitem', { name: 'OneDrive' });

    await user.click(screen.getByRole('button', { name: 'Open OneDrive' }));
    await user.dblClick(row);
    row.focus();
    await user.keyboard('{ArrowRight}');

    // The root plus a single request for OneDrive.
    expect(pending.map((p) => p.path)).toEqual(['', 'OneDrive']);
    flush('OneDrive');
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toBeInTheDocument();
  });

  it('keeps focus on the Open control while its folder loads', async () => {
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    flush('');
    const open = await screen.findByRole('button', { name: 'Open OneDrive' });
    open.focus();
    // As assistive technology activates it, without pointer events.
    open.click();

    await waitFor(() => expect(open).toHaveAttribute('aria-busy', 'true'));
    expect(open).toBeInTheDocument();
    expect(open).toHaveFocus();
  });

  it('leaves focus on an Open control whose folder failed to load', async () => {
    const user = userEvent.setup();
    render(
      <FolderPickerContent
        onLoadChildren={(path) =>
          path.length > 0 ? Promise.reject(new Error('No access.')) : loadChildren(path)
        }
        onSelect={vi.fn()}
      />
    );

    // Not the active row, which is OneDrive, the first.
    const open = await screen.findByRole('button', { name: 'Open Shared with me' });
    await user.click(open);

    await screen.findByRole('alert');
    expect(open).toHaveFocus();
  });

  it('confirms nothing until the level on screen has loaded', async () => {
    const { load, flush } = deferredLoader();
    render(
      <FolderPickerContent
        onLoadChildren={load}
        onSelect={vi.fn()}
        initialPath="/OneDrive/Documents"
      />
    );

    // Neither the initial path nor the folder being browsed is vouched for yet.
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();
    flush('OneDrive');
    await screen.findByRole('treeitem', { name: 'Documents' });
    expect(screen.getByRole('button', { name: 'Select' })).toBeEnabled();
  });

  it('keeps a cached level confirmable while a drill from it loads', async () => {
    const user = userEvent.setup();
    const { load, flush } = deferredLoader();
    const onSelect = vi.fn();
    render(<FolderPickerContent onLoadChildren={load} onSelect={onSelect} />);

    flush('');
    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    flush('OneDrive');
    await user.click(await screen.findByRole('button', { name: 'Open Documents' }));
    // Documents is in flight, and OneDrive, already loaded, is still on screen.
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('keeps the row spinner out of the accessibility tree', async () => {
    const user = userEvent.setup();
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    flush('');
    const open = await screen.findByRole('button', { name: 'Open OneDrive' });
    await user.click(open);
    expect(open).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not confirm a highlighted folder the search has hidden', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(await screen.findByRole('treeitem', { name: 'OneDrive' }));
    const search = screen.getByRole('textbox', { name: 'Search...' });
    await user.type(search, 'Shared');
    // Nothing highlighted is on screen, and the root cannot be confirmed.
    expect(screen.getByRole('button', { name: 'Select' })).toBeDisabled();

    // Emptying the search brings the highlight back.
    await user.clear(search);
    expect(screen.getByRole('treeitem', { name: 'OneDrive' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('keeps breadcrumb separators beside their items, not nested in them', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />
    );

    await user.click(await screen.findByRole('button', { name: 'Open OneDrive' }));
    await screen.findByRole('treeitem', { name: 'Documents' });

    expect(container.querySelectorAll('[data-slot="breadcrumb-separator"]')).toHaveLength(1);
    expect(container.querySelector('li li')).toBeNull();
  });

  it('waits for the first load instead of flashing an empty state', async () => {
    const { load, flush } = deferredLoader();
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    expect(screen.queryByText('No subfolders.')).not.toBeInTheDocument();
    // Loading from the very first render, not only once the effect has run.
    expect(screen.getByText('Loading…')).toBeInTheDocument();
    expect(screen.getByRole('tree')).toHaveAttribute('aria-busy', 'true');

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
    expect(await screen.findByRole('alert')).toHaveTextContent('No access.');
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
  it('shows consumer wording for a load failure that has no message', async () => {
    render(
      <FolderPickerContent
        onLoadChildren={() => Promise.reject('offline')}
        onSelect={vi.fn()}
        loadErrorText="Ordner konnte nicht geladen werden."
      />
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ordner konnte nicht geladen werden.'
    );
  });

  it('moves focus into a level holding a folder named like its parent', async () => {
    const user = userEvent.setup();
    const load = (path: string[]) =>
      Promise.resolve(
        path.length === 0
          ? [{ name: 'Zeta' }, { name: 'A' }]
          : path.length === 1
            ? [{ name: 'Beta' }, { name: 'A' }]
            : []
      );
    render(<FolderPickerContent onLoadChildren={load} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open A' }));
    // The new level's first row, not the same-named row's Open control.
    expect(await screen.findByRole('treeitem', { name: 'Beta' })).toHaveFocus();
  });

  it('lets the list be tabbed back into when no row can take focus', async () => {
    const user = userEvent.setup();
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(await screen.findByRole('button', { name: 'Open Shared with me' }));
    await screen.findByText('No subfolders.');
    const list = screen.getByRole('group', { name: 'Folders' });
    expect(list).toHaveAttribute('tabindex', '0');

    // Out to the footer and back in with Shift+Tab, then up a level.
    await user.tab();
    await user.tab({ shift: true });
    expect(list).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(await screen.findByRole('treeitem', { name: 'Shared with me' })).toHaveFocus();
  });

  it('keeps the list out of the tab order while a row holds the tab stop', async () => {
    render(<FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />);
    await screen.findByRole('treeitem', { name: 'OneDrive' });
    expect(screen.getByRole('group', { name: 'Folders' })).toHaveAttribute('tabindex', '-1');
  });

  it('takes consumer wording for the no-match, clear-search and Open labels', async () => {
    const user = userEvent.setup();
    render(
      <FolderPickerContent
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        noMatchText={(query) => `Nichts für ${query}`}
        clearSearchLabel="Suche leeren"
        openFolderLabel={(label) => `${label} öffnen`}
        breadcrumbLabel="Pfad"
      />
    );

    expect(screen.getByRole('navigation', { name: 'Pfad' })).toBeInTheDocument();

    expect(await screen.findByRole('button', { name: 'OneDrive öffnen' })).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Search...' }), 'zzz');
    expect(screen.getByRole('status')).toHaveTextContent('Nichts für zzz');
    expect(screen.getByRole('button', { name: 'Suche leeren' })).toBeInTheDocument();
  });
});

describe('FolderPicker', () => {
  it('opens from the field, confirms a folder and closes', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('combobox'));
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

    await user.click(screen.getByRole('combobox'));

    expect(await screen.findByPlaceholderText('Search...')).toHaveFocus();
  });

  it('names the popover dialog, with consumer wording when given', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByRole('dialog', { name: 'Choose a folder' })).toBeInTheDocument();

    rerender(
      <FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} dialogLabel="Ordner wählen" />
    );
    expect(screen.getByRole('dialog', { name: 'Ordner wählen' })).toBeInTheDocument();
  });

  it('announces the selected path with the field label', () => {
    render(
      <>
        <span id="folder-label">In location</span>
        <FolderPicker
          aria-labelledby="folder-label"
          value="/Finance"
          onLoadChildren={loadChildren}
          onSelect={vi.fn()}
        />
      </>
    );
    // The label names the field, and the path stays in it as its value.
    const field = screen.getByRole('combobox', { name: 'In location' });
    expect(field).toHaveTextContent('/Finance');
    expect(field).toHaveAttribute('aria-haspopup', 'dialog');
  });

  it('lets a hosting Dialog hold open on Escape from a row while the search has text', async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onOpenChange={vi.fn()}>
        <DialogContent onEscapeKeyDown={keepFolderSearchOnEscape}>
          <DialogTitle>Move to</DialogTitle>
          <FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />
        </DialogContent>
      </Dialog>
    );

    const search = await screen.findByRole('textbox', { name: 'Search...' });
    await user.type(search, 'One');
    screen.getByRole('treeitem', { name: 'OneDrive' }).focus();
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('lets a hosting Dialog clear the search on Escape before it dismisses', async () => {
    const user = userEvent.setup();
    function Host() {
      const [open, setOpen] = useState(true);
      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent onEscapeKeyDown={keepFolderSearchOnEscape}>
            <DialogTitle>Move to</DialogTitle>
            <FolderPickerContent onLoadChildren={loadChildren} onSelect={vi.fn()} />
          </DialogContent>
        </Dialog>
      );
    }
    render(<Host />);

    const search = await screen.findByRole('textbox', { name: 'Search...' });
    await user.type(search, 'One');
    await user.keyboard('{Escape}');
    expect(search).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('clears the value through the field control', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<FolderPicker value="/OneDrive" onLoadChildren={loadChildren} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Clear folder' }));
    expect(onSelect).toHaveBeenCalledWith('');
  });

  it('moves focus to the field when the clear control is used from the keyboard', async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState('/OneDrive');
      return <FolderPicker value={value} onLoadChildren={loadChildren} onSelect={setValue} />;
    }
    render(<Controlled />);

    screen.getByRole('button', { name: 'Clear folder' }).focus();
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('button', { name: 'Clear folder' })).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveFocus();
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

  it('refuses to open from a non-native custom trigger while disabled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <FolderPicker
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        onOpenChange={onOpenChange}
        disabled
      >
        <span>Choose folder</span>
      </FolderPicker>
    );

    // A span ignores the `disabled` attribute, so the guard must be in state.
    await user.click(screen.getByText('Choose folder'));
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('clears the search on Escape without closing the popover', async () => {
    const user = userEvent.setup();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    const input = await screen.findByPlaceholderText('Search...');
    await user.type(input, 'One');
    await user.keyboard('{Escape}');

    expect(input).toHaveValue('');
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();

    // With the search empty, Escape dismisses as usual.
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });
  });

  it('pads the field text clear of the overlaid trailing controls', () => {
    const width = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(40);
    render(
      <FolderPicker
        value="/OneDrive"
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Mode</button>}
      />
    );

    // The measured overlay, its `right-2` offset and a 12px gap.
    expect(screen.getByRole('combobox')).toHaveStyle({ paddingRight: '60px' });
    width.mockRestore();
  });

  it('takes its accessible name from a visible label', () => {
    render(
      <>
        <span id="folder-label">In location</span>
        <FolderPicker
          aria-labelledby="folder-label"
          onLoadChildren={loadChildren}
          onSelect={vi.fn()}
        />
      </>
    );

    expect(screen.getByRole('combobox', { name: 'In location' })).toBeInTheDocument();
  });

  it('associates with a label through id', () => {
    render(
      <>
        <label htmlFor="folder-field">Destination</label>
        <FolderPicker id="folder-field" onLoadChildren={loadChildren} onSelect={vi.fn()} />
      </>
    );

    expect(screen.getByRole('combobox', { name: 'Destination' })).toBeInTheDocument();
  });

  it('clears the search on Escape from a row, then closes on the next', async () => {
    const user = userEvent.setup();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    const input = await screen.findByPlaceholderText('Search...');
    await user.type(input, 'One');
    screen.getByRole('treeitem', { name: 'OneDrive' }).focus();
    await user.keyboard('{Escape}');

    expect(input).toHaveValue('');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('follows a value changed while open', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    function Host() {
      const [value, setValue] = useState('/OneDrive');
      return (
        <>
          <button type="button" onClick={() => setValue('/OneDrive/Documents')}>
            Reset
          </button>
          <FolderPicker value={value} open onLoadChildren={loadChildren} onSelect={onSelect} />
        </>
      );
    }
    render(<Host />);

    expect(await screen.findByRole('treeitem', { name: 'OneDrive' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(screen.getByRole('button', { name: 'Reset' }));

    // The browser moves to the new value's parent, with the new value highlighted.
    expect(await screen.findByRole('treeitem', { name: 'Documents' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive/Documents');
  });

  it('does not confirm a new value before its level has loaded', async () => {
    const user = userEvent.setup();
    const { load, flush } = deferredLoader();
    const onSelect = vi.fn();
    let setValue: (value: string) => void = () => {};
    function Host() {
      const [value, set] = useState('/OneDrive/Documents');
      setValue = set;
      return <FolderPicker value={value} open onLoadChildren={load} onSelect={onSelect} />;
    }
    render(<Host />);

    flush('OneDrive');
    await screen.findByRole('treeitem', { name: 'Documents' });
    act(() => setValue('/OneDrive/Documents/Reports'));

    // The new path's level is in flight, so the folder on screen is confirmed.
    await user.click(screen.getByRole('button', { name: 'Select' }));
    expect(onSelect).toHaveBeenCalledWith('/OneDrive');
  });

  it('keeps focus in the picker when the value moves it to another level', async () => {
    let setValue: (value: string) => void = () => {};
    function Host() {
      const [value, set] = useState('/OneDrive');
      setValue = set;
      return <FolderPicker value={value} open onLoadChildren={loadChildren} onSelect={vi.fn()} />;
    }
    render(<Host />);

    const row = await screen.findByRole('treeitem', { name: 'OneDrive' });
    row.focus();
    // An async update, such as a saved value loading, that does not move focus.
    act(() => setValue('/OneDrive/Documents/Reports'));

    const reports = await screen.findByRole('treeitem', { name: 'Reports' });
    await waitFor(() => expect(reports).toHaveFocus());
  });

  it('points the trigger at the dialog it opens', async () => {
    const user = userEvent.setup();
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} />);

    const field = screen.getByRole('combobox');
    await user.click(field);
    const dialog = await screen.findByRole('dialog');
    expect(field).toHaveAttribute('aria-controls', dialog.id);
  });

  it('does not load again when a pick closes the popover', async () => {
    const user = userEvent.setup();
    const load = vi.fn(loadChildren);
    function Host() {
      const [value, setValue] = useState('');
      return <FolderPicker value={value} onLoadChildren={load} onSelect={setValue} />;
    }
    render(<Host />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('treeitem', { name: 'OneDrive' }));
    await user.click(screen.getByRole('button', { name: 'Select' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    expect(screen.getByRole('combobox')).toHaveTextContent('/OneDrive');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not load again as it closes', async () => {
    const user = userEvent.setup();
    const load = vi.fn(loadChildren);
    render(<FolderPicker onLoadChildren={load} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('treeitem', { name: 'OneDrive' });
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('leaves the trailing adornment to a custom trigger', () => {
    render(
      <FolderPicker
        value="/OneDrive"
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Mode</button>}
      >
        <button type="button">Choose folder</button>
      </FolderPicker>
    );

    expect(screen.queryByRole('button', { name: 'Mode' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear folder' })).not.toBeInTheDocument();
  });

  it('closes when disabled while open, and stays closed once re-enabled', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} onOpenChange={onOpenChange} />
    );

    await user.click(screen.getByRole('combobox'));
    await screen.findByRole('treeitem', { name: 'OneDrive' });

    rerender(
      <FolderPicker
        onLoadChildren={loadChildren}
        onSelect={vi.fn()}
        onOpenChange={onOpenChange}
        disabled
      />
    );
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    rerender(
      <FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} onOpenChange={onOpenChange} />
    );
    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('ignores open while disabled', () => {
    render(<FolderPicker onLoadChildren={loadChildren} onSelect={vi.fn()} open disabled />);
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

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('treeitem', { name: 'OneDrive' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
