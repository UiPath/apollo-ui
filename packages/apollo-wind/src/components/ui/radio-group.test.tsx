import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Label } from './label';
import { RadioGroup, RadioGroupItem } from './radio-group';

describe('RadioGroup', () => {
  const RadioGroupExample = ({
    onValueChange = vi.fn(),
  }: {
    onValueChange?: (value: string) => void;
  }) => (
    <RadioGroup onValueChange={onValueChange} aria-label="Choose an option">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-1" id="option-1" />
        <Label htmlFor="option-1">Option 1</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-2" id="option-2" />
        <Label htmlFor="option-2">Option 2</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option-3" id="option-3" />
        <Label htmlFor="option-3">Option 3</Label>
      </div>
    </RadioGroup>
  );

  it('renders without crashing', () => {
    render(<RadioGroupExample />);
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<RadioGroupExample />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders all radio items', () => {
    render(<RadioGroupExample />);
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 3')).toBeInTheDocument();
  });

  it('selects radio item when clicked', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(<RadioGroupExample onValueChange={handleValueChange} />);

    const radio1 = screen.getByLabelText('Option 1');
    await user.click(radio1);

    expect(handleValueChange).toHaveBeenCalledWith('option-1');
    expect(radio1).toBeChecked();
  });

  it('only allows one selection at a time', async () => {
    const user = userEvent.setup();
    render(<RadioGroupExample />);

    const radio1 = screen.getByLabelText('Option 1');
    const radio2 = screen.getByLabelText('Option 2');

    await user.click(radio1);
    expect(radio1).toBeChecked();

    await user.click(radio2);
    expect(radio2).toBeChecked();
    expect(radio1).not.toBeChecked();
  });

  it('supports keyboard navigation with Arrow Right', async () => {
    const user = userEvent.setup();
    render(<RadioGroupExample />);

    const radio1 = screen.getByLabelText('Option 1');
    await user.click(radio1);
    await user.keyboard('{ArrowRight}');

    await waitFor(() => {
      const radio2 = screen.getByLabelText('Option 2');
      expect(radio2).toHaveFocus();
    });
  });

  it('supports keyboard navigation with Arrow Left', async () => {
    const user = userEvent.setup();
    render(<RadioGroupExample />);

    const radio2 = screen.getByLabelText('Option 2');
    await user.click(radio2);
    await user.keyboard('{ArrowLeft}');

    await waitFor(() => {
      const radio1 = screen.getByLabelText('Option 1');
      expect(radio1).toHaveFocus();
    });
  });

  it('supports Space key to select', async () => {
    const user = userEvent.setup();
    render(<RadioGroupExample />);

    const radio1 = screen.getByLabelText('Option 1');
    await user.click(radio1);
    await user.keyboard(' ');

    await waitFor(() => {
      expect(radio1).toBeChecked();
    });
  });

  it('can be disabled', () => {
    render(
      <RadioGroup disabled aria-label="Options">
        <RadioGroupItem value="option-1" id="option-1" />
        <Label htmlFor="option-1">Option 1</Label>
      </RadioGroup>
    );

    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();
  });

  it('supports disabled individual items', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    render(
      <RadioGroup onValueChange={handleValueChange} aria-label="Options">
        <div>
          <RadioGroupItem value="option-1" id="option-1" disabled />
          <Label htmlFor="option-1">Disabled</Label>
        </div>
        <div>
          <RadioGroupItem value="option-2" id="option-2" />
          <Label htmlFor="option-2">Enabled</Label>
        </div>
      </RadioGroup>
    );

    const radio1 = screen.getByLabelText('Disabled');
    await user.click(radio1);

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(radio1).not.toBeChecked();
  });

  it('supports default value', () => {
    render(
      <RadioGroup defaultValue="option-2" aria-label="Options">
        <div>
          <RadioGroupItem value="option-1" id="option-1" />
          <Label htmlFor="option-1">Option 1</Label>
        </div>
        <div>
          <RadioGroupItem value="option-2" id="option-2" />
          <Label htmlFor="option-2">Option 2</Label>
        </div>
      </RadioGroup>
    );

    const radio2 = screen.getByLabelText('Option 2');
    expect(radio2).toBeChecked();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();
    const { rerender } = render(
      <RadioGroup value="option-1" onValueChange={handleValueChange} aria-label="Options">
        <div>
          <RadioGroupItem value="option-1" id="option-1" />
          <Label htmlFor="option-1">Option 1</Label>
        </div>
        <div>
          <RadioGroupItem value="option-2" id="option-2" />
          <Label htmlFor="option-2">Option 2</Label>
        </div>
      </RadioGroup>
    );

    const radio1 = screen.getByLabelText('Option 1');
    expect(radio1).toBeChecked();

    const radio2 = screen.getByLabelText('Option 2');
    await user.click(radio2);
    expect(handleValueChange).toHaveBeenCalledWith('option-2');

    rerender(
      <RadioGroup value="option-2" onValueChange={handleValueChange} aria-label="Options">
        <div>
          <RadioGroupItem value="option-1" id="option-1" />
          <Label htmlFor="option-1">Option 1</Label>
        </div>
        <div>
          <RadioGroupItem value="option-2" id="option-2" />
          <Label htmlFor="option-2">Option 2</Label>
        </div>
      </RadioGroup>
    );

    expect(radio2).toBeChecked();
  });

  it('applies custom className to RadioGroup', () => {
    render(
      <RadioGroup className="custom-group" aria-label="Options">
        <RadioGroupItem value="option-1" id="option-1" />
      </RadioGroup>
    );

    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toHaveClass('custom-group');
  });

  it('applies custom className to RadioGroupItem', () => {
    render(
      <RadioGroup aria-label="Options">
        <RadioGroupItem value="option-1" id="option-1" className="custom-item" />
      </RadioGroup>
    );

    const radio = screen.getByRole('radio');
    expect(radio).toHaveClass('custom-item');
  });

  it('forwards ref correctly to RadioGroup', () => {
    const ref = { current: null };
    render(
      <RadioGroup ref={ref} aria-label="Options">
        <RadioGroupItem value="option-1" id="option-1" />
      </RadioGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('forwards ref correctly to RadioGroupItem', () => {
    const ref = { current: null };
    render(
      <RadioGroup aria-label="Options">
        <RadioGroupItem ref={ref} value="option-1" id="option-1" />
      </RadioGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has proper ARIA attributes', () => {
    render(<RadioGroupExample />);
    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toHaveAttribute('aria-label', 'Choose an option');
  });

  it('wraps around when navigating with keyboard', async () => {
    const user = userEvent.setup();
    render(<RadioGroupExample />);

    const radio3 = screen.getByLabelText('Option 3');
    await user.click(radio3);
    await user.keyboard('{ArrowDown}');

    await waitFor(() => {
      const radio1 = screen.getByLabelText('Option 1');
      expect(radio1).toHaveFocus();
    });
  });
});
