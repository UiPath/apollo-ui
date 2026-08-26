import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { LockableValueField } from './lockable-value-field';

describe('LockableValueField', () => {
  it('renders a read-only display value when locked', () => {
    render(<LockableValueField value="INV-2024-0587" locked />);
    expect(screen.getByPlaceholderText('String value')).toHaveValue('INV-2024-0587');
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute('readonly');
  });

  it('renders an editable input when unlocked and onValueChange is provided', () => {
    render(<LockableValueField value="" locked={false} onValueChange={vi.fn()} />);
    expect(screen.getByPlaceholderText('String value')).not.toHaveAttribute('readonly');
  });

  it('renders inline validation below the active value control', () => {
    render(
      <LockableValueField
        id="node-name"
        value="Invoice processor"
        error="Enter a unique name before saving."
        locked
      />
    );

    expect(screen.getByRole('status')).toHaveTextContent('Enter a unique name before saving.');
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute(
      'aria-describedby',
      'node-name-error'
    );
  });

  it('renders a read-only input when unlocked but onValueChange is not provided', () => {
    render(<LockableValueField value="" locked={false} />);
    expect(screen.getByPlaceholderText('String value')).toHaveAttribute('readonly');
  });

  it('forwards blur from the built-in value control', () => {
    const handleBlur = vi.fn();
    render(
      <LockableValueField
        value=""
        locked={false}
        onValueChange={vi.fn()}
        onValueBlur={handleBlur}
      />
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
      <LockableValueField
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

  it('withholds value changes from a consumer expression editor while locked', () => {
    const renderExpressionEditor = vi.fn(() => <div>Custom editor</div>);
    render(
      <LockableValueField
        value="item.id"
        locked
        mode="expression"
        onValueChange={vi.fn()}
        renderExpressionEditor={renderExpressionEditor}
      />
    );

    expect(renderExpressionEditor).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'item.id',
        readOnly: true,
        onValueChange: undefined,
      })
    );
  });

  it('does not attach a value-change handler to the built-in expression input while locked', () => {
    const handleChange = vi.fn();
    render(
      <LockableValueField value="item.id" locked mode="expression" onValueChange={handleChange} />
    );

    fireEvent.change(screen.getByDisplayValue('item.id'), { target: { value: 'other.id' } });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('uses the correct article in the built-in integer expression placeholder', () => {
    render(
      <LockableValueField
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
    render(<LockableValueField locked onLockedChange={handleLockedChange} />);

    await user.click(screen.getByRole('button', { name: 'Read-only. Click to make editable.' }));
    expect(handleLockedChange).toHaveBeenCalledWith(false);
  });

  it('does not open a menu when the lock button is clicked', async () => {
    const user = userEvent.setup();
    render(<LockableValueField locked onLockedChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Read-only. Click to make editable.' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('only shows the Required switch when onRequiredChange is provided', () => {
    const { rerender } = render(<LockableValueField locked={false} />);
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();

    rerender(<LockableValueField locked={false} required onRequiredChange={vi.fn()} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('only shows the field-type dropdown when onFieldTypeChange is provided', () => {
    const { rerender } = render(<LockableValueField locked={false} />);
    expect(screen.queryByRole('button', { name: 'Field type' })).not.toBeInTheDocument();

    rerender(<LockableValueField locked={false} onFieldTypeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Field type' })).toBeInTheDocument();
  });

  it('hides AI-assist and Insert-variable actions when showFieldActions is false', () => {
    render(<LockableValueField locked={false} showFieldActions={false} />);
    expect(screen.queryByRole('button', { name: 'AI assist' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Insert variable' })).not.toBeInTheDocument();
  });

  it('shows AI-assist and Insert-variable actions by default', () => {
    render(<LockableValueField locked={false} />);
    expect(screen.getByRole('button', { name: 'AI assist' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeInTheDocument();
  });

  it('only shows the Fixed/Expression mode dropdown for types that support expressions', () => {
    const { rerender } = render(<LockableValueField locked={false} fieldType="single-select" />);
    expect(screen.queryByRole('button', { name: 'Choose value type' })).not.toBeInTheDocument();

    rerender(<LockableValueField locked={false} fieldType="string" />);
    expect(screen.getByRole('button', { name: 'Choose value type' })).toBeInTheDocument();
  });

  it('renders headerActions content after the built-in controls', () => {
    render(
      <LockableValueField
        locked={false}
        headerActions={<button type="button">Delete field</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Delete field' })).toBeInTheDocument();
  });

  it('renders a Switch control for boolean fields when unlocked', () => {
    render(<LockableValueField locked={false} fieldType="boolean" value="true" />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('disables the boolean Switch when unlocked but onValueChange is not provided', () => {
    render(<LockableValueField locked={false} fieldType="boolean" value="true" />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('disables the date-picker trigger when unlocked but onValueChange is not provided', () => {
    render(<LockableValueField locked={false} fieldType="date" />);
    expect(screen.getByText('Pick a date').closest('button')).toBeDisabled();
  });

  it('calls onValueBlur when the date picker closes, not when focus enters its calendar', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    render(
      <LockableValueField
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
    render(<LockableValueField locked={false} fieldType="single-select" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('calls onValueBlur when the single-select closes, not when focus enters its menu', async () => {
    const user = userEvent.setup();
    const handleBlur = vi.fn();
    render(
      <LockableValueField
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
    render(<LockableValueField locked={false} fieldType="multi-select" />);
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('renders a file upload control for file fields when unlocked', () => {
    render(<LockableValueField locked={false} fieldType="file" />);
    expect(screen.getByText(/drag/i, { exact: false })).toBeInTheDocument();
  });

  it('disables the file upload control when unlocked but onValueChange is not provided', () => {
    const { container } = render(<LockableValueField locked={false} fieldType="file" />);
    expect(container.querySelector('input[type="file"]')).toBeDisabled();
  });

  it('associates the multi-select control with a custom label via the generated id', () => {
    render(
      <LockableValueField
        locked={false}
        fieldType="multi-select"
        label={<label htmlFor="tags-field">Tags</label>}
        id="tags-field"
      />
    );
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
  });

  it("uses the field's computed label as the file upload area's accessible name", () => {
    render(<LockableValueField locked={false} fieldType="file" />);
    expect(screen.getByRole('button', { name: 'File value' })).toBeInTheDocument();
  });

  it('associates the file upload control with a custom label via the generated id', () => {
    render(
      <LockableValueField
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
      <LockableValueField
        locked={false}
        fieldType="file"
        label={<span>Supporting document</span>}
        fileUploadAriaLabel="Supporting document"
      />
    );
    expect(screen.getByRole('button', { name: 'Supporting document' })).toBeInTheDocument();
  });

  it('ignores non-string entries when parsing a locked multi-select value', () => {
    const options = [{ label: 'Alpha', value: 'alpha' }];
    render(
      <LockableValueField
        locked
        fieldType="multi-select"
        value={JSON.stringify(['alpha', 42, null])}
        options={options}
      />
    );
    expect(screen.getByPlaceholderText('Multi select value')).toHaveValue('Alpha');
  });

  it('falls back to the raw value for a locked multi-select value that parses to no entries', () => {
    render(<LockableValueField locked fieldType="multi-select" value="not-json" />);
    expect(screen.getByPlaceholderText('Multi select value')).toHaveValue('not-json');
  });

  it('shows an empty display for a locked multi-select value that is an explicit empty array', () => {
    render(<LockableValueField locked fieldType="multi-select" value="[]" />);
    expect(screen.getByPlaceholderText('Multi select value')).toHaveValue('');
  });

  it('falls back to the raw value instead of throwing on an invalid date string', () => {
    expect(() =>
      render(<LockableValueField locked fieldType="date" value="not-a-date" />)
    ).not.toThrow();
    expect(screen.getByPlaceholderText('Date value')).toHaveValue('not-a-date');
  });

  it('shows the raw value instead of throwing when unlocked with an invalid date', () => {
    const { container } = render(
      <LockableValueField locked={false} fieldType="date" value="not-a-date" />
    );
    expect(container).toHaveTextContent('not-a-date');
  });

  it('rejects an out-of-range date-only value instead of silently normalizing it', () => {
    render(<LockableValueField locked fieldType="date" value="2024-13-40" />);
    expect(screen.getByPlaceholderText('Date value')).toHaveValue('2024-13-40');
  });

  it('formats a date-only value using the local calendar day, not UTC', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      render(<LockableValueField locked fieldType="date" value="2024-01-15" />);
      const expected = new Date(2024, 0, 15).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(screen.getByPlaceholderText('Date value')).toHaveValue(expected);
    } finally {
      if (originalTz === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = originalTz;
      }
    }
  });

  it('associates the default label with the field via a generated id when none is provided', () => {
    render(<LockableValueField locked={false} />);
    expect(screen.getByLabelText('String value')).toBeInTheDocument();
  });

  it('disables the lock button when onLockedChange is not provided', () => {
    render(<LockableValueField locked />);
    expect(screen.getByRole('button', { name: 'Read-only' })).toBeDisabled();
  });

  it('enables the lock button and uses the click-to-toggle label when onLockedChange is provided', () => {
    render(<LockableValueField locked onLockedChange={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Read-only. Click to make editable.' })
    ).not.toBeDisabled();
  });

  it('renders consumer-supplied options for single-select instead of the demo defaults', () => {
    const options = [{ label: 'Custom option', value: 'custom' }];
    render(
      <LockableValueField
        locked={false}
        fieldType="single-select"
        value="custom"
        options={options}
      />
    );
    expect(screen.getByRole('combobox')).toHaveTextContent('Custom option');
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  it('shows a consumer-supplied option label for a locked single-select value', () => {
    const options = [{ label: 'Custom option', value: 'custom' }];
    render(
      <LockableValueField locked fieldType="single-select" value="custom" options={options} />
    );
    expect(screen.getByPlaceholderText('Single select value')).toHaveValue('Custom option');
  });

  it('falls back to the raw value for a locked single-select value not present in options', () => {
    render(
      <LockableValueField
        locked
        fieldType="single-select"
        value="stale-option"
        options={[{ label: 'Option 1', value: 'option-1' }]}
      />
    );
    expect(screen.getByPlaceholderText('Single select value')).toHaveValue('stale-option');
  });

  it('disables Generate and does not call onGenerateWithAi when not provided', async () => {
    const user = userEvent.setup();
    render(<LockableValueField locked={false} />);
    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDisabled();
  });

  it('calls onGenerateWithAi with the entered prompt when Generate is clicked', async () => {
    const user = userEvent.setup();
    const handleGenerate = vi.fn();
    render(<LockableValueField locked={false} onGenerateWithAi={handleGenerate} />);

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    await user.type(screen.getByLabelText('Describe what you want'), 'a random number');
    await user.click(screen.getByRole('button', { name: 'Generate' }));

    expect(handleGenerate).toHaveBeenCalledWith('a random number');
  });

  it('shows an empty display instead of "False" for an unset boolean value when locked', () => {
    const { container } = render(<LockableValueField locked fieldType="boolean" value="" />);
    expect(screen.getByPlaceholderText('Boolean value')).toHaveValue('');
    expect(container).not.toHaveTextContent('False');
  });

  it('disables the Fixed/Expression dropdown trigger when onModeChange is not provided', () => {
    render(<LockableValueField locked={false} fieldType="string" />);
    expect(screen.getByRole('button', { name: 'Choose value type' })).toBeDisabled();
  });

  it('enables the Fixed/Expression dropdown trigger when onModeChange is provided', () => {
    render(<LockableValueField locked={false} fieldType="string" onModeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Choose value type' })).not.toBeDisabled();
  });

  it('reflects the current field type in the AI-assist output hint', async () => {
    const user = userEvent.setup();
    render(<LockableValueField locked={false} fieldType="date" />);
    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(screen.getByText('Output: Date expression')).toBeInTheDocument();
  });

  it('shows a value (not expression) output hint for types that do not support expressions', async () => {
    const user = userEvent.setup();
    render(<LockableValueField locked={false} fieldType="single-select" />);
    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(screen.getByText('Output: Single select value')).toBeInTheDocument();
  });

  it('reflects the field type and mode in the default label', () => {
    const { rerender } = render(<LockableValueField locked={false} fieldType="integer" />);
    expect(screen.getByPlaceholderText('Integer value')).toBeInTheDocument();

    rerender(<LockableValueField locked={false} fieldType="date" mode="expression" />);
    expect(screen.getByPlaceholderText('Write a date expression')).toBeInTheDocument();
  });

  it('disables Insert variable when no variables are provided', () => {
    render(<LockableValueField locked={false} />);
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('disables Insert variable when variables are provided but onValueChange is not', () => {
    render(
      <LockableValueField locked={false} variables={[{ label: 'Item ID', value: 'item.id' }]} />
    );
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('disables Insert variable while the field is locked', () => {
    render(
      <LockableValueField
        locked
        onValueChange={vi.fn()}
        variables={[{ label: 'Item ID', value: 'item.id' }]}
      />
    );
    expect(screen.getByRole('button', { name: 'Insert variable' })).toBeDisabled();
  });

  it('appends the selected variable to the current value when Insert variable is used', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <LockableValueField
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

  it('has no accessibility violations', async () => {
    const { container } = render(
      <LockableValueField
        locked={false}
        required
        onRequiredChange={vi.fn()}
        onFieldTypeChange={vi.fn()}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
