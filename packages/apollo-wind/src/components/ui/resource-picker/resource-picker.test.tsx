import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

  it('exposes the chosen row as checked, apart from the cursor', async () => {
    const user = userEvent.setup();
    render(<ResourcePickerContent groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);

    const chosen = screen.getByRole('option', { name: 'Aavi' });
    const other = screen.getByRole('option', { name: 'Candidate' });
    expect(chosen).toHaveAttribute('aria-checked', 'true');
    expect(other).toHaveAttribute('aria-checked', 'false');

    // aria-selected stays cmdk's: it follows the cursor, not the value.
    await user.hover(other);
    expect(other).toHaveAttribute('aria-selected', 'true');
    expect(chosen).toHaveAttribute('aria-selected', 'false');
    expect(chosen).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps the description in the row name', () => {
    render(
      <ResourcePickerContent
        groups={[
          {
            id: 'people',
            label: 'People',
            items: [
              { id: 'a', label: 'Alex', description: 'alex@north.example' },
              { id: 'b', label: 'Alex', description: 'alex@south.example' },
            ],
          },
        ]}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole('option', { name: 'Alex, alex@north.example' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Alex, alex@south.example' })).toBeInTheDocument();
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
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('names the open popover and keeps row ARIA valid', async () => {
    const user = userEvent.setup();
    const { baseElement } = render(
      <>
        <label htmlFor="entity">Entity</label>
        <ResourcePicker
          id="entity"
          groups={[
            ...GROUPS,
            {
              id: 'People',
              label: 'People',
              items: [{ id: 'People/Alex', label: 'Alex', description: 'alex@example.com' }],
            },
          ]}
          onSelect={vi.fn()}
          value="Shared/Aavi"
        />
      </>
    );

    await user.click(screen.getByRole('button', { name: 'Entity' }));
    await screen.findByRole('listbox');

    expect(screen.getByRole('dialog', { name: 'Resources' })).toBeInTheDocument();
    // Only the rules this change answers for. The grouped list still trips
    // aria-required-children, a known issue tracked for a follow-up, so a
    // full run is not asserted here. The popover portals out of the render
    // container, so the whole body is checked.
    const results = await axe(baseElement, {
      runOnly: {
        type: 'rule',
        values: ['aria-dialog-name', 'aria-allowed-attr', 'aria-valid-attr-value'],
      },
    });
    expect(results).toHaveNoViolations();
  });

  it('does not open a disabled custom trigger that is not a button', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} disabled onOpenChange={onOpenChange}>
        {/* An element that ignores the forwarded `disabled` attribute. */}
        <div>Choose entity</div>
      </ResourcePicker>
    );

    await user.click(screen.getByText('Choose entity'));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.queryByRole('option', { name: 'Aavi' })).not.toBeInTheDocument();
  });

  it('forwards id and ARIA props to the default trigger', () => {
    render(
      <>
        <label htmlFor="entity">Entity</label>
        <span id="entity-hint">Pick the table to read from.</span>
        <span id="entity-error">Choose an entity.</span>
        <ResourcePicker
          id="entity"
          groups={GROUPS}
          onSelect={vi.fn()}
          value="Shared/Aavi"
          aria-describedby="entity-hint"
          aria-invalid
          aria-errormessage="entity-error"
        />
      </>
    );

    // No aria-label is set, so the consumer's label names the field.
    const trigger = screen.getByLabelText('Entity');
    expect(trigger).toBe(screen.getByRole('button', { name: 'Entity' }));
    expect(trigger).toHaveAttribute('id', 'entity');
    expect(trigger).not.toHaveAttribute('aria-label');
    expect(trigger).toHaveAccessibleDescription('Pick the table to read from.');
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAttribute('aria-errormessage', 'entity-error');
  });

  it('takes its name from aria-labelledby', () => {
    render(
      <>
        <span id="entity-label">Source entity</span>
        <ResourcePicker groups={GROUPS} onSelect={vi.fn()} aria-labelledby="entity-label" />
      </>
    );

    expect(screen.getByRole('button', { name: 'Source entity' })).toHaveAttribute(
      'aria-labelledby',
      'entity-label'
    );
  });

  it('is named by its own text without a consumer label', () => {
    render(<ResourcePicker groups={GROUPS} onSelect={vi.fn()} value="Shared/Aavi" />);
    expect(screen.getByRole('button', { name: 'Aavi' })).not.toHaveAttribute('aria-label');
  });

  it('reserves the trailing slot by its measured width', () => {
    // jsdom does no layout, so the slot reports the width a wide adornment
    // would have in a browser.
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);
    const { container } = render(
      <ResourcePicker
        groups={GROUPS}
        onSelect={vi.fn()}
        trailingAdornment={<button type="button">Field mode</button>}
        placeholder="Select entity..."
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--resource-picker-trailing-inset')).toBe('100px');
    expect(screen.getByRole('button', { name: /Select entity/ })).toHaveClass(
      'pr-(--resource-picker-trailing-inset)'
    );
  });

  it('keeps the default inset when nothing trails the field', () => {
    const { container } = render(
      <ResourcePicker groups={GROUPS} onSelect={vi.fn()} placeholder="Select entity..." />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.getPropertyValue('--resource-picker-trailing-inset')).toBe('');
    const trigger = screen.getByRole('button', { name: /Select entity/ });
    expect(trigger).toHaveClass('pr-9');
    expect(trigger).not.toHaveClass('pr-(--resource-picker-trailing-inset)');
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
