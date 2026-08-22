import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ChatComposer } from './chat-composer';

describe('ChatComposer', () => {
  it('renders a textarea with the default placeholder', () => {
    render(<ChatComposer />);
    expect(screen.getByPlaceholderText('I would like you to automate my')).toBeInTheDocument();
  });

  it('renders a custom placeholder', () => {
    render(<ChatComposer placeholder="Ask me anything" />);
    expect(screen.getByPlaceholderText('Ask me anything')).toBeInTheDocument();
  });

  it('shows the voice button when empty and the submit button once text is entered', async () => {
    const user = userEvent.setup();
    render(<ChatComposer />);

    expect(screen.getByRole('button', { name: 'Voice input' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit message' })).not.toBeInTheDocument();

    await user.type(screen.getByRole('textbox'), 'Automate my invoices');

    expect(screen.getByRole('button', { name: 'Submit message' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voice input' })).not.toBeInTheDocument();
  });

  it('submits the trimmed value on click and clears the input', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, '  hello world  ');
    await user.click(screen.getByRole('button', { name: 'Submit message' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('hello world');
    expect(textarea).toHaveValue('');
  });

  it('submits on Enter but not on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);

    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'line one');
    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSubmit).not.toHaveBeenCalled();

    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith('line one');
  });

  it('does not submit when the value is only whitespace', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), '   ');
    await user.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ChatComposer />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
