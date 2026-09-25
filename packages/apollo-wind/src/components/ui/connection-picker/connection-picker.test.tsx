import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionPicker } from './connection-picker';
import type { Connection } from './types';

const CONNECTIONS: Connection[] = [
  {
    id: 'ops',
    name: 'Outlook Ops',
    account: 'ops@contoso.com',
    status: 'broken',
    statusReason: 'Token expired. Sign in again to restore access.',
  },
  { id: 'work', name: 'Outlook Work', account: 'jane@contoso.com' },
  {
    id: 'finance',
    name: 'Outlook Finance',
    account: 'finance@contoso.com',
    status: 'warning',
  },
  { id: 'shared', name: 'Outlook Shared', folder: 'Shared' },
];

const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Select connection/ }));
  return screen.findByRole('listbox');
};

describe('ConnectionPicker', () => {
  it('groups by folder and names rows by account, falling back to the name', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    expect(screen.getByRole('button', { name: /My Workspace/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Shared/ })).toHaveTextContent('1');
    expect(screen.getByRole('option', { name: 'jane@contoso.com' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Outlook Shared' })).toBeInTheDocument();
  });

  it('sorts broken connections to the end of their folder', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    const list = await openPicker(user);

    const names = within(list)
      .getAllByRole('option')
      .map((option) => option.getAttribute('aria-label'));
    expect(names.slice(0, 3)).toEqual([
      'jane@contoso.com',
      'finance@contoso.com',
      'ops@contoso.com',
    ]);
  });

  it('shows each row health as its second line', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    expect(screen.getByRole('option', { name: 'ops@contoso.com' })).toHaveTextContent('Broken');
    expect(screen.getByRole('option', { name: 'finance@contoso.com' })).toHaveTextContent(
      'Missing scopes'
    );
    expect(screen.getByRole('option', { name: 'jane@contoso.com' })).toHaveTextContent('Connected');
  });

  it('finds a connection by its name when the row shows the account', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    await user.type(screen.getByRole('combobox'), 'Outlook Work');

    expect(screen.getByRole('option', { name: 'jane@contoso.com' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'ops@contoso.com' })).not.toBeInTheDocument();
  });

  it('lists a folder whole when the search matches its name', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    await user.type(screen.getByRole('combobox'), 'workspace');

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.queryByRole('option', { name: 'Outlook Shared' })).not.toBeInTheDocument();
  });

  it('commits the connection object', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={onSelect} />);
    await openPicker(user);

    await user.click(screen.getByRole('option', { name: 'jane@contoso.com' }));

    expect(onSelect).toHaveBeenCalledWith(CONNECTIONS[1]);
  });

  it('offers Fix on broken rows only, without committing the row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onFix = vi.fn();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={onSelect} onFix={onFix} />);
    await openPicker(user);

    expect(screen.queryByRole('button', { name: 'Fix jane@contoso.com' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fix ops@contoso.com' }));

    expect(onFix).toHaveBeenCalledWith(CONNECTIONS[0]);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('offers Edit on every row', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} onEdit={onEdit} />);
    await openPicker(user);

    await user.click(screen.getByRole('button', { name: 'Edit Outlook Shared' }));
    expect(onEdit).toHaveBeenCalledWith(CONNECTIONS[3]);
  });

  it('puts a broken choice in the error state with its reason and a Fix', async () => {
    const user = userEvent.setup();
    const onFix = vi.fn();
    render(
      <ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="ops" onFix={onFix} />
    );

    const field = screen.getByRole('button', { name: /ops@contoso.com/ });
    const message = screen.getByText('Token expired');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', message.id);
    expect(message).toHaveAttribute('title', 'Token expired. Sign in again to restore access.');

    await user.click(screen.getByRole('button', { name: 'Fix' }));
    expect(onFix).toHaveBeenCalledWith(CONNECTIONS[0]);
  });

  it('warns rather than errs for missing scopes', () => {
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="finance" />);

    const field = screen.getByRole('button', { name: /finance@contoso.com/ });
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).toHaveAttribute('data-status', 'warning');
    expect(screen.getByText('Missing scopes')).toBeInTheDocument();
  });

  it('names the chosen health for assistive technology', () => {
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="work" />);
    expect(screen.getByRole('img', { name: 'Connected' })).toBeInTheDocument();
  });

  it('shows a validation error in place of the health message', () => {
    render(
      <ConnectionPicker
        connections={CONNECTIONS}
        onSelect={vi.fn()}
        error="Connection is required."
      />
    );

    expect(screen.getByRole('button', { name: /Select connection/ })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(screen.getByText('Connection is required.')).toBeInTheDocument();
  });

  it('starts a new connection from the field when there are none', async () => {
    const user = userEvent.setup();
    const onAddConnection = vi.fn();
    render(
      <ConnectionPicker connections={[]} onSelect={vi.fn()} onAddConnection={onAddConnection} />
    );

    await user.click(screen.getByRole('button', { name: 'Add connection' }));

    expect(onAddConnection).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('offers a footer link to add a connection', async () => {
    const user = userEvent.setup();
    const onAddConnection = vi.fn();
    render(
      <ConnectionPicker
        connections={CONNECTIONS}
        onSelect={vi.fn()}
        onAddConnection={onAddConnection}
      />
    );
    await openPicker(user);

    await user.click(screen.getByRole('button', { name: /Add new connection/ }));
    expect(onAddConnection).toHaveBeenCalledTimes(1);
  });

  it('refreshes the chosen schema from the field menu', async () => {
    const user = userEvent.setup();
    const onRefreshSchema = vi.fn().mockResolvedValue(undefined);
    render(
      <ConnectionPicker
        connections={CONNECTIONS}
        onSelect={vi.fn()}
        value="work"
        onRefreshSchema={onRefreshSchema}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Connection options' }));
    await user.click(await screen.findByRole('menuitem', { name: /Refresh schema/ }));

    expect(onRefreshSchema).toHaveBeenCalledWith(CONNECTIONS[1]);
    expect(await screen.findByText('Schema refreshed')).toBeInTheDocument();
  });

  it('offers no field menu without a choice', () => {
    render(
      <ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} onRefreshSchema={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: 'Connection options' })).not.toBeInTheDocument();
  });
});
