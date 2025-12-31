import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Bold } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Toggle } from './toggle';

describe('Toggle', () => {
  it('renders without crashing', () => {
    render(<Toggle aria-label="Toggle bold">Bold</Toggle>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Toggle aria-label="Toggle bold">Bold</Toggle>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('renders in unpressed state by default', () => {
    render(<Toggle aria-label="Toggle">Toggle</Toggle>);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('renders in pressed state when pressed prop is true', () => {
    render(
      <Toggle pressed aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'on');
  });

  it('toggles state when clicked', async () => {
    const user = userEvent.setup();
    render(<Toggle aria-label="Toggle">Toggle</Toggle>);

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'off');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'on');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('data-state', 'off');
  });

  it('calls onPressedChange when toggled', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    render(
      <Toggle onPressedChange={handlePressedChange} aria-label="Toggle">
        Toggle
      </Toggle>,
    );

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(handlePressedChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard interaction with Space', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    render(
      <Toggle onPressedChange={handlePressedChange} aria-label="Toggle">
        Toggle
      </Toggle>,
    );

    const toggle = screen.getByRole('button');
    toggle.focus();
    await user.keyboard(' ');

    expect(handlePressedChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard interaction with Enter', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    render(
      <Toggle onPressedChange={handlePressedChange} aria-label="Toggle">
        Toggle
      </Toggle>,
    );

    const toggle = screen.getByRole('button');
    toggle.focus();
    await user.keyboard('{Enter}');

    expect(handlePressedChange).toHaveBeenCalledWith(true);
  });

  it('can be disabled', () => {
    render(
      <Toggle disabled aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toBeDisabled();
  });

  it('does not toggle when disabled', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    render(
      <Toggle disabled onPressedChange={handlePressedChange} aria-label="Toggle">
        Toggle
      </Toggle>,
    );

    const toggle = screen.getByRole('button');
    await user.click(toggle);

    expect(handlePressedChange).not.toHaveBeenCalled();
  });

  it('applies default variant classes', () => {
    render(<Toggle aria-label="Toggle">Toggle</Toggle>);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('bg-transparent');
  });

  it('applies outline variant classes', () => {
    render(
      <Toggle variant="outline" aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('border');
  });

  it('applies small size classes', () => {
    render(
      <Toggle size="sm" aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('h-9');
  });

  it('applies large size classes', () => {
    render(
      <Toggle size="lg" aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('h-11');
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handlePressedChange = vi.fn();
    const { rerender } = render(
      <Toggle pressed={false} onPressedChange={handlePressedChange} aria-label="Toggle">
        Toggle
      </Toggle>,
    );

    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'off');

    await user.click(toggle);
    expect(handlePressedChange).toHaveBeenCalledWith(true);

    rerender(
      <Toggle pressed={true} onPressedChange={handlePressedChange} aria-label="Toggle">
        Toggle
      </Toggle>,
    );

    expect(toggle).toHaveAttribute('data-state', 'on');
  });

  it('applies custom className', () => {
    render(
      <Toggle className="custom-toggle" aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('custom-toggle');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(
      <Toggle ref={ref} aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('has proper ARIA attributes', () => {
    render(<Toggle aria-label="Toggle formatting">Bold</Toggle>);
    const toggle = screen.getByRole('button', { name: 'Toggle formatting' });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-pressed');
  });

  it('renders with icon', () => {
    const { container } = render(
      <Toggle aria-label="Toggle bold">
        <Bold className="h-4 w-4" />
      </Toggle>,
    );
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('supports default value', () => {
    render(
      <Toggle defaultPressed aria-label="Toggle">
        Toggle
      </Toggle>,
    );
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveAttribute('data-state', 'on');
  });

  it('has focus-visible ring for keyboard navigation', () => {
    render(<Toggle aria-label="Toggle">Toggle</Toggle>);
    const toggle = screen.getByRole('button');
    expect(toggle).toHaveClass('focus-visible:ring-2');
  });
});
