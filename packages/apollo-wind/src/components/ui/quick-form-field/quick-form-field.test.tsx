import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { QuickFormField } from './quick-form-field';
import type { QuickFormFieldMode } from './types';

describe('QuickFormField', () => {
  it('keeps the value editable when locked', () => {
    const handleChange = vi.fn();
    render(<QuickFormField value="INV-2024-0587" locked onValueChange={handleChange} />);
    const input = screen.getByPlaceholderText('String value');
    expect(input).not.toHaveAttribute('readonly');
    fireEvent.change(input, { target: { value: 'INV-2024-0588' } });
    expect(handleChange).toHaveBeenCalledWith('INV-2024-0588');
  });

  it('disables every built-in control when disabled', () => {
    render(
      <QuickFormField
        disabled
        value="INV-2024-0587"
        onValueChange={vi.fn()}
        onLockedChange={vi.fn()}
        onModeChange={vi.fn()}
        onFieldTypeChange={vi.fn()}
        onRequiredChange={vi.fn()}
        onGenerateWithAi={vi.fn()}
        variables={[{ label: 'Item ID', value: 'item.id' }]}
        more={{ onClear: vi.fn() }}
      />
    );
    expect(screen.getByPlaceholderText('String value')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Read-only' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choose value mode' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Field type' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Optional field' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'AI assist' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it.each([
    ['boolean', 'switch'],
    ['single-select', 'combobox'],
    ['multi-select', 'combobox'],
  ] as const)('disables the %s control when disabled', (fieldType, role) => {
    render(<QuickFormField disabled fieldType={fieldType} onValueChange={vi.fn()} />);
    expect(screen.getByRole(role)).toBeDisabled();
  });

  it('renders an editable input when unlocked and onValueChange is provided', () => {
    render(<QuickFormField value="" locked={false} onValueChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('String value')).not.toHaveAttribute('readonly');
  });

  it('renders inline validation below the active value control', () => {
    render(
      <QuickFormField
        id="node-name"
        value="Invoice processor"
        error="Enter a unique name before saving."
        locked
      />
    );

    expect(screen.getByText('Enter a unique name before saving.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute(
      'aria-describedby',
      'node-name-error'
    );
  });

  it('renders a read-only input when unlocked but onValueChange is not provided', () => {
    render(<QuickFormField value="" locked={false} />);
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute('readonly');
  });

  it('can hide the built-in lock control', () => {
    render(<QuickFormField locked={false} showLock={false} />);
    expect(screen.queryByRole('button', { name: /Editable|Read-only/ })).not.toBeInTheDocument();
  });

  it('keeps a custom leading addon when the built-in lock control is hidden', () => {
    render(
      <QuickFormField
        locked={false}
        showLock={false}
        leadingAddon={<span data-testid="custom-leading-addon">=</span>}
      />
    );
    expect(screen.getByTestId('custom-leading-addon')).toBeInTheDocument();
  });

  it('forwards blur from the built-in value control', () => {
    const handleBlur = vi.fn();
    render(
      <QuickFormField value="" locked={false} onValueChange={vi.fn()} onValueBlur={handleBlur} />
    );

    fireEvent.blur(screen.getByPlaceholderText('String value'));
    expect(handleBlur).toHaveBeenCalledOnce();
  });

  it('provides the consumer expression editor with blur and field context', () => {
    const handleBlur = vi.fn();
    const renderExpressionEditor = vi.fn(({ onBlur }: { onBlur?: () => void }) => (
      <input aria-label="Custom editor" onBlur={onBlur} />
    ));
    render(
      <QuickFormField
        value=""
        locked={false}
        mode="expression"
        fieldType="integer"
        onValueChange={vi.fn()}
        onValueBlur={handleBlur}
        renderExpressionEditor={renderExpressionEditor}
      />
    );

    expect(renderExpressionEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        value: '',
        readOnly: false,
        fieldType: 'integer',
        placeholder: 'Write an integer expression',
        onBlur: handleBlur,
      })
    );
    fireEvent.blur(screen.getByRole('textbox', { name: 'Custom editor' }));
    expect(handleBlur).toHaveBeenCalledOnce();
  });

  it('withholds value changes from a consumer expression editor while disabled', () => {
    const renderExpressionEditor = vi.fn(() => <div>Custom editor</div>);
    render(
      <QuickFormField
        value="item.id"
        disabled
        mode="expression"
        onValueChange={vi.fn()}
        renderExpressionEditor={renderExpressionEditor}
      />
    );

    expect(renderExpressionEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'item.id',
        readOnly: true,
        disabled: true,
        onValueChange: undefined,
      })
    );
  });

  it('does not attach a value-change handler to the built-in expression input while disabled', () => {
    const handleChange = vi.fn();
    render(
      <QuickFormField value="item.id" disabled mode="expression" onValueChange={handleChange} />
    );

    const input = screen.getByDisplayValue('item.id');
    expect(input).toBeDisabled();
    fireEvent.change(input, { target: { value: 'other.id' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses the correct article in the built-in integer expression placeholder', () => {
    render(
      <QuickFormField
        value=""
        locked={false}
        mode="expression"
        fieldType="integer"
        onValueChange={vi.fn()}
      />
    );
    expect(screen.getByPlaceholderText('Write an integer expression')).toBeInTheDocument();
  });

  it('toggles locked state when the lock button is clicked', async () => {
    const user = userEvent.setup();
    const handleLockedChange = vi.fn();
    render(<QuickFormField locked onLockedChange={handleLockedChange} />);

    await user.click(screen.getByRole('button', { name: 'Read-only. Click to make editable.' }));
    expect(handleLockedChange).toHaveBeenCalledWith(false);
  });

  it('does not open a menu when the lock button is clicked', async () => {
    const user = userEvent.setup();
    render(<QuickFormField locked onLockedChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Read-only. Click to make editable.' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('only shows the Required switch when onRequiredChange is provided', () => {
    const { rerender } = render(<QuickFormField locked={false} />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    rerender(<QuickFormField locked={false} required onRequiredChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('only shows the field-type dropdown when onFieldTypeChange is provided', () => {
    const { rerender } = render(<QuickFormField locked={false} />);
    expect(screen.queryByRole('button', { name: 'Field type' })).not.toBeInTheDocument();

    rerender(<QuickFormField locked={false} onFieldTypeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Field type' })).toBeInTheDocument();
  });

  it('hides AI-assist and Insert-variable actions when showFieldActions is false', () => {
    render(<QuickFormField locked={false} showFieldActions={false} />);
    expect(screen.queryByRole('button', { name: 'AI assist' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert variable' })).not.toBeInTheDocument();
  });

  // The handler's absence is what hides the AI-assist action.
  it('hides the AI-assist action when there is no handler for it', () => {
    render(<QuickFormField locked={false} />);
    expect(screen.queryByRole('button', { name: 'AI assist' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeInTheDocument();
  });

  it('shows AI-assist and Insert-variable actions when both are wired', () => {
    render(<QuickFormField locked={false} onGenerateWithAi={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'AI assist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeInTheDocument();
  });

  it.each([
    'single-select',
    'multi-select',
  ] as const)('offers expression mode for a %s field', async (fieldType) => {
    const user = userEvent.setup();
    const handleModeChange = vi.fn();
    render(
      <QuickFormField
        fieldType={fieldType}
        onValueChange={vi.fn()}
        onModeChange={handleModeChange}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
    await user.click(screen.getByRole('menuitemradio', { name: /Expression/ }));
    expect(handleModeChange).toHaveBeenCalledWith('expression');
  });

  it.each([
    'single-select',
    'multi-select',
  ] as const)('renders the expression input for a %s field in expression mode', (fieldType) => {
    render(
      <QuickFormField
        fieldType={fieldType}
        mode="expression"
        value="$vars.choice"
        onValueChange={vi.fn()}
      />
    );
    expect(screen.getByDisplayValue('$vars.choice')).toHaveClass('font-mono');
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('lists the More actions under the value mode menu', async () => {
    const user = userEvent.setup();
    render(
      <QuickFormField
        locked={false}
        onValueChange={vi.fn()}
        onModeChange={vi.fn()}
        more={{ onClear: vi.fn(), onRefresh: vi.fn() }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Choose value mode' }));

    expect(screen.getByRole('menuitemradio', { name: /Fixed value/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Clear value' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Force refresh' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'More value actions' })).not.toBeInTheDocument();
  });

  it('offers only the More actions when there is no mode handler', async () => {
    const user = userEvent.setup();
    render(<QuickFormField locked={false} onValueChange={vi.fn()} more={{ onRefresh: vi.fn() }} />);

    expect(screen.queryByRole('button', { name: 'Choose value mode' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More value actions' }));
    expect(screen.getByRole('menuitem', { name: 'Force refresh' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument();
  });

  it('keeps Clear value available when locked', async () => {
    const user = userEvent.setup();
    render(<QuickFormField locked more={{ onClear: vi.fn(), onRefresh: vi.fn() }} />);

    await user.click(screen.getByRole('button', { name: 'More value actions' }));

    expect(screen.getByRole('menuitem', { name: 'Clear value' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Force refresh' })).toBeInTheDocument();
  });

  it('does not render More actions when no handlers are provided', () => {
    render(<QuickFormField locked={false} more={{}} />);
    expect(screen.queryByRole('button', { name: 'More value actions' })).not.toBeInTheDocument();
  });

  it('allows null addons to suppress the default controls', () => {
    const { container } = render(
      <QuickFormField
        locked={false}
        leadingAddon={null}
        trailingAddon={null}
        onLockedChange={vi.fn()}
        onModeChange={vi.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /Editable/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Choose value mode' })).not.toBeInTheDocument();
    expect(
      container.querySelector('[role="group"].bg-surface-overlay > [role="group"]')
    ).not.toBeInTheDocument();
  });

  it('renders headerActions content after the built-in controls', () => {
    render(
      <QuickFormField locked={false} headerActions={<button type="button">Delete field</button>} />
    );
    expect(screen.getByRole('button', { name: 'Delete field' })).toBeInTheDocument();
  });

  it('renders a Switch control for boolean fields when unlocked', () => {
    render(<QuickFormField locked={false} fieldType="boolean" value="true" />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('disables the boolean Switch when unlocked but onValueChange is not provided', () => {
    render(<QuickFormField locked={false} fieldType="boolean" value="true" />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('disables the date-picker trigger when unlocked but onValueChange is not provided', () => {
    render(<QuickFormField locked={false} fieldType="date" />);
    expect(screen.getByText('Pick a date').closest('button')).toBeDisabled();
  });

  it('calls onValueBlur when the date picker closes, not when focus enters its calendar', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    render(
      <QuickFormField
        locked={false}
        fieldType="date"
        onValueChange={vi.fn()}
        onValueBlur={handleBlur}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Date value' }));
    expect(handleBlur).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(handleBlur).toHaveBeenCalledOnce();
  });

  it('disables the single-select trigger when unlocked but onValueChange is not provided', () => {
    render(<QuickFormField locked={false} fieldType="single-select" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('calls onValueBlur when the single-select closes, not when focus enters its menu', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    render(
      <QuickFormField
        locked={false}
        fieldType="single-select"
        onValueChange={vi.fn()}
        onValueBlur={handleBlur}
      />
    );

    await user.click(screen.getByRole('combobox'));
    expect(handleBlur).not.toHaveBeenCalled();

    await user.keyboard('{Escape}');
    expect(handleBlur).toHaveBeenCalledOnce();
  });

  it('disables the multi-select trigger when unlocked but onValueChange is not provided', () => {
    render(<QuickFormField locked={false} fieldType="multi-select" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders a file upload control for file fields when unlocked', () => {
    const { container } = render(<QuickFormField locked={false} fieldType="file" />);
    expect(screen.getByText(/drag/i, { exact: false })).toBeInTheDocument();
    expect(container.querySelector('[role="group"]')).toHaveAttribute('data-layout', 'grow');
  });

  it('keeps a file field in expression mode in the row layout', () => {
    const { container } = render(
      <QuickFormField fieldType="file" mode="expression" value="$vars.invoice" />
    );
    expect(container.querySelector('[role="group"]')).toHaveAttribute('data-layout', 'row');
  });

  it('does not force the Future overlay background in classic themes', () => {
    const { container } = render(<QuickFormField locked={false} value="INV-2024-0587" />);
    expect(container.querySelector('[role="group"]')).not.toHaveClass('bg-surface-overlay');
  });

  it('allows expression values for file and object fields', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <QuickFormField
        fieldType="file"
        mode="expression"
        value="$vars.flowTest"
        locked={false}
        onValueChange={onValueChange}
        leadingAddon={<span>=</span>}
      />
    );

    expect(screen.getByDisplayValue('$vars.flowTest')).toBeInTheDocument();
    expect(screen.getByText('=')).toBeInTheDocument();

    rerender(
      <QuickFormField
        fieldType="object"
        mode="expression"
        value="$vars.flowTest"
        locked={false}
        onValueChange={onValueChange}
        leadingAddon={<span>=</span>}
      />
    );
    expect(screen.getByDisplayValue('$vars.flowTest')).toHaveClass('font-mono');
  });

  it('renders content below the value control', () => {
    render(<QuickFormField belowValue={<span>End exchange</span>} />);
    expect(screen.getByText('End exchange')).toBeInTheDocument();
  });

  it('disables the file upload control when unlocked but onValueChange is not provided', () => {
    const { container } = render(<QuickFormField locked={false} fieldType="file" />);
    expect(container.querySelector('input[type="file"]')).toBeDisabled();
  });

  it('associates the multi-select control with a custom label via the generated id', () => {
    render(
      <QuickFormField
        locked={false}
        fieldType="multi-select"
        label={<label htmlFor="tags-field">Tags</label>}
        id="tags-field"
      />
    );
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
  });

  it('keeps a custom label when the header has no controls beside it', () => {
    render(
      <QuickFormField
        locked
        showFieldActions={false}
        id="node-name"
        label={<label htmlFor="node-name">Node name</label>}
      />
    );
    expect(screen.getByLabelText('Node name')).toBeInTheDocument();
  });

  it("uses the field's computed label as the file upload area's accessible name", () => {
    render(<QuickFormField locked={false} fieldType="file" />);
    expect(screen.getByRole('button', { name: 'File value' })).toBeInTheDocument();
  });

  it('associates the file upload control with a custom label via the generated id', () => {
    render(
      <QuickFormField
        locked={false}
        fieldType="file"
        label={<label htmlFor="attachment-field">Attachment</label>}
        id="attachment-field"
      />
    );
    expect(screen.getByLabelText('Attachment')).toBeInTheDocument();
  });

  it('uses an explicit accessible name for a custom file field label', () => {
    render(
      <QuickFormField
        locked={false}
        fieldType="file"
        label={<span>Supporting document</span>}
        fileUploadAriaLabel="Supporting document"
      />
    );
    expect(screen.getByRole('button', { name: 'Supporting document' })).toBeInTheDocument();
  });

  it('ignores non-string entries when parsing a multi-select value', () => {
    const options = [{ label: 'Alpha', value: 'alpha' }];
    render(
      <QuickFormField
        fieldType="multi-select"
        value={JSON.stringify(['alpha', 42, null])}
        options={options}
        onValueChange={vi.fn()}
      />
    );
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('shows the raw value instead of throwing when unlocked with an invalid date', () => {
    expect(() =>
      render(<QuickFormField locked={false} fieldType="date" value="not-a-date" />)
    ).not.toThrow();
    expect(screen.getByRole('button', { name: 'Date value' })).toHaveTextContent('not-a-date');
  });

  it('rejects an out-of-range date-only value instead of silently normalizing it', () => {
    render(<QuickFormField fieldType="date" value="2024-13-40" />);
    expect(screen.getByRole('button', { name: 'Date value' })).toHaveTextContent('2024-13-40');
  });

  it('formats a date-only value using the local calendar day, not UTC', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      render(<QuickFormField fieldType="date" value="2024-01-15" />);
      const expected = new Date(2024, 0, 15).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(screen.getByRole('button', { name: 'Date value' })).toHaveTextContent(expected);
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });

  it('associates the default label with the field via a generated id when none is provided', () => {
    render(<QuickFormField locked={false} />);
    expect(screen.getByLabelText('String value')).toBeInTheDocument();
  });

  it('disables the lock button when onLockedChange is not provided', () => {
    render(<QuickFormField locked />);
    expect(screen.getByRole('button', { name: 'Read-only' })).toBeDisabled();
  });

  it('enables the lock button and uses the click-to-toggle label when onLockedChange is provided', () => {
    render(<QuickFormField locked onLockedChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Read-only. Click to make editable.' })
    ).not.toBeDisabled();
  });

  it('renders consumer-supplied options for single-select instead of the demo defaults', () => {
    const options = [{ label: 'Custom option', value: 'custom' }];
    render(
      <QuickFormField locked={false} fieldType="single-select" value="custom" options={options} />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Custom option');
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('calls onGenerateWithAi with the entered prompt when Generate is clicked', async () => {
    const user = userEvent.setup();
    const handleGenerate = vi.fn();
    render(<QuickFormField locked={false} onGenerateWithAi={handleGenerate} />);

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    await user.type(screen.getByLabelText('Describe what you want'), 'a random number');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(handleGenerate).toHaveBeenCalledWith('a random number');
  });

  it('disables the value mode trigger when onModeChange is not provided', () => {
    render(<QuickFormField locked={false} fieldType="string" />);
    expect(screen.getByRole('button', { name: 'Choose value mode' })).toBeDisabled();
  });

  it('enables the value mode trigger when onModeChange is provided', () => {
    render(<QuickFormField locked={false} fieldType="string" onModeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Choose value mode' })).not.toBeDisabled();
  });

  it.each([
    ['date', 'literal', 'Output: Date value'],
    ['single-select', 'expression', 'Output: Single select expression'],
  ] as const)('describes a %s field in %s mode in the AI-assist output hint', async (fieldType, mode, hint) => {
    const user = userEvent.setup();
    render(<QuickFormField fieldType={fieldType} mode={mode} onGenerateWithAi={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(screen.getByText(hint)).toBeInTheDocument();
  });

  it('reflects the field type and mode in the default label', () => {
    const { rerender } = render(<QuickFormField locked={false} fieldType="integer" />);
    expect(screen.getByPlaceholderText('Integer value')).toBeInTheDocument();

    rerender(<QuickFormField locked={false} fieldType="date" mode="expression" />);
    expect(screen.getByPlaceholderText('Write a date expression')).toBeInTheDocument();
  });

  it('disables Insert variable when no variables are provided', () => {
    render(<QuickFormField locked={false} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('disables Insert variable when variables are provided but onValueChange is not', () => {
    render(<QuickFormField locked={false} variables={[{ label: 'Item ID', value: 'item.id' }]} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('keeps Insert variable available while the field is locked', () => {
    render(
      <QuickFormField
        locked
        onValueChange={vi.fn()}
        variables={[{ label: 'Item ID', value: 'item.id' }]}
      />
    );
    expect(screen.getByRole('button', { name: 'Insert variable' })).not.toBeDisabled();
  });

  it('appends the selected variable to the current value when Insert variable is used', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <QuickFormField
        locked={false}
        value="hello"
        onValueChange={handleValueChange}
        variables={[{ label: 'Item ID', value: 'item.id' }]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    await user.click(screen.getByRole('option', { name: 'Item ID' }));

    expect(handleValueChange).toHaveBeenCalledWith('hello item.id');
  });

  it('keeps repeated group labels apart in the variable picker', async () => {
    const user = userEvent.setup();
    const onInsertVariable = vi.fn();
    const second = { label: 'Order id B', value: 'b.id', type: 'string' };
    render(
      <QuickFormField
        locked={false}
        onValueChange={vi.fn()}
        onInsertVariable={onInsertVariable}
        variables={[
          { label: 'Order', value: '', children: [{ label: 'Order id A', value: 'a.id' }] },
          { label: 'Order', value: '', children: [second] },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Insert variable' }));
    // Only the first group opens by default; a shared id would open both.
    expect(screen.getByRole('option', { name: /Order id A/ })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: /Order id B/ })).toBeNull();

    await user.click(screen.getAllByRole('option', { name: /^Order$/ })[1]);
    await user.click(screen.getByRole('option', { name: /Order id B/ }));
    expect(onInsertVariable).toHaveBeenCalledWith(second, expect.anything());
  });

  it('commits a datetime edit when its picker closes', async () => {
    const user = userEvent.setup();
    const onValueBlur = vi.fn();
    const { container } = render(
      <QuickFormField
        locked={false}
        fieldType="datetime"
        value="2024-06-15T09:00:00.000Z"
        onValueChange={vi.fn()}
        onValueBlur={onValueBlur}
      />
    );
    await user.click(
      container.querySelector('button[data-slot="input-group-control"]') as HTMLElement
    );
    expect(onValueBlur).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onValueBlur).toHaveBeenCalledTimes(1);
  });

  it('gives a custom mode control the validation wiring', () => {
    const renderModeControl = vi.fn(() => <input aria-label="Custom" />);
    render(
      <QuickFormField
        id="field"
        locked={false}
        mode="variable"
        error="Pick a variable"
        renderModeControl={renderModeControl}
      />
    );
    expect(renderModeControl).toHaveBeenCalledWith(
      'variable',
      expect.objectContaining({
        'aria-invalid': true,
        'aria-describedby': 'field-error',
        'aria-errormessage': 'field-error',
        'data-slot': 'input-group-control',
      })
    );
  });

  it('keeps the multi-select on one row, counting chips that do not fit', () => {
    const { container } = render(
      <QuickFormField
        locked
        fieldType="multi-select"
        value={JSON.stringify(['option-1', 'option-2', 'option-3'])}
        onValueChange={vi.fn()}
        strings={{ multiSelect: { overflowLabel: (count) => `${count} weitere` } }}
      />
    );
    expect(container.querySelector('[role="group"]')).toHaveAttribute('data-layout', 'row');
    // The count is measured, so every count it could show (1 to 2 of 3 chips) is mounted.
    expect(screen.getAllByText(/weitere/)).toHaveLength(2);
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <QuickFormField
        locked={false}
        required
        onRequiredChange={vi.fn()}
        onFieldTypeChange={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  describe('info tooltip', () => {
    const follows = (a: Element, b: Element) =>
      !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    it('places it after the computed label and its asterisk', async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField required onRequiredChange={vi.fn()} tooltip="Shown to the approver" />
      );
      const label = screen.getByText('String value', { selector: 'label' });
      const info = screen.getByRole('button', { name: 'More information' });
      expect(label).toHaveTextContent('*');
      expect(follows(label, info)).toBe(true);
      await user.hover(info);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Shown to the approver');
    });

    it('places it after the editable label and its asterisk', () => {
      const { container } = render(
        <QuickFormField label="Invoice" onLabelChange={vi.fn()} required tooltip="Help" />
      );
      const asterisk = container.querySelector('[data-slot="editable-text"] + span');
      const info = screen.getByRole('button', { name: 'More information' });
      expect(asterisk).toHaveTextContent('*');
      expect(follows(asterisk as Element, info)).toBe(true);
    });

    it('places it after a custom label standing alone', async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField label={<span>Custom</span>} showFieldActions={false} tooltip="Help" />
      );
      const info = screen.getByRole('button', { name: 'More information' });
      expect(follows(screen.getByText('Custom'), info)).toBe(true);
      await user.hover(info);
      expect(await screen.findByRole('tooltip')).toHaveTextContent('Help');
    });

    it('renders no trigger for a blank tooltip', () => {
      render(<QuickFormField label="Invoice" onLabelChange={vi.fn()} tooltip="  " />);
      expect(screen.queryByRole('button', { name: 'More information' })).not.toBeInTheDocument();
    });

    it('names the trigger from strings', () => {
      render(<QuickFormField tooltip="Help" strings={{ tooltipAriaLabel: 'Mehr erfahren' }} />);
      expect(screen.getByRole('button', { name: 'Mehr erfahren' })).toBeInTheDocument();
    });
  });

  describe('editable label', () => {
    it('edits a string label in place and commits the trimmed text', async () => {
      const user = userEvent.setup();
      const handleLabelChange = vi.fn();
      render(<QuickFormField label="Invoice" onLabelChange={handleLabelChange} />);

      await user.click(screen.getByRole('button', { name: 'Field label: Invoice' }));
      const input = screen.getByRole('textbox', { name: 'Field label' });
      expect(input).toHaveFocus();
      await user.keyboard('  Invoice total  {Enter}');

      expect(handleLabelChange).toHaveBeenCalledExactlyOnceWith('Invoice total');
      expect(screen.queryByRole('textbox', { name: 'Field label' })).not.toBeInTheDocument();
    });

    it('reverts on Escape without committing', async () => {
      const user = userEvent.setup();
      const handleLabelChange = vi.fn();
      render(<QuickFormField label="Invoice" onLabelChange={handleLabelChange} />);

      await user.click(screen.getByRole('button', { name: 'Field label: Invoice' }));
      await user.keyboard('Total{Escape}');

      expect(handleLabelChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Field label: Invoice' })).toBeInTheDocument();
    });

    it('commits a cleared label too, and shows the old one again when it is not applied', async () => {
      const user = userEvent.setup();
      const handleLabelChange = vi.fn();
      render(<QuickFormField label="Invoice" onLabelChange={handleLabelChange} />);

      await user.click(screen.getByRole('button', { name: 'Field label: Invoice' }));
      await user.keyboard('{Backspace}{Enter}');

      expect(handleLabelChange).toHaveBeenCalledExactlyOnceWith('');
      // The consumer left `label` as it was, which is how it rejects a value.
      expect(screen.getByRole('button', { name: 'Field label: Invoice' })).toBeInTheDocument();
    });

    it('shows a label the consumer changes after an edit was reverted', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<QuickFormField label="Invoice" onLabelChange={vi.fn()} />);

      await user.click(screen.getByRole('button', { name: 'Field label: Invoice' }));
      await user.keyboard('Total{Escape}');
      rerender(<QuickFormField label="Receipt" onLabelChange={vi.fn()} />);

      expect(screen.getByRole('button', { name: 'Field label: Receipt' })).toBeInTheDocument();
    });

    it('marks a required field with the asterisk beside the editable label', () => {
      const { container, rerender } = render(
        <QuickFormField label="Invoice" onLabelChange={vi.fn()} required />
      );
      expect(container.querySelector('[data-slot="editable-text"] + span')).toHaveTextContent('*');

      rerender(<QuickFormField label="Invoice" onLabelChange={vi.fn()} required={false} />);
      expect(container.querySelector('[data-slot="editable-text"] + span')).toBeNull();
    });

    it("follows the consumer's isEditingLabel state", async () => {
      const user = userEvent.setup();
      const handleEditingChange = vi.fn();
      const { rerender } = render(
        <QuickFormField
          label=""
          onLabelChange={vi.fn()}
          isEditingLabel
          onIsEditingLabelChange={handleEditingChange}
        />
      );
      expect(screen.getByRole('textbox', { name: 'Field label' })).toHaveFocus();
      await user.keyboard('{Escape}');
      expect(handleEditingChange).toHaveBeenLastCalledWith(false);

      rerender(
        <QuickFormField
          label="Invoice"
          onLabelChange={vi.fn()}
          isEditingLabel={false}
          onIsEditingLabelChange={handleEditingChange}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Field label: Invoice' }));
      expect(handleEditingChange).toHaveBeenLastCalledWith(true);
    });

    it('keeps the label as-is while disabled', async () => {
      const user = userEvent.setup();
      render(<QuickFormField label="Invoice" onLabelChange={vi.fn()} disabled />);
      const trigger = screen.getByRole('button', { name: 'Field label: Invoice' });
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      await user.click(trigger);
      expect(screen.queryByRole('textbox', { name: 'Field label' })).not.toBeInTheDocument();
    });

    it('names and fills an empty label from strings', () => {
      render(
        <QuickFormField
          label=""
          onLabelChange={vi.fn()}
          strings={{ labelAriaLabel: 'Feldname', labelPlaceholder: 'Unbenanntes Feld' }}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Feldname: Unbenanntes Feld' })
      ).toBeInTheDocument();
    });

    it('leaves a string label static without onLabelChange', () => {
      render(<QuickFormField label="Invoice" />);
      expect(screen.queryByRole('button', { name: /Field label/ })).not.toBeInTheDocument();
      expect(screen.getByText('Invoice')).toBeInTheDocument();
    });

    it.each([
      ['with header controls', { onRequiredChange: vi.fn() }],
      ['alone', { showFieldActions: false }],
    ] as const)('renders labelAddon before the label %s', (_, props) => {
      render(
        <QuickFormField
          label="Invoice"
          onLabelChange={vi.fn()}
          labelAddon={<button type="button">Drag to reorder</button>}
          {...props}
        />
      );
      const handle = screen.getByRole('button', { name: 'Drag to reorder' });
      const label = screen.getByRole('button', { name: 'Field label: Invoice' });
      expect(handle.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('renders labelAddon beside the computed label too', () => {
      render(<QuickFormField labelAddon={<span>handle</span>} onRequiredChange={vi.fn()} />);
      expect(screen.getByText('handle')).toBeInTheDocument();
      expect(screen.getByText('String value', { selector: 'label' })).toBeInTheDocument();
    });
  });

  describe('value modes', () => {
    const FOUR_MODES = ['literal', 'expression', 'variable', 'prompt'] as const;
    const VARIABLES = [
      { label: 'Customer name', value: 'vars.customerName', type: 'string' },
      { label: 'Invoice total', value: 'vars.invoiceTotal', type: 'number' },
    ];

    it('offers the listed modes, in order', async () => {
      const user = userEvent.setup();
      render(<QuickFormField valueModes={['variable', 'literal']} onModeChange={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
      const items = screen.getAllByRole('menuitemradio');
      expect(items.map((item) => item.textContent)).toEqual([
        expect.stringContaining('Variable'),
        expect.stringContaining('Fixed value'),
      ]);
    });

    it('offers no switch with a single mode, only the actions', async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField
          valueModes={['literal']}
          onModeChange={vi.fn()}
          more={{ onClear: vi.fn() }}
        />
      );
      expect(screen.queryByRole('button', { name: 'Choose value mode' })).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'More value actions' }));
      expect(screen.queryByRole('menuitemradio')).not.toBeInTheDocument();
    });

    it('marks Clear value as destructive', async () => {
      const user = userEvent.setup();
      render(<QuickFormField onModeChange={vi.fn()} more={{ onClear: vi.fn() }} />);
      await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
      expect(screen.getByRole('menuitem', { name: 'Clear value' })).toHaveClass('text-error');
    });

    it('renders a variable picker in variable mode, and drops the header Insert', async () => {
      const user = userEvent.setup();
      const handleValueChange = vi.fn();
      render(
        <QuickFormField mode="variable" onValueChange={handleValueChange} variables={VARIABLES} />
      );
      expect(screen.queryByRole('button', { name: 'Insert variable' })).not.toBeInTheDocument();
      await user.click(screen.getByText('Select a variable'));
      await user.click(await screen.findByText('Invoice total'));
      expect(handleValueChange).toHaveBeenCalledWith('vars.invoiceTotal');
    });

    it('shows the bound reference in variable mode', () => {
      render(<QuickFormField mode="variable" value="vars.customerName" onValueChange={vi.fn()} />);
      expect(screen.getByText('vars.customerName')).toBeInTheDocument();
    });

    it("hands a variable-mode pick to onInsertVariable as the consumer's own entry", async () => {
      const user = userEvent.setup();
      const handleInsert = vi.fn();
      const handleValueChange = vi.fn();
      render(
        <QuickFormField
          mode="variable"
          value="vars.customerName"
          onValueChange={handleValueChange}
          onInsertVariable={handleInsert}
          variables={VARIABLES}
        />
      );
      await user.click(screen.getByText('vars.customerName'));
      await user.click(await screen.findByText('Invoice total'));
      expect(handleInsert).toHaveBeenCalledWith(VARIABLES[1], {
        value: 'vars.customerName',
        caret: null,
      });
      expect(handleValueChange).not.toHaveBeenCalled();
    });

    it('disables the variable picker while disabled', () => {
      render(
        <QuickFormField disabled mode="variable" onValueChange={vi.fn()} variables={VARIABLES} />
      );
      expect(screen.getByText('Select a variable').closest('button')).toBeDisabled();
    });

    it('keeps a consumer variable control, and the header Insert beside it', () => {
      render(
        <QuickFormField
          mode="variable"
          onValueChange={vi.fn()}
          variables={VARIABLES}
          renderModeControl={(mode) => (mode === 'variable' ? <span>typed binding</span> : null)}
        />
      );
      expect(screen.getByText('typed binding')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Insert variable' })).toBeInTheDocument();
    });

    it('renders the prompt in an agent box that grows with it', () => {
      const handleValueChange = vi.fn();
      const { container } = render(
        <QuickFormField mode="prompt" value="" onValueChange={handleValueChange} />
      );
      const prompt = screen.getByPlaceholderText('Describe the value');
      expect(prompt.tagName).toBe('TEXTAREA');
      const group = container.querySelector('[role="group"]');
      expect(group).toHaveAttribute('data-layout', 'grow');
      expect(group).toHaveClass('border-gradient-agent-start/60');
      fireEvent.change(prompt, { target: { value: 'The customer on the invoice' } });
      expect(handleValueChange).toHaveBeenCalledWith('The customer on the invoice');
    });

    it.each([
      ['variable', 'Select a variable'],
      ['prompt', 'Describe the value'],
    ] as const)('focuses the %s control when switched to it', async (mode, text) => {
      const { rerender } = render(<QuickFormField mode="literal" onValueChange={vi.fn()} />);
      rerender(<QuickFormField mode={mode} onValueChange={vi.fn()} />);
      const control = () =>
        mode === 'prompt'
          ? screen.getByPlaceholderText(text)
          : screen.getByText(text).closest('button');
      await waitFor(() => expect(control()).toHaveFocus());
    });

    // The menu and dialog return focus to where they opened from once they finish closing, which
    // in a browser lands after the frame the control takes focus in. jsdom closes them at once, so
    // these watch the trigger instead of the timing.
    describe('focus as the menu or dialog closes', () => {
      it('keeps focus off the menu trigger after a switch', async () => {
        const user = userEvent.setup();
        render(<QuickFormField valueModes={FOUR_MODES} onModeChange={vi.fn()} />);
        const trigger = screen.getByRole('button', { name: 'Choose value mode' });
        await user.click(trigger);
        const focus = vi.spyOn(trigger, 'focus');
        await user.click(screen.getByRole('menuitemradio', { name: /Prompt/ }));
        expect(focus).not.toHaveBeenCalled();
      });

      it('returns focus to the menu trigger when the active mode is picked again', async () => {
        const user = userEvent.setup();
        render(<QuickFormField valueModes={FOUR_MODES} onModeChange={vi.fn()} />);
        const trigger = screen.getByRole('button', { name: 'Choose value mode' });
        await user.click(trigger);
        const focus = vi.spyOn(trigger, 'focus');
        await user.click(screen.getByRole('menuitemradio', { name: /Fixed value/ }));
        expect(focus).toHaveBeenCalled();
      });

      it('leaves focus on the new control after a confirmed switch', async () => {
        const user = userEvent.setup();
        function Switching() {
          const [mode, setMode] = useState<QuickFormFieldMode>('literal');
          return (
            <QuickFormField
              value="Hello"
              mode={mode}
              valueModes={FOUR_MODES}
              onModeChange={setMode}
              onValueChange={vi.fn()}
              confirmModeChange={() => true}
            />
          );
        }
        render(<Switching />);
        await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
        await user.click(screen.getByRole('menuitemradio', { name: /Prompt/ }));
        const confirm = screen.getByRole('button', { name: 'Switch' });
        // Every element focused from here on, other than the button clicked.
        const focused: HTMLElement[] = [];
        const nativeFocus = HTMLElement.prototype.focus;
        const focus = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (
          this: HTMLElement,
          options?: FocusOptions
        ) {
          if (this !== confirm) focused.push(this);
          nativeFocus.call(this, options);
        });
        await user.click(confirm);
        await waitFor(() =>
          expect(screen.getByPlaceholderText('Describe the value')).toHaveFocus()
        );
        expect(focused.every((el) => el.tagName === 'TEXTAREA')).toBe(true);
        focus.mockRestore();
      });
    });

    it('does not take focus on mount', async () => {
      render(<QuickFormField mode="variable" onValueChange={vi.fn()} />);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      expect(document.body).toHaveFocus();
    });

    describe('confirmModeChange', () => {
      const openMenuAndPick = async (user: ReturnType<typeof userEvent.setup>, name: RegExp) => {
        await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
        await user.click(screen.getByRole('menuitemradio', { name }));
      };

      it('switches straight away when it returns false', async () => {
        const user = userEvent.setup();
        const handleModeChange = vi.fn();
        render(
          <QuickFormField
            valueModes={FOUR_MODES}
            onModeChange={handleModeChange}
            confirmModeChange={() => false}
          />
        );
        await openMenuAndPick(user, /Prompt/);
        expect(handleModeChange).toHaveBeenCalledWith('prompt');
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });

      it('asks first, and switches only once confirmed', async () => {
        const user = userEvent.setup();
        const handleModeChange = vi.fn();
        const confirm = vi.fn(() => true);
        render(
          <QuickFormField
            value="Hello"
            valueModes={FOUR_MODES}
            onModeChange={handleModeChange}
            confirmModeChange={confirm}
          />
        );
        await openMenuAndPick(user, /Prompt/);
        expect(confirm).toHaveBeenCalledWith('literal', 'prompt');
        expect(screen.getByRole('alertdialog', { name: 'Switch value mode?' })).toBeInTheDocument();
        expect(handleModeChange).not.toHaveBeenCalled();

        await user.click(screen.getByRole('button', { name: 'Switch' }));
        expect(handleModeChange).toHaveBeenCalledOnce();
        expect(handleModeChange).toHaveBeenCalledWith('prompt');
      });

      it('keeps the mode when cancelled', async () => {
        const user = userEvent.setup();
        const handleModeChange = vi.fn();
        render(
          <QuickFormField
            valueModes={FOUR_MODES}
            onModeChange={handleModeChange}
            confirmModeChange={() => true}
          />
        );
        await openMenuAndPick(user, /Prompt/);
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(handleModeChange).not.toHaveBeenCalled();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });

      it('words the dialog from what it returns, then from strings', async () => {
        const user = userEvent.setup();
        render(
          <QuickFormField
            valueModes={FOUR_MODES}
            onModeChange={vi.fn()}
            confirmModeChange={() => ({ title: 'Drop the prompt?', confirmLabel: 'Drop' })}
            strings={{
              valueModes: { lossyDescription: 'Der Wert geht verloren.', cancel: 'Abbrechen' },
            }}
          />
        );
        await openMenuAndPick(user, /Prompt/);
        const dialog = screen.getByRole('alertdialog', { name: 'Drop the prompt?' });
        expect(dialog).toHaveTextContent('Der Wert geht verloren.');
        expect(screen.getByRole('button', { name: 'Drop' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Abbrechen' })).toBeInTheDocument();
      });

      it('does not ask when the active mode is picked again', async () => {
        const user = userEvent.setup();
        const confirm = vi.fn(() => true);
        render(
          <QuickFormField
            valueModes={FOUR_MODES}
            onModeChange={vi.fn()}
            confirmModeChange={confirm}
          />
        );
        await openMenuAndPick(user, /Fixed value/);
        expect(confirm).not.toHaveBeenCalled();
        expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('strings', () => {
    it('reads the header chrome from strings', () => {
      render(
        <QuickFormField
          locked={false}
          onValueChange={vi.fn()}
          onFieldTypeChange={vi.fn()}
          variables={[{ label: 'Item ID', value: 'item.id' }]}
          strings={{ fieldTypeAriaLabel: 'Feldtyp', insertAriaLabel: 'Variable einfügen' }}
        />
      );
      expect(screen.getByRole('button', { name: 'Feldtyp' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Variable einfügen' })).toBeInTheDocument();
    });

    it('builds the computed field name from strings in both modes', () => {
      const strings = {
        typeLabels: { string: 'Text' },
        valueFieldLabel: (type: string) => `Wert (${type})`,
        expressionFieldLabel: (type: string) => `Ausdruck (${type})`,
      };
      const { rerender } = render(<QuickFormField locked strings={strings} />);
      expect(screen.getByPlaceholderText('Wert (Text)')).toBeInTheDocument();
      rerender(<QuickFormField locked mode="expression" strings={strings} />);
      expect(screen.getByPlaceholderText('Ausdruck (Text)')).toBeInTheDocument();
    });

    it('labels the literal mode item from strings, falling back to the type meta', async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField
          locked={false}
          onValueChange={vi.fn()}
          onModeChange={vi.fn()}
          strings={{ literalLabels: { string: 'Fester Wert' } }}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
      expect(screen.getByText('Fester Wert')).toBeInTheDocument();
      expect(screen.getByText('Use a literal string value')).toBeInTheDocument();
    });

    it('reads the variable and prompt modes from strings.valueModes', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <QuickFormField
          valueModes={['literal', 'variable', 'prompt']}
          onModeChange={vi.fn()}
          strings={{ valueModes: { variableTitle: 'Variable binden', promptTitle: 'Anweisung' } }}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Choose value mode' }));
      expect(screen.getByRole('menuitemradio', { name: /Variable binden/ })).toBeInTheDocument();
      expect(screen.getByRole('menuitemradio', { name: /Anweisung/ })).toBeInTheDocument();
      await user.keyboard('{Escape}');

      rerender(
        <QuickFormField
          mode="variable"
          onValueChange={vi.fn()}
          strings={{ valueModes: { variablePlaceholder: 'Variable wählen' } }}
        />
      );
      expect(screen.getByText('Variable wählen')).toBeInTheDocument();
    });

    it("reads the multi-select's search, empty and Clear all text from strings", async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField
          fieldType="multi-select"
          value={JSON.stringify(['option-1'])}
          onValueChange={vi.fn()}
          strings={{
            multiSelectSearchPlaceholder: 'Suchen...',
            multiSelectEmpty: 'Nichts gefunden.',
            multiSelectClearAll: (count) => `Alle ${count} entfernen`,
          }}
        />
      );
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByText('Alle 1 entfernen')).toBeInTheDocument();
      await user.type(screen.getByPlaceholderText('Suchen...'), 'zzz');
      expect(screen.getByText('Nichts gefunden.')).toBeInTheDocument();
    });

    it("reads the variable picker's search and empty text from strings", async () => {
      const user = userEvent.setup();
      render(
        <QuickFormField
          locked={false}
          onValueChange={vi.fn()}
          variables={[{ label: 'Item ID', value: 'item.id' }]}
          strings={{ insertSearchPlaceholder: 'Variablen suchen', insertEmpty: 'Keine Variablen' }}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Insert variable' }));
      await user.type(screen.getByPlaceholderText('Variablen suchen'), 'zzz');
      expect(screen.getByText('Keine Variablen')).toBeInTheDocument();
    });

    it('reads the AI output hint and its pending and error states from strings', async () => {
      const user = userEvent.setup();
      let reject: (reason: unknown) => void = () => {};
      const onGenerateWithAi = vi.fn(
        () =>
          new Promise<void>((_, r) => {
            reject = r;
          })
      );
      render(
        <QuickFormField
          locked={false}
          fieldType="date"
          mode="expression"
          onGenerateWithAi={onGenerateWithAi}
          strings={{
            typeLabels: { date: 'Datum' },
            aiOutputLabel: (type, isExpression) => `${type}-${isExpression ? 'Ausdruck' : 'Wert'}`,
            aiOutputHint: (output) => `Ausgabe: ${output}`,
            aiGenerating: 'Wird generiert',
            aiError: 'Fehlgeschlagen',
          }}
        />
      );
      await user.click(screen.getByRole('button', { name: 'AI assist' }));
      expect(screen.getByText('Ausgabe: Datum-Ausdruck')).toBeInTheDocument();

      await user.type(screen.getByLabelText('Describe what you want'), 'next week');
      await user.click(screen.getByRole('button', { name: 'Generate' }));
      expect(await screen.findByText('Wird generiert')).toBeInTheDocument();

      reject(new Error('nope'));
      expect(await screen.findByText('Fehlgeschlagen')).toBeInTheDocument();
    });
  });
});
