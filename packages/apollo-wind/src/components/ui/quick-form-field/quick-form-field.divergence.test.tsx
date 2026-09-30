import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QuickFormField } from './quick-form-field';
import { FIELD_TYPE_META, FIELD_TYPE_ORDER } from './types';
import { getLockedDisplayValue } from './utils';

/**
 * Covers the widenings added on top of the original component: the extra types
 * and modes, `fieldTypes`, the variable tree, caret-aware insert, Enter/Escape,
 * and `renderModeControl`.
 */
describe('QuickFormField — divergences from apollo-wind', () => {
  describe('added field types', () => {
    it('offers every added type in the picker, in vocabulary order', () => {
      // The three added types.
      expect(FIELD_TYPE_ORDER).toContain('double');
      expect(FIELD_TYPE_ORDER).toContain('datetime');
      expect(FIELD_TYPE_ORDER).toContain('array');
      // Each added type has to be addressable by the picker, which reads meta.
      for (const type of FIELD_TYPE_ORDER) {
        expect(FIELD_TYPE_META[type]).toBeDefined();
      }
      // Ordering is the picker's display order; a decimal belongs beside its
      // integer, and a timestamp beside its date.
      expect(FIELD_TYPE_ORDER.indexOf('double')).toBe(FIELD_TYPE_ORDER.indexOf('integer') + 1);
      expect(FIELD_TYPE_ORDER.indexOf('datetime')).toBe(FIELD_TYPE_ORDER.indexOf('date') + 1);
    });

    // Which types are offered is the consumer's; which the component can
    // render is its own.
    it('offers only the types the consumer asks for', async () => {
      const onFieldTypeChange = vi.fn();
      render(
        <QuickFormField
          locked={false}
          fieldType="string"
          fieldTypes={['string', 'integer', 'array']}
          onFieldTypeChange={onFieldTypeChange}
          onValueChange={vi.fn()}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Field type' }));

      expect(screen.getByRole('menuitem', { name: 'String' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Array' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Object' })).not.toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'File' })).not.toBeInTheDocument();
    });

    it('falls back to every renderable type when the consumer names none', async () => {
      render(
        <QuickFormField
          locked={false}
          fieldType="string"
          onFieldTypeChange={vi.fn()}
          onValueChange={vi.fn()}
        />
      );

      await userEvent.click(screen.getByRole('button', { name: 'Field type' }));

      for (const type of FIELD_TYPE_ORDER) {
        expect(
          screen.getByRole('menuitem', { name: FIELD_TYPE_META[type].label })
        ).toBeInTheDocument();
      }
    });

    // The bug the `double` type exists to prevent: a number input's default
    // step is 1, so a fractional value is invalid and the browser rounds or
    // rejects it. Collapsing decimals onto `integer` loses the fraction.
    it('lets a decimal field accept a fractional value', () => {
      render(<QuickFormField locked={false} fieldType="double" onValueChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Decimal number value');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('step', 'any');
    });

    it('keeps integer stepless, so it still rejects a fraction', () => {
      render(<QuickFormField locked={false} fieldType="integer" onValueChange={vi.fn()} />);
      const input = screen.getByPlaceholderText('Integer value');
      expect(input).toHaveAttribute('type', 'number');
      expect(input).not.toHaveAttribute('step');
    });

    it("gives a datetime field its own control, not the date type's", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <QuickFormField locked={false} fieldType="datetime" onValueChange={vi.fn()} />
      );
      // Both date triggers are the input group's control, so tell them apart by
      // what opens: only DateTimePicker offers a time of day.
      expect(screen.getAllByText('Date and time value').length).toBeGreaterThan(0);
      const trigger = container.querySelector('button[data-slot="input-group-control"]');
      expect(trigger).toBeInTheDocument();
      await user.click(trigger as HTMLElement);
      expect(document.querySelector('input[type="time"]')).toBeInTheDocument();
    });

    it('still gives a date field the plain trigger, unchanged from upstream', () => {
      const { container } = render(
        <QuickFormField locked={false} fieldType="date" onValueChange={vi.fn()} />
      );
      expect(
        container.querySelector('button[data-slot="input-group-control"]')
      ).toBeInTheDocument();
    });

    // Locked fields show text in place of the control, so every added type
    // needs a display form or it renders blank.
    it('shows the time of day when a locked datetime is displayed', () => {
      const shown = getLockedDisplayValue('datetime', '2024-01-15T13:45:00.000Z', []);
      expect(shown).not.toBe('');
      expect(shown).not.toBe('2024-01-15T13:45:00.000Z');
      // A date-only render would drop the clock time entirely.
      const dateOnly = getLockedDisplayValue('date', '2024-01-15', []);
      expect(shown).not.toBe(dateOnly);
    });

    it('falls back to the raw value for an unparseable datetime rather than throwing', () => {
      expect(getLockedDisplayValue('datetime', 'not-a-date', [])).toBe('not-a-date');
      expect(getLockedDisplayValue('datetime', '', [])).toBe('');
    });

    it('treats an array as an expression-capable value, like object', () => {
      expect(FIELD_TYPE_META.array.supportsExpression).toBe(true);
    });
  });

  describe('added binding modes', () => {
    // A field can bind to a workflow variable or to an agent-filled prompt.
    it('accepts variable and prompt as modes', () => {
      for (const mode of ['variable', 'prompt'] as const) {
        const { unmount } = render(
          <QuickFormField locked={false} mode={mode} onValueChange={vi.fn()} />
        );
        unmount();
      }
    });

    // Only `expression` is coerced for a type that cannot hold one.
    it('still pins a non-expression type out of expression mode', () => {
      render(
        <QuickFormField
          locked
          fieldType="single-select"
          mode="expression"
          value="option-1"
          options={[{ label: 'Option 1', value: 'option-1' }]}
        />
      );
      expect(screen.getByDisplayValue('Option 1')).toBeInTheDocument();
    });

    // The consumer is offered the raw mode, even one the built-in rendering
    // would coerce away, since it may have its own editor.
    it('offers a non-expression type its expression mode to the consumer', () => {
      render(
        <QuickFormField
          locked={false}
          fieldType="single-select"
          mode="expression"
          onValueChange={vi.fn()}
          renderModeControl={(m) => <span>consumer {m}</span>}
        />
      );
      expect(screen.getByText('consumer expression')).toBeInTheDocument();
    });

    // ...but a select CAN be bound to a variable, so that mode must survive.
    it('lets a non-expression type use a variable binding', () => {
      render(
        <QuickFormField
          locked={false}
          fieldType="single-select"
          mode="variable"
          onValueChange={vi.fn()}
          renderModeControl={(mode) => <span>control for {mode}</span>}
        />
      );
      expect(screen.getByText('control for variable')).toBeInTheDocument();
    });
  });

  // These are behaviours BUILT INTO the control rather than props on it. The
  // component renders both the input and the Insert menu, so the caret and the
  // value-at-focus are internal facts; exposing a ref so consumers could act on
  // them would be pushing an internal problem outward.
  describe('input behaviours', () => {
    it('commits on Enter by blurring, which is what onValueBlur already means', async () => {
      const user = userEvent.setup();
      const onValueBlur = vi.fn();
      render(
        <QuickFormField
          locked={false}
          value="hi"
          onValueChange={vi.fn()}
          onValueBlur={onValueBlur}
        />
      );
      const input = screen.getByPlaceholderText('String value');
      await user.click(input);
      await user.keyboard('{Enter}');
      expect(onValueBlur).toHaveBeenCalled();
    });

    it('reverts to the value as of focus on Escape', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(<QuickFormField locked={false} value="committed" onValueChange={onValueChange} />);
      const input = screen.getByPlaceholderText('String value');
      await user.click(input);
      await user.keyboard('{Escape}');
      expect(onValueChange).toHaveBeenLastCalledWith('committed');
    });

    it('splices an inserted variable at the caret once one has been placed', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <QuickFormField
          locked={false}
          value="ab"
          onValueChange={onValueChange}
          variables={[{ label: 'Item ID', value: 'item.id' }]}
        />
      );
      const input = screen.getByPlaceholderText('String value') as HTMLInputElement;
      await user.click(input);
      input.setSelectionRange(1, 1);
      // `select` is what the browser fires when the caret moves.
      input.dispatchEvent(new Event('select', { bubbles: true }));
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(screen.getByRole('option', { name: 'Item ID' }));
      expect(onValueChange).toHaveBeenLastCalledWith('aitem.idb');
    });

    // With no caret placed, insert appends. Splicing at the reported
    // selectionStart of 0 would prepend.
    it('appends when the author has not placed a caret', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <QuickFormField
          locked={false}
          value="hello"
          onValueChange={onValueChange}
          variables={[{ label: 'Item ID', value: 'item.id' }]}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(screen.getByRole('option', { name: 'Item ID' }));
      expect(onValueChange).toHaveBeenLastCalledWith('hello item.id');
    });
  });

  // The tree must show what it will insert, so it invents neither a root nor a type.
  describe('variable tree', () => {
    it('renders the entries exactly as supplied, inventing no root', async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField
          locked={false}
          onValueChange={vi.fn()}
          variables={[{ label: 'Item ID', value: 'item.id', type: 'number' }]}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      expect(screen.getByRole('option', { name: /Item ID/ })).toBeInTheDocument();
      // No invented parent.
      expect(screen.queryByRole('option', { name: /^\{\}\$vars$/ })).not.toBeInTheDocument();
    });

    it('inserts the qualified path a nested entry carries', async () => {
      const user = userEvent.setup();
      const onValueChange = vi.fn();
      render(
        <QuickFormField
          locked={false}
          onValueChange={onValueChange}
          variables={[
            {
              label: '$vars',
              value: '',
              type: 'object',
              children: [{ label: 'invoiceNumber', value: '$vars.invoiceNumber', type: 'string' }],
            },
          ]}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.click(screen.getByRole('option', { name: /invoiceNumber/ }));
      // What the path reads is what lands in the value.
      expect(onValueChange).toHaveBeenLastCalledWith('$vars.invoiceNumber');
    });
  });

  describe('renderModeControl', () => {
    it('hands variable and prompt to the consumer', () => {
      for (const mode of ['variable', 'prompt'] as const) {
        const render_ = vi.fn((m: string) => <span>{m} editor</span>);
        const { unmount } = render(
          <QuickFormField
            locked={false}
            mode={mode}
            onValueChange={vi.fn()}
            renderModeControl={render_}
          />
        );
        expect(screen.getByText(`${mode} editor`)).toBeInTheDocument();
        unmount();
      }
    });

    it('is offered every mode, including the ones with built-in controls', () => {
      // A surface that authors its own choices can replace the `literal` control too.
      for (const mode of ['literal', 'expression'] as const) {
        const render_ = vi.fn(() => <span>{mode} taken over</span>);
        const { unmount } = render(
          <QuickFormField
            locked={false}
            mode={mode}
            onValueChange={vi.fn()}
            renderModeControl={render_}
          />
        );
        expect(render_).toHaveBeenCalledWith(
          mode,
          expect.objectContaining({ fieldType: 'string' })
        );
        expect(screen.getByText(`${mode} taken over`)).toBeInTheDocument();
        unmount();
      }
    });

    it('keeps the built-in control when the consumer returns nothing for that mode', () => {
      render(
        <QuickFormField
          locked={false}
          mode="literal"
          onValueChange={vi.fn()}
          renderModeControl={() => null}
        />
      );
      expect(screen.getByPlaceholderText('String value')).toBeInTheDocument();
    });

    // An unhandled mode must degrade to the literal editor, not an empty row.
    it('falls back to the built-in control when the consumer renders nothing', () => {
      render(<QuickFormField locked={false} mode="variable" onValueChange={vi.fn()} />);
      expect(screen.getByPlaceholderText('String value')).toBeInTheDocument();
    });
  });
});
