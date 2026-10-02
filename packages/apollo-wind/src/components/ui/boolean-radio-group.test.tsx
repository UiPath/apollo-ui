import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BooleanRadioGroup } from './boolean-radio-group';
import { InputGroup } from './input-group';

function Controlled({
  initial,
  onChange,
}: {
  initial?: boolean;
  onChange: (v: boolean | null) => void;
}) {
  const [value, setValue] = useState<boolean | null | undefined>(initial);
  return (
    <BooleanRadioGroup
      aria-label="Flag"
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('BooleanRadioGroup', () => {
  it('is disabled inside a disabled group', () => {
    render(
      <InputGroup disabled>
        <BooleanRadioGroup aria-label="Flag" value={null} onValueChange={vi.fn()} />
      </InputGroup>
    );
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it("points at an invalid group's message, keeping its own description", () => {
    render(
      <InputGroup error="Pick one" errorId="flag-error">
        <BooleanRadioGroup
          aria-label="Flag"
          aria-describedby="flag-help"
          value={null}
          onValueChange={vi.fn()}
        />
      </InputGroup>
    );
    const group = screen.getByRole('radiogroup', { name: 'Flag' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAttribute('aria-describedby', 'flag-help flag-error');
    expect(group).toHaveAttribute('aria-errormessage', 'flag-error');
  });

  it('shows the unset state with neither radio checked', () => {
    render(<BooleanRadioGroup aria-label="Flag" value={undefined} onValueChange={vi.fn()} />);
    for (const radio of screen.getAllByRole('radio')) expect(radio).not.toBeChecked();
  });

  it('sets true and false, and clears when the checked radio is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'True' }));
    expect(onChange).toHaveBeenLastCalledWith(true);
    await user.click(screen.getByRole('radio', { name: 'False' }));
    expect(onChange).toHaveBeenLastCalledWith(false);
    await user.click(screen.getByRole('radio', { name: 'False' }));
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByRole('radio', { name: 'False' })).not.toBeChecked();
  });

  it('takes translated labels', () => {
    render(
      <BooleanRadioGroup
        aria-label="Flag"
        value
        onValueChange={vi.fn()}
        strings={{ trueLabel: 'Vrai', falseLabel: 'Faux' }}
      />
    );
    expect(screen.getByRole('radio', { name: 'Vrai' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Faux' })).toBeInTheDocument();
  });

  it("makes both radios the group's control only inside an InputGroup", () => {
    const { rerender } = render(
      <BooleanRadioGroup aria-label="Flag" value={undefined} onValueChange={vi.fn()} />
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('data-slot', 'radio-group-item');
    }
    rerender(
      <InputGroup variant="none">
        <BooleanRadioGroup aria-label="Flag" value={undefined} onValueChange={vi.fn()} />
      </InputGroup>
    );
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).toHaveAttribute('data-slot', 'input-group-control');
    }
  });
});
