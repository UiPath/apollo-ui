import type { CellContext } from '@tanstack/react-table';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { createEditableColumn, EditableCell, type EditableCellMeta } from './editable-cell';

// EditableCell only reads cell.getValue(), cell.column.id, and
// cell.column.columnDef.meta, so a minimal stub is enough.
function makeCell<TValue>(
  value: TValue,
  meta?: EditableCellMeta,
  columnId = 'name'
): CellContext<Record<string, unknown>, TValue> {
  return {
    getValue: () => value,
    column: {
      id: columnId,
      columnDef: { meta },
    },
  } as unknown as CellContext<Record<string, unknown>, TValue>;
}

describe('EditableCell', () => {
  describe('display mode', () => {
    it('renders the value inside an edit button', () => {
      render(<EditableCell cell={makeCell('Alice')} onUpdate={vi.fn()} />);
      const button = screen.getByRole('button', { name: 'Edit name' });
      expect(button).toHaveTextContent('Alice');
    });

    it('renders a dash placeholder for empty values', () => {
      render(<EditableCell cell={makeCell('')} onUpdate={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Edit name' })).toHaveTextContent('—');
    });

    it('renders the matching option label for select cells', () => {
      const meta: EditableCellMeta = {
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      };
      render(<EditableCell cell={makeCell('active', meta, 'status')} onUpdate={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Edit status' })).toHaveTextContent('Active');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<EditableCell cell={makeCell('Alice')} onUpdate={vi.fn()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('text editing', () => {
    it('enters edit mode on click and focuses the input', async () => {
      const user = userEvent.setup();
      render(<EditableCell cell={makeCell('Alice')} onUpdate={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'Edit name' }));

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('Alice');
      await waitFor(() => {
        expect(input).toHaveFocus();
      });
    });

    it('commits the changed value on blur', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(<EditableCell cell={makeCell('Alice')} onUpdate={onUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit name' }));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Bob');
      await user.tab();

      expect(onUpdate).toHaveBeenCalledWith('Bob');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('commits the changed value on Enter', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(<EditableCell cell={makeCell('Alice')} onUpdate={onUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit name' }));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Carol{Enter}');

      expect(onUpdate).toHaveBeenCalledWith('Carol');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('does not call onUpdate when the value is unchanged', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(<EditableCell cell={makeCell('Alice')} onUpdate={onUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit name' }));
      await user.keyboard('{Enter}');

      expect(onUpdate).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('cancels editing and restores the value on Escape', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(<EditableCell cell={makeCell('Alice')} onUpdate={onUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit name' }));
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Mallory');
      await user.keyboard('{Escape}');

      expect(onUpdate).not.toHaveBeenCalled();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit name' })).toHaveTextContent('Alice');
    });

    it('uses the placeholder from column meta', async () => {
      const user = userEvent.setup();
      render(
        <EditableCell cell={makeCell('', { placeholder: 'Enter name' })} onUpdate={vi.fn()} />
      );

      await user.click(screen.getByRole('button', { name: 'Edit name' }));
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });
  });

  describe('number editing', () => {
    it('renders a number input and commits the numeric value', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(
        <EditableCell cell={makeCell(10, { type: 'number' }, 'amount')} onUpdate={onUpdate} />
      );

      await user.click(screen.getByRole('button', { name: 'Edit amount' }));
      const input = screen.getByRole('spinbutton');
      await user.clear(input);
      await user.type(input, '42');
      await user.tab();

      expect(onUpdate).toHaveBeenCalledWith(42);
    });

    it('forwards min and max from column meta', async () => {
      const user = userEvent.setup();
      render(
        <EditableCell
          cell={makeCell(5, { type: 'number', min: 0, max: 10 }, 'amount')}
          onUpdate={vi.fn()}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Edit amount' }));
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '10');
    });
  });

  describe('checkbox editing', () => {
    it('renders a checkbox reflecting the value', () => {
      render(
        <EditableCell cell={makeCell(true, { type: 'checkbox' }, 'done')} onUpdate={vi.fn()} />
      );
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('toggles immediately without a separate edit mode', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(
        <EditableCell cell={makeCell(false, { type: 'checkbox' }, 'done')} onUpdate={onUpdate} />
      );

      await user.click(screen.getByRole('checkbox'));
      expect(onUpdate).toHaveBeenCalledWith(true);
    });
  });

  describe('select editing', () => {
    const meta: EditableCellMeta = {
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
      ],
    };

    it('opens the select options when entering edit mode', async () => {
      const user = userEvent.setup();
      render(<EditableCell cell={makeCell('active', meta, 'status')} onUpdate={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'Edit status' }));

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      });
    });

    it('commits the chosen option and leaves edit mode', async () => {
      const user = userEvent.setup();
      const onUpdate = vi.fn();
      render(<EditableCell cell={makeCell('active', meta, 'status')} onUpdate={onUpdate} />);

      await user.click(screen.getByRole('button', { name: 'Edit status' }));

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Inactive' })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('option', { name: 'Inactive' }));

      expect(onUpdate).toHaveBeenCalledWith('inactive');
      await waitFor(() => {
        expect(screen.queryByRole('option', { name: 'Inactive' })).not.toBeInTheDocument();
      });
    });
  });

  describe('external value changes', () => {
    it('syncs when the cell value changes from outside', () => {
      const { rerender } = render(<EditableCell cell={makeCell('Alice')} onUpdate={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Edit name' })).toHaveTextContent('Alice');

      rerender(<EditableCell cell={makeCell('Bob')} onUpdate={vi.fn()} />);
      expect(screen.getByRole('button', { name: 'Edit name' })).toHaveTextContent('Bob');
    });
  });
});

describe('createEditableColumn', () => {
  it('returns a column definition with accessor, header, and meta', () => {
    const meta: EditableCellMeta = { type: 'number', min: 0, max: 100 };
    const column = createEditableColumn<{ amount: number }>('amount', 'Amount', meta);

    expect(column).toEqual({
      accessorKey: 'amount',
      header: 'Amount',
      meta,
    });
  });

  it('omits meta when none is provided', () => {
    const column = createEditableColumn<{ name: string }>('name', 'Name');

    expect(column.accessorKey).toBe('name');
    expect(column.header).toBe('Name');
    expect(column.meta).toBeUndefined();
  });
});
