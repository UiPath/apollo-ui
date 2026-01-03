import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('renders without crashing', () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Switch aria-label="Enable notifications" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders in unchecked state by default', () => {
    render(<Switch aria-label="Toggle" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });

  it('renders in checked state when checked prop is true', () => {
    render(<Switch checked aria-label="Toggle" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('handles user clicks', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} aria-label="Toggle" />);

    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard interaction with Space key', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Switch onCheckedChange={handleChange} aria-label="Toggle" />);

    const switchElement = screen.getByRole('switch');
    switchElement.focus();
    await user.keyboard(' ');

    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(<Switch disabled aria-label="Toggle" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toBeDisabled();
  });

  it('does not respond to clicks when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Switch disabled onCheckedChange={handleChange} aria-label="Toggle" />);

    const switchElement = screen.getByRole('switch');
    await user.click(switchElement);

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { rerender } = render(
      <Switch checked={false} onCheckedChange={handleChange} aria-label="Toggle" />
    );

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');

    await user.click(switchElement);
    expect(handleChange).toHaveBeenCalledWith(true);

    rerender(<Switch checked={true} onCheckedChange={handleChange} aria-label="Toggle" />);
    expect(switchElement).toHaveAttribute('data-state', 'checked');
  });

  it('applies custom className', () => {
    render(<Switch className="custom-class" aria-label="Toggle" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Switch ref={ref} aria-label="Toggle" />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has proper ARIA attributes', () => {
    render(<Switch aria-label="Enable dark mode" />);
    const switchElement = screen.getByRole('switch', {
      name: 'Enable dark mode',
    });
    expect(switchElement).toBeInTheDocument();
  });

  it('has focus-visible ring for keyboard navigation', () => {
    render(<Switch aria-label="Toggle" />);
    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveClass('focus-visible:ring-2');
  });

  it('toggles between checked and unchecked states', async () => {
    const user = userEvent.setup();
    render(<Switch aria-label="Toggle" />);

    const switchElement = screen.getByRole('switch');
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');

    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('data-state', 'checked');

    await user.click(switchElement);
    expect(switchElement).toHaveAttribute('data-state', 'unchecked');
  });
});
