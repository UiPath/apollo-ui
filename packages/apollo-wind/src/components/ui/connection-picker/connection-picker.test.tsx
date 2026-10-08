import { act, render, screen, within } from '@testing-library/react';
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
    statusReason: 'Missing scopes. Re-authenticate with the correct permissions.',
  },
  { id: 'shared', name: 'Outlook Shared', folder: 'Shared' },
];

/** Opens the picker and returns its popover, which holds one listbox per folder. */
const openPicker = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /Select connection/ }));
  await screen.findAllByRole('listbox');
  return screen.getByRole('dialog');
};

describe('ConnectionPicker', () => {
  it('groups by folder and names rows by account, falling back to the name', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    expect(screen.getByRole('button', { name: /My Workspace/ })).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Shared/ })).toHaveTextContent('1');
    expect(screen.getByRole('option', { name: 'jane@contoso.com, Connected' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Outlook Shared, Connected' })).toBeInTheDocument();
  });

  it('sorts broken connections to the end of their folder', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    const list = await openPicker(user);

    const names = within(list)
      .getAllByRole('option')
      .map((option) => option.getAttribute('aria-label'));
    expect(names.slice(0, 3)).toEqual([
      'jane@contoso.com, Connected',
      'finance@contoso.com, Missing scopes',
      'ops@contoso.com, Broken',
    ]);
  });

  it('shows each row health as its second line', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    expect(screen.getByRole('option', { name: 'ops@contoso.com, Broken' })).toHaveTextContent(
      'Broken'
    );
    expect(
      screen.getByRole('option', { name: 'finance@contoso.com, Missing scopes' })
    ).toHaveTextContent('Missing scopes');
    expect(screen.getByRole('option', { name: 'jane@contoso.com, Connected' })).toHaveTextContent(
      'Connected'
    );
  });

  it('names a warning without a reason generically', async () => {
    const user = userEvent.setup();
    render(
      <ConnectionPicker
        connections={[{ id: 'rate', name: 'Outlook Rate', status: 'warning' }]}
        onSelect={vi.fn()}
      />
    );
    await openPicker(user);

    expect(
      screen.getByRole('option', { name: 'Outlook Rate, Needs attention' })
    ).toBeInTheDocument();
  });

  it('finds a connection by its name when the row shows the account', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    await user.type(screen.getByRole('combobox'), 'Outlook Work');

    expect(screen.getByRole('option', { name: 'jane@contoso.com, Connected' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'ops@contoso.com, Broken' })
    ).not.toBeInTheDocument();
  });

  it('lists a folder whole when the search matches its name', async () => {
    const user = userEvent.setup();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    await openPicker(user);

    await user.type(screen.getByRole('combobox'), 'workspace');

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(
      screen.queryByRole('option', { name: 'Outlook Shared, Connected' })
    ).not.toBeInTheDocument();
  });

  it('commits the connection object', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={onSelect} />);
    await openPicker(user);

    await user.click(screen.getByRole('option', { name: 'jane@contoso.com, Connected' }));

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

  it('offers Edit for the chosen connection from the field menu', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="work" onEdit={onEdit} />
    );

    await user.click(screen.getByRole('button', { name: 'Connection options' }));
    await user.click(await screen.findByRole('menuitem', { name: /Edit connection/ }));

    expect(onEdit).toHaveBeenCalledWith(CONNECTIONS[1]);
  });

  it('offers no Fix under a disabled field', () => {
    render(
      <ConnectionPicker
        connections={CONNECTIONS}
        onSelect={vi.fn()}
        value="ops"
        onFix={vi.fn()}
        disabled
      />
    );

    expect(screen.getByText('Token expired')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Fix' })).not.toBeInTheDocument();
  });

  it('forwards field labelling and joins the consumer description with its message', () => {
    render(
      <>
        <span id="label">Connection</span>
        <span id="help">Used to send mail.</span>
        <ConnectionPicker
          connections={CONNECTIONS}
          onSelect={vi.fn()}
          value="ops"
          id="connection"
          aria-labelledby="label"
          aria-describedby="help"
        />
      </>
    );

    const field = screen.getByRole('button', { name: 'Connection' });
    expect(field).toHaveAttribute('id', 'connection');
    // The consumer's hint, then the health, then the status message, then the
    // chosen connection, which ResourcePicker adds once a consumer label names
    // the field.
    const [hint, health, message, value] = (field.getAttribute('aria-describedby') ?? '').split(
      ' '
    );
    expect(hint).toBe('help');
    expect(document.getElementById(health)).toHaveTextContent('Broken');
    expect(message).toBe(screen.getByText('Token expired').closest('p')?.id);
    expect(document.getElementById(value)).toHaveTextContent(field.textContent ?? '');
  });

  it('forwards field labelling to the add-connection field', () => {
    render(
      <>
        <span id="label">Connection</span>
        <ConnectionPicker
          connections={[]}
          onSelect={vi.fn()}
          onAddConnection={vi.fn()}
          id="connection"
          aria-labelledby="label"
          aria-describedby="help"
        />
      </>
    );

    const field = screen.getByRole('button', { name: 'Connection' });
    expect(field).toHaveAttribute('id', 'connection');
    expect(field).toHaveAttribute('aria-describedby', 'help');
  });

  it('puts a broken choice in the error state with its reason and a Fix', async () => {
    const user = userEvent.setup();
    const onFix = vi.fn();
    render(
      <ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="ops" onFix={onFix} />
    );

    const field = screen.getByRole('button', { name: /ops@contoso.com/ });
    const message = screen.getByText('Token expired').closest('p');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.getAttribute('aria-describedby')?.split(' ')).toContain(message?.id);
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

  it('describes the chosen health for assistive technology, outside the field name', () => {
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="work" />);
    // The leading dot is a glyph, so the health is in the description.
    const field = screen.getByRole('button', { name: 'jane@contoso.com' });
    expect(field).toHaveAccessibleDescription('Connected');
  });

  it('reads the whole reason while showing only its headline', () => {
    render(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} value="ops" />);

    const field = screen.getByRole('button', { name: 'ops@contoso.com' });
    expect(field).toHaveAccessibleDescription(
      'Broken Token expired. Sign in again to restore access.'
    );
    // The visible line keeps its headline alone.
    const message = screen.getByText('Token expired').closest('p');
    expect(screen.getByText('Token expired')).toHaveAttribute('aria-hidden', 'true');
    expect(message).toHaveTextContent('Token expired');
  });

  it('keeps a reason that is a single sentence as it is', () => {
    render(
      <ConnectionPicker
        connections={[{ id: 'one', name: 'One', status: 'broken', statusReason: 'Revoked.' }]}
        onSelect={vi.fn()}
        value="one"
      />
    );
    expect(screen.getByRole('button', { name: 'One' })).toHaveAccessibleDescription(
      'Broken Revoked.'
    );
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

  it('points the invalid field at its own error message', () => {
    const { rerender } = render(
      <ConnectionPicker
        connections={CONNECTIONS}
        onSelect={vi.fn()}
        error="Connection is required."
      />
    );

    const field = screen.getByRole('button', { name: /Select connection/ });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute(
      'aria-errormessage',
      screen.getByText('Connection is required.').id
    );
    expect(field).toHaveAccessibleErrorMessage('Connection is required.');

    // A message the consumer names wins over the field's own.
    rerender(
      <>
        <span id="form-error">Fix the highlighted fields.</span>
        <ConnectionPicker
          connections={CONNECTIONS}
          onSelect={vi.fn()}
          error="Connection is required."
          aria-errormessage="form-error"
        />
      </>
    );
    expect(screen.getByRole('button', { name: /Select connection/ })).toHaveAttribute(
      'aria-errormessage',
      'form-error'
    );

    // Valid again, the field points at no error message.
    rerender(<ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} />);
    const valid = screen.getByRole('button', { name: /Select connection/ });
    expect(valid).not.toHaveAttribute('aria-invalid');
    expect(valid).not.toHaveAttribute('aria-errormessage');
  });

  it('points the add-connection field at its own error message', () => {
    render(
      <ConnectionPicker
        connections={[]}
        onSelect={vi.fn()}
        onAddConnection={vi.fn()}
        error="Connection is required."
      />
    );

    const field = screen.getByRole('button', { name: /Add/ });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute(
      'aria-errormessage',
      screen.getByText('Connection is required.').id
    );
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

  it('drops a pending refresh when the chosen connection changes', async () => {
    const user = userEvent.setup();
    let finish: () => void = () => {};
    const onRefreshSchema = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        })
    );
    const props = { connections: CONNECTIONS, onSelect: vi.fn(), onRefreshSchema };
    const { rerender } = render(<ConnectionPicker {...props} value="work" />);

    await user.click(screen.getByRole('button', { name: 'Connection options' }));
    await user.click(await screen.findByRole('menuitem', { name: /Refresh schema/ }));
    expect(await screen.findByText('Refreshing schema...')).toBeInTheDocument();
    await user.keyboard('{Escape}');

    rerender(<ConnectionPicker {...props} value="shared" />);
    await user.click(screen.getByRole('button', { name: 'Connection options' }));
    const item = await screen.findByRole('menuitem', { name: /Refresh schema/ });
    expect(item).not.toHaveAttribute('aria-busy');
    expect(screen.queryByText('Refreshing schema...')).not.toBeInTheDocument();

    // The old connection's refresh finishing does not report on the new one.
    await act(async () => finish());
    expect(screen.queryByText('Schema refreshed')).not.toBeInTheDocument();
  });

  it('lets the field menu close while a refresh is pending', async () => {
    const user = userEvent.setup();
    const onRefreshSchema = vi.fn(() => new Promise<void>(() => {}));
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
    expect(await screen.findByText('Refreshing schema...')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.body.style.pointerEvents).not.toBe('none');
  });

  it('runs a row Edit from the keyboard without committing the active row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    const connections: Connection[] = [
      { id: 'one', name: 'One' },
      { id: 'two', name: 'Two' },
    ];
    render(<ConnectionPicker connections={connections} onSelect={onSelect} onEdit={onEdit} />);
    await openPicker(user);

    const edit = screen.getByRole('button', { name: 'Edit Two' });
    while (document.activeElement !== edit) await user.tab();
    await user.keyboard('{Enter}');

    expect(onEdit).toHaveBeenCalledWith(connections[1]);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('offers no field menu without a choice', () => {
    render(
      <ConnectionPicker connections={CONNECTIONS} onSelect={vi.fn()} onRefreshSchema={vi.fn()} />
    );
    expect(screen.queryByRole('button', { name: 'Connection options' })).not.toBeInTheDocument();
  });
});

describe('package entry points', () => {
  it('exports ConnectionPicker from the components/ui barrel beside ResourcePicker', async () => {
    const ui = await import('../index');
    expect(ui.ConnectionPicker).toBe(ConnectionPicker);
    expect(ui.ResourcePicker).toBeDefined();
  });
});
