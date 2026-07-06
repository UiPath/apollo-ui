import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Lock } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from './input-group';

describe('InputGroup', () => {
  it('renders an input inside the group', () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <InputGroup>
        <InputGroupAddon>
          <Lock />
        </InputGroupAddon>
        <InputGroupInput aria-label="Locked field" />
      </InputGroup>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies ghost variant classes to the wrapper, not the input', () => {
    render(
      <InputGroup variant="ghost" data-testid="group">
        <InputGroupInput placeholder="Ghost" />
      </InputGroup>
    );
    const group = screen.getByTestId('group');
    expect(group).toHaveClass('bg-surface-overlay');
    expect(group).not.toHaveClass('border-input');
    // The input's own border is always zeroed, regardless of the group's variant.
    expect(screen.getByPlaceholderText('Ghost')).toHaveClass('border-0');
  });

  it('applies xs size classes to the wrapper', () => {
    render(
      <InputGroup size="xs" data-testid="group">
        <InputGroupInput placeholder="Compact" />
      </InputGroup>
    );
    expect(screen.getByTestId('group')).toHaveClass('h-6');
  });

  it('forwards focus to the input when the addon is clicked', async () => {
    const user = userEvent.setup();
    render(
      <InputGroup>
        <InputGroupAddon data-testid="addon">
          <Lock />
        </InputGroupAddon>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );

    await user.click(screen.getByTestId('addon'));
    expect(screen.getByPlaceholderText('Enter text')).toHaveFocus();
  });

  it('does not steal focus when clicking a button inside the addon', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupAddon>
          <InputGroupButton onClick={handleClick} aria-label="Lock">
            <Lock />
          </InputGroupButton>
        </InputGroupAddon>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );

    await user.click(screen.getByRole('button', { name: 'Lock' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(screen.getByPlaceholderText('Enter text')).not.toHaveFocus();
  });

  it('still calls a consumer-provided onClick on the addon', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <InputGroup>
        <InputGroupAddon onClick={handleClick} data-testid="addon">
          <Lock />
        </InputGroupAddon>
        <InputGroupInput placeholder="Enter text" />
      </InputGroup>
    );

    await user.click(screen.getByTestId('addon'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles disabled state on the input', () => {
    render(
      <InputGroup>
        <InputGroupInput placeholder="Disabled" disabled />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Disabled')).toBeDisabled();
  });

  it('supports a textarea control', () => {
    render(
      <InputGroup>
        <InputGroupTextarea placeholder="Notes" />
      </InputGroup>
    );
    expect(screen.getByPlaceholderText('Notes')).toBeInTheDocument();
  });

  it('renders InputGroupText content', () => {
    render(
      <InputGroup>
        <InputGroupText>https://</InputGroupText>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
    );
    expect(screen.getByText('https://')).toBeInTheDocument();
  });

  it('forwards ref to the underlying input', () => {
    const ref = { current: null };
    render(
      <InputGroup>
        <InputGroupInput ref={ref} />
      </InputGroup>
    );
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});
