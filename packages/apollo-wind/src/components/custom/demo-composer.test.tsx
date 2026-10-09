import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { DemoComposer } from './demo-composer';

describe('DemoComposer', () => {
  it('sends the trimmed draft', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<DemoComposer placeholder="Ask anything" onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Ask anything'), '  Automate invoices  {Enter}');

    expect(onSubmit).toHaveBeenCalledWith('Automate invoices');
  });

  it('shows the prototype actions', () => {
    render(<DemoComposer />);
    for (const name of ['Attach files', 'Add workflow', 'Settings', 'Send message']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('has no axe violations', async () => {
    const { container } = render(<DemoComposer placeholder="Ask anything" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
