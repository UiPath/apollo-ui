import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VariablePicker, VariablePickerContent, type VariablePickerItem } from './variable-picker';

const items: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    children: [
      { id: 'customer-name', label: 'Customer name', value: '$vars.customer.name' },
      { id: 'invoice-id', label: 'Invoice ID', value: '$vars.invoice.id' },
    ],
  },
  {
    id: 'metadata',
    label: '$metadata',
    children: [{ id: 'run-id', label: 'Run ID', value: '$metadata.runId' }],
  },
];

describe('VariablePicker', () => {
  it('opens with the first group expanded and selects a leaf', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<VariablePicker items={items} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    expect(screen.getByRole('option', { name: 'Customer name' })).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Customer name' }));
    expect(onSelect).toHaveBeenCalledWith(items[0]!.children![0]);
    expect(screen.queryByPlaceholderText('Search variables...')).not.toBeInTheDocument();
  });

  it('searches labels and full variable paths across collapsed groups', async () => {
    const user = userEvent.setup();
    render(<VariablePicker items={items} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.type(screen.getByPlaceholderText('Search variables...'), 'runId');

    expect(screen.getByRole('option', { name: 'Run ID' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Customer name' })).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    const user = userEvent.setup();
    render(<VariablePicker items={items} onSelect={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.type(screen.getByPlaceholderText('Search variables...'), 'missing');

    expect(screen.getByText('No variables found.')).toBeInTheDocument();
  });

  it('expands the latest first group when items load before opening', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<VariablePicker items={[]} onSelect={vi.fn()} />);

    rerender(<VariablePicker items={items} onSelect={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Insert variable' }));

    expect(screen.getByRole('option', { name: 'Customer name' })).toBeInTheDocument();
  });

  it('can render content without owning a popover trigger', () => {
    render(<VariablePickerContent items={items} onSelect={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search variables...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert variable' })).not.toBeInTheDocument();
  });

  it('seeds and controls the search query', async () => {
    const user = userEvent.setup();
    const onQueryChange = vi.fn();
    const { rerender } = render(
      <VariablePickerContent items={items} onSelect={vi.fn()} initialQuery="invoice" />
    );

    expect(screen.getByRole('option', { name: 'Invoice ID' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Customer name' })).not.toBeInTheDocument();

    rerender(
      <VariablePickerContent
        items={items}
        onSelect={vi.fn()}
        query="runId"
        onQueryChange={onQueryChange}
      />
    );
    await user.type(screen.getByPlaceholderText('Search variables...'), 'x');
    expect(onQueryChange).toHaveBeenCalledWith('runIdx');
    expect(screen.getByRole('option', { name: 'Run ID' })).toBeInTheDocument();
  });

  it("shows a matching parent's complete subtree", async () => {
    const user = userEvent.setup();
    render(<VariablePickerContent items={items} onSelect={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Search variables...'), '$vars');

    expect(screen.getByRole('option', { name: 'Customer name' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Invoice ID' })).toBeInTheDocument();
  });

  it('selects a branch with a value using its insert affordance', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const branch = {
      id: 'response',
      label: 'response',
      value: '$vars.response',
      children: [{ id: 'status', label: 'status', value: '$vars.response.status' }],
    } satisfies VariablePickerItem;
    render(<VariablePickerContent items={[branch]} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Insert variable: response' }));

    expect(onSelect).toHaveBeenCalledWith(branch);
  });

  it('uses unique ids for command values when labels repeat', () => {
    render(
      <VariablePickerContent
        items={[
          { id: 'first-response', label: 'response' },
          { id: 'second-response', label: 'response' },
        ]}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getAllByRole('option').map((option) => option.getAttribute('data-value'))
    ).toEqual(['first-response', 'second-response']);
  });

  it('uses configured expansion and localized trigger labels', async () => {
    const user = userEvent.setup();
    render(
      <VariablePicker
        items={items}
        onSelect={vi.fn()}
        defaultExpandedIds={['metadata']}
        triggerLabel="Ajouter"
        triggerAriaLabel="Ajouter une variable"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Ajouter une variable' }));

    expect(screen.getByText('Ajouter')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Run ID' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Customer name' })).not.toBeInTheDocument();
  });
});
