import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Input } from './input';
import { Label } from './label';

describe('Input', () => {
  it('renders input field', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText(/enter text/i)).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <div>
        <Label htmlFor="test-input">Test Input</Label>
        <Input id="test-input" />
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText(/type here/i);

    await user.type(input, 'Hello World');
    expect(input).toHaveValue('Hello World');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="text" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');

    rerender(<Input type="email" />);
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('accepts custom className', () => {
    render(<Input className="custom-input" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom-input');
  });

  it('renders inline validation and associates it with the input', () => {
    render(<Input id="node-name" error="Enter a unique name before saving." />);
    const input = screen.getByRole('textbox');
    const message = screen.getByText('Enter a unique name before saving.');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'node-name-error');
    expect(input).toHaveAttribute('aria-errormessage', 'node-name-error');
    expect(message).toHaveAttribute('id', 'node-name-error');
    expect(message).toHaveTextContent('Enter a unique name before saving.');
    expect(message).toHaveClass('text-xs', 'leading-4', 'text-error');
  });

  it('preserves existing descriptions when rendering inline validation', () => {
    render(
      <>
        <p id="name-help">Use a unique node name.</p>
        <Input id="node-name" aria-describedby="name-help" error="Name is already in use." />
      </>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-describedby',
      'name-help node-name-error'
    );
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('applies ghost variant classes', () => {
    render(<Input variant="ghost" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('bg-surface-overlay');
    expect(input).not.toHaveClass('border-input');
  });

  it('applies xs size classes', () => {
    render(<Input size="xs" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-6', 'text-xs', 'rounded');
  });

  it('applies ghost variant and xs size together', () => {
    render(<Input variant="ghost" size="xs" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('h-6', 'text-xs', 'rounded', 'bg-surface-overlay');
    expect(input).not.toHaveClass('border-input');
  });
});
