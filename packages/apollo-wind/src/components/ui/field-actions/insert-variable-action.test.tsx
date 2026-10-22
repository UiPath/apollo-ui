import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { RenderVariablePicker, VariablePickerItem } from '../variable-picker';
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

  describe('with a host picker', () => {
    const hostPicker: RenderVariablePicker = ({ onSelect, close }) => (
      <div>
        <button type="button" onClick={() => onSelect('$host.orderId')}>
          Host order id
        </button>
        <button
          type="button"
          onClick={() => onSelect('$host.item', { id: 'item', label: 'Item', metadata: 7 })}
        >
          Host item
        </button>
        <button type="button" onClick={close}>
          Host cancel
        </button>
      </div>
    );

    it('is enabled without variables, and renders the host picker only once opened', async () => {
      const user = userEvent.setup();
      const render$ = vi.fn(hostPicker);
      render(<InsertVariableAction renderPicker={render$} onInsert={vi.fn()} />);
      expect(render$).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      expect(await screen.findByRole('button', { name: 'Host order id' })).toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Search variables...')).toBeNull();
      expect(render$.mock.calls[0]?.[0].value).toBeUndefined();
    });

    it('reports a pick, closes and returns focus to the trigger', async () => {
      const user = userEvent.setup();
      const onInsert = vi.fn();
      render(<InsertVariableAction renderPicker={hostPicker} onInsert={onInsert} />);
      const trigger = screen.getByRole('button', { name: 'Insert variable' });

      await user.click(trigger);
      await user.click(await screen.findByRole('button', { name: 'Host order id' }));
      expect(onInsert).toHaveBeenCalledWith('$host.orderId', {
        id: '$host.orderId',
        label: '$host.orderId',
        value: '$host.orderId',
      });
      expect(screen.queryByRole('button', { name: 'Host order id' })).toBeNull();
      expect(trigger).toHaveFocus();

      await user.click(trigger);
      await user.click(await screen.findByRole('button', { name: 'Host item' }));
      expect(onInsert).toHaveBeenLastCalledWith(
        '$host.item',
        expect.objectContaining({ id: 'item', metadata: 7 })
      );
    });

    it('closes without reporting anything', async () => {
      const user = userEvent.setup();
      const onInsert = vi.fn();
      render(<InsertVariableAction renderPicker={hostPicker} onInsert={onInsert} />);
      const trigger = screen.getByRole('button', { name: 'Insert variable' });
      await user.click(trigger);
      await user.click(await screen.findByRole('button', { name: 'Host cancel' }));
      expect(screen.queryByRole('button', { name: 'Host cancel' })).toBeNull();
      expect(onInsert).not.toHaveBeenCalled();
      expect(trigger).toHaveFocus();
    });

    it('is disabled with nowhere to insert', () => {
      render(<InsertVariableAction renderPicker={hostPicker} />);
      expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
    });
  });
});
