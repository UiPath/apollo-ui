import { render, screen } from '@testing-library/react';
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

  it('renders an editable input when unlocked', () => {
    render(<LockableValueField value="" locked={false} />);
    expect(screen.getByPlaceholderText('String value')).not.toHaveAttribute('readonly');
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

  it('renders a file upload control for file fields when unlocked', () => {
    render(<LockableValueField locked={false} fieldType="file" />);
    expect(screen.getByText(/drag/i, { exact: false })).toBeInTheDocument();
  });

  it('falls back to the raw value instead of throwing on an invalid date string', () => {
    expect(() =>
      render(<LockableValueField locked fieldType="date" value="not-a-date" />)
    ).not.toThrow();
    expect(screen.getByPlaceholderText('String value')).toHaveValue('not-a-date');
  });

  it('shows the raw value instead of throwing when unlocked with an invalid date', () => {
    const { container } = render(
      <LockableValueField locked={false} fieldType="date" value="not-a-date" />
    );
    expect(container).toHaveTextContent('not-a-date');
  });

  it('formats a date-only value using the local calendar day, not UTC', () => {
    const originalTz = process.env.TZ;
    process.env.TZ = 'America/Los_Angeles';
    try {
      render(<LockableValueField locked fieldType="date" value="2024-01-15" />);
      expect(screen.getByPlaceholderText('String value')).toHaveValue('January 15, 2024');
    } finally {
      process.env.TZ = originalTz;
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
    expect(screen.getByPlaceholderText('String value')).toHaveValue('Custom option');
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
