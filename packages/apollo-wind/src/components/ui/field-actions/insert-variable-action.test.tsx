import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { VariablePickerItem } from '../variable-picker';
import { InsertVariableAction } from './insert-variable-action';

describe('InsertVariableAction', () => {
  const variables: VariablePickerItem[] = [
    { id: 'orderId', label: 'Order id', value: '$vars.orderId' },
  ];

  it('is disabled with nothing to insert or nowhere to insert it', () => {
    const { rerender } = render(<InsertVariableAction variables={[]} onInsert={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();

    rerender(<InsertVariableAction variables={variables} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('is enabled once it has both', () => {
    render(<InsertVariableAction variables={variables} onInsert={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeEnabled();
  });

  it('renders the entries as supplied, with no root of its own, and reports the pick', async () => {
    const user = userEvent.setup();
    const onInsert = vi.fn();
    render(<InsertVariableAction variables={variables} onInsert={onInsert} />);

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    expect(screen.queryByText('$vars')).toBeNull();
    await user.click(await screen.findByText('Order id'));
    expect(onInsert).toHaveBeenCalledWith(
      '$vars.orderId',
      expect.objectContaining({ label: 'Order id', value: '$vars.orderId' })
    );
  });

  it('calls a variables function when the picker opens, not during render', async () => {
    const user = userEvent.setup();
    const source = vi.fn(() => variables);
    const { rerender } = render(<InsertVariableAction variables={source} onInsert={vi.fn()} />);
    rerender(<InsertVariableAction variables={source} onInsert={vi.fn()} />);
    expect(source).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    expect(source).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Order id')).toBeInTheDocument();
  });

  it('takes translated strings', () => {
    render(
      <InsertVariableAction
        variables={variables}
        onInsert={vi.fn()}
        strings={{ label: 'Insérer', ariaLabel: 'Insérer une variable' }}
      />
    );
    const trigger = screen.getByRole('button', { name: 'Insérer une variable' });
    expect(trigger).toHaveAttribute('title', 'Insérer une variable');
    expect(trigger).toHaveTextContent('Insérer');
  });

  it("translates the picker's search box and empty state", async () => {
    const user = userEvent.setup();
    render(
      <InsertVariableAction
        variables={() => []}
        onInsert={vi.fn()}
        strings={{ searchPlaceholder: 'Rechercher', empty: 'Aucune variable' }}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    expect(await screen.findByPlaceholderText('Rechercher')).toBeInTheDocument();
    expect(screen.getByText('Aucune variable')).toBeInTheDocument();
  });
});
