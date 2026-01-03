import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { Textarea } from './textarea';

describe('Textarea', () => {
  it('renders without crashing', () => {
    render(<Textarea aria-label="Description" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Textarea aria-label="Enter your message" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('displays placeholder text', () => {
    render(<Textarea placeholder="Enter your message" aria-label="Message" />);
    expect(screen.getByPlaceholderText('Enter your message')).toBeInTheDocument();
  });

  it('accepts user input', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Message" />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Hello, World!');

    expect(textarea).toHaveValue('Hello, World!');
  });

  it('supports controlled mode', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    const { rerender } = render(
      <Textarea value="Initial text" onChange={handleChange} aria-label="Message" />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Initial text');

    await user.type(textarea, ' More text');
    expect(handleChange).toHaveBeenCalled();

    rerender(
      <Textarea value="Initial text More text" onChange={handleChange} aria-label="Message" />
    );
    expect(textarea).toHaveValue('Initial text More text');
  });

  it('can be disabled', () => {
    render(<Textarea disabled aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
  });

  it('does not accept input when disabled', async () => {
    const user = userEvent.setup();
    render(<Textarea disabled aria-label="Message" />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Text');

    expect(textarea).toHaveValue('');
  });

  it('can be readonly', () => {
    render(<Textarea readOnly value="Read only text" aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('readonly');
  });

  it('does not accept input when readonly', async () => {
    const user = userEvent.setup();
    render(<Textarea readOnly value="Read only" aria-label="Message" />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, ' More text');

    expect(textarea).toHaveValue('Read only');
  });

  it('applies custom className', () => {
    render(<Textarea className="custom-class" aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Textarea ref={ref} aria-label="Message" />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('has proper ARIA attributes', () => {
    render(<Textarea aria-label="Enter feedback" />);
    const textarea = screen.getByRole('textbox', { name: 'Enter feedback' });
    expect(textarea).toBeInTheDocument();
  });

  it('supports rows attribute', () => {
    render(<Textarea rows={5} aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('rows', '5');
  });

  it('supports maxLength attribute', async () => {
    const user = userEvent.setup();
    render(<Textarea maxLength={10} aria-label="Message" />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'This is a very long text');

    expect(textarea.value.length).toBeLessThanOrEqual(10);
  });

  it('has required attribute when required', () => {
    render(<Textarea required aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('required');
  });

  it('supports name attribute for form submission', () => {
    render(<Textarea name="message" aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('name', 'message');
  });

  it('handles multiline text', async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Message" />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'Line 1{Enter}Line 2{Enter}Line 3');

    expect(textarea).toHaveValue('Line 1\nLine 2\nLine 3');
  });

  it('has focus-visible ring for keyboard navigation', () => {
    render(<Textarea aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveClass('focus-visible:ring-2');
  });

  it('supports default value', () => {
    render(<Textarea defaultValue="Default text" aria-label="Message" />);
    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveValue('Default text');
  });
});
