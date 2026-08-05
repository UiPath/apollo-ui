import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VariablePicker, type VariablePickerItem } from './variable-picker';

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
});
