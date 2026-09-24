import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ResourcePicker, ResourcePickerContent } from './resource-picker';
import type { ResourceGroup } from './types';

const GROUPS: ResourceGroup[] = [
  {
    id: 'HLConditionalPublished',
    label: 'HLConditionalPublished',
    items: [{ id: 'HLConditionalPublished/CaseComments', label: 'CaseComments' }],
  },
  {
    id: 'Shared',
    label: 'Shared',
    items: [
      { id: 'Shared/Aavi', label: 'Aavi' },
      { id: 'Shared/AvichalFolderEntity', label: 'AvichalFolderEntity' },
      { id: 'Shared/Candidate', label: 'Candidate' },
    ],
  },
];

describe('ResourcePickerContent', () => {
  it('lists every group with its rows and count', () => {
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    expect(screen.getByRole('button', { name: /HLConditionalPublished/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'CaseComments' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Shared/ })).toHaveTextContent('3');
  });

  it('commits a row on click, with no confirm step', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePickerContent groups={GROUPS} onSelect={onSelect} />);

    await user.click(screen.getByRole('option', { name: 'Aavi' }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Shared/Aavi' }));
  });

  it('filters rows and drops a group that has no match left', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'Candidate');

    expect(screen.getByRole('option', { name: 'Candidate' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /HLConditionalPublished/ })
    ).not.toBeInTheDocument();
  });

  it('lists a whole group when the search matches its name', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'shared');

    // None of these rows contains "shared"; the group name does.
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Candidate' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'CaseComments' })).not.toBeInTheDocument();
  });

  it('names the query when a search matches nothing', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} emptyText="No entities yet." />
    );

    await user.type(screen.getByRole('combobox'), 'zzzz');

    // A search that matched nothing is not an empty picker, so it does not
    // borrow the empty wording.
    expect(screen.getByText('No results match “zzzz”.')).toBeInTheDocument();
    expect(screen.queryByText('No entities yet.')).not.toBeInTheDocument();
  });

  it('shows the empty text when there is nothing to pick', () => {
    render(<ResourcePickerContent groups={[]} onSelect={vi.fn()} emptyText="No entities yet." />);

    expect(screen.getByText('No entities yet.')).toBeInTheDocument();
  });

  it('does not call itself empty when every group is collapsed', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} emptyText="No entities yet." />
    );

    await user.click(screen.getByRole('button', { name: /HLConditionalPublished/ }));
    await user.click(screen.getByRole('button', { name: /Shared/ }));

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    expect(screen.queryByText('No entities yet.')).not.toBeInTheDocument();
  });

  it('collapses and expands a group', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    const header = screen.getByRole('button', { name: /Shared/ });
    expect(header).toHaveAttribute('aria-expanded', 'true');

    await user.click(header);
    expect(header).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();

    await user.click(header);
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
  });

  it('honours defaultCollapsed', () => {
    render(
      <ResourcePickerContent
        groups={[{ ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('reveals a match inside a collapsed group while searching', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePickerContent
        groups={[{ ...GROUPS[1], defaultCollapsed: true }]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('combobox'), 'Aavi');
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
  });

  it('tells apart same-named rows in different groups', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const duplicated: ResourceGroup[] = [
      GROUPS[0],
      { id: 'Other', label: 'Other', items: [{ id: 'Other/CaseComments', label: 'CaseComments' }] },
    ];
    render(<ResourcePickerContent groups={duplicated} onSelect={onSelect} />);

    const rows = screen.getAllByRole('option', { name: 'CaseComments' });
    expect(rows).toHaveLength(2);

    await user.click(rows[1]);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Other/CaseComments' }));
  });

  it('marks the chosen row with a tick and the brand tint, not the hover fill', () => {
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);

    const chosen = screen.getByRole('option', { name: 'Aavi' });
    const other = screen.getByRole('option', { name: 'Candidate' });

    expect(chosen.querySelector('svg')).not.toBeNull();
    expect(other.querySelector('svg')).toBeNull();

    // Selection has a tint of its own, so it never reads as the cursor fill,
    // which resolves to the same value as `surface-selected` in every theme.
    expect(chosen).toHaveClass('bg-brand-subtle');
    expect(chosen).not.toHaveClass('data-[selected=true]:bg-surface-overlay');
    expect(other).not.toHaveClass('bg-brand-subtle');
  });

  it('does not commit a disabled row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ResourcePickerContent
        groups={[
          { id: 'g', label: 'Group', items: [{ id: 'g/a', label: 'Locked', disabled: true }] },
        ]}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole('option', { name: 'Locked' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clears the query on Escape rather than letting it dismiss', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);

    const search = screen.getByRole('combobox');
    await user.type(search, 'Aavi');
    expect(search).toHaveValue('Aavi');

    await user.type(search, '{Escape}');
    expect(search).toHaveValue('');
  });

  it('renders both footer slots, and no footer without them', () => {
    const { rerender } = render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={vi.fn()}
        footerLeading={<button type="button">Add new entity</button>}
        footerTrailing={<button type="button">Open entities</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Add new entity' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open entities' })).toBeInTheDocument();

    rerender(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Open entities' })).not.toBeInTheDocument();
  });

  it('reports the query to a controlling consumer', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={vi.fn()}
        query=""
        onQueryChange={onQueryChange}
      />
    );

    await user.type(screen.getByRole('combobox'), 'A');
    expect(onQueryChange).toHaveBeenCalledWith('A');
  });

  it('matches keywords the row does not print', async () => {
    const user = userEvent.setup();
    const groups: ResourceGroup[] = [
      { id: 'g', label: 'G', items: [{ id: 'a', label: 'Aavi', keywords: ['Outlook Work'] }] },
    ];
    render(<ResourcePickerContent groups={groups} onSelect={vi.fn()} />);

    await user.type(screen.getByRole('combobox'), 'outlook');
    expect(screen.getByRole('option', { name: 'Aavi' })).toBeInTheDocument();
  });

  it('renders a subtitle under the label', () => {
    const groups: ResourceGroup[] = [
      { id: 'g', label: 'G', items: [{ id: 'a', label: 'Aavi', subtitle: 'Connected' }] },
    ];
    render(<ResourcePickerContent groups={groups} onSelect={vi.fn()} />);

    expect(screen.getByRole('option', { name: 'Aavi' })).toHaveTextContent('Connected');
  });

  it('runs a row action without committing the row', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onEdit = vi.fn();
    render(
      <ResourcePickerContent
        groups={GROUPS}
        onSelect={onSelect}
        renderItemActions={(item) => (
          <button type="button" onClick={() => onEdit(item.id)}>
            Edit {item.label}
          </button>
        )}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Edit Aavi' }));

    expect(onEdit).toHaveBeenCalledWith('Shared/Aavi');
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('ResourcePicker', () => {
  it('shows the placeholder until a value is chosen', () => {
    const { rerender } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />
    );
    expect(screen.getByRole('button', { name: /Select entity/ })).toBeInTheDocument();

    rerender(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        value="Shared/Aavi"
        placeholder="Select entity..."
      />
    );
    expect(screen.getByRole('button', { name: /Aavi/ })).toBeInTheDocument();
  });

  it('opens on the trigger and closes once a row commits', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ResourcePicker groups={GROUPS} onSelect={onSelect} placeholder="Select entity..." />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    await user.click(await screen.findByRole('option', { name: 'Aavi' }));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'Shared/Aavi' }));
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('puts focus in the search when it opens', async () => {
    const user = userEvent.setup();
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />);

    await user.click(screen.getByRole('button', { name: /Select entity/ }));

    const search = await screen.findByRole('combobox');
    expect(search).toHaveFocus();
    await user.keyboard('Cand');
    expect(screen.getByRole('option', { name: 'Candidate' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('offers a clear only with both a value and a handler', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { rerender } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" onClear={onClear} />
    );

    await user.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onClear).toHaveBeenCalledTimes(1);

    rerender(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);
    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('does not open while disabled', async () => {
    const user = userEvent.setup();
    render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled placeholder="Select entity..." />
    );

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('renders a trailing adornment beside the field', () => {
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Mode</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Mode' })).toBeInTheDocument();
  });

  it('reports open state to a controlling consumer', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        onOpenChange={onOpenChange}
        placeholder="Select entity..."
      />
    );

    await user.click(screen.getByRole('button', { name: /Select entity/ }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('marks the field invalid in its error state only', () => {
    const { rerender } = render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        placeholder="Select entity..."
        status="error"
        aria-describedby="msg"
      />
    );
    const field = screen.getByRole('button', { name: /Select entity/ });
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('aria-describedby', 'msg');

    rerender(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        placeholder="Select entity..."
        status="warning"
      />
    );
    expect(field).not.toHaveAttribute('aria-invalid');
    expect(field).toHaveAttribute('data-status', 'warning');
  });
});
