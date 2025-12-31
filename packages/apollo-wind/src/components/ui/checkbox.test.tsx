import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Checkbox } from './checkbox';

describe('Checkbox', () => {
  it('renders without crashing', () => {
    render(<Checkbox />);
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Checkbox aria-label="Accept terms" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders in unchecked state by default', () => {
    render(<Checkbox aria-label="Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');
  });

  it('renders in checked state when checked prop is true', () => {
    render(<Checkbox checked aria-label="Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('handles user clicks', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} aria-label="Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard interaction with Space key', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox onCheckedChange={handleChange} aria-label="Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    checkbox.focus();
    await user.keyboard(' ');

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(<Checkbox disabled aria-label="Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('does not respond to clicks when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Checkbox disabled onCheckedChange={handleChange} aria-label="Checkbox" />);

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { rerender } = render(
      <Checkbox checked={false} onCheckedChange={handleChange} aria-label="Checkbox" />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'unchecked');

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledWith(true);

    rerender(<Checkbox checked={true} onCheckedChange={handleChange} aria-label="Checkbox" />);
    expect(checkbox).toHaveAttribute('data-state', 'checked');
  });

  it('supports indeterminate state', () => {
    render(<Checkbox checked="indeterminate" aria-label="Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('data-state', 'indeterminate');
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-class" aria-label="Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Checkbox ref={ref} aria-label="Checkbox" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has proper ARIA attributes', () => {
    render(<Checkbox aria-label="Accept terms and conditions" />);
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms and conditions' });
    expect(checkbox).toBeInTheDocument();
  });

  it('has focus-visible ring for keyboard navigation', () => {
    render(<Checkbox aria-label="Checkbox" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('focus-visible:ring-2');
  });
});
