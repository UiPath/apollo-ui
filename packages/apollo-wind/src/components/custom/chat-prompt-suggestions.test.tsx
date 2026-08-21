import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { PromptSuggestions } from './chat-prompt-suggestions';

const suggestions = [
  { id: '1', label: 'Make a list of affordable apartments in NYC' },
  { id: '2', label: 'Find the highest CD rates' },
  { id: '3', label: 'Draft a weekly status report' },
];

describe('PromptSuggestions', () => {
  it('renders one button per suggestion', () => {
    render(<PromptSuggestions suggestions={suggestions} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Draft a weekly status report' })
    ).toBeInTheDocument();
  });

  it('renders nothing when there are no suggestions', () => {
    const { container } = render(<PromptSuggestions suggestions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when suggestions are omitted', () => {
    const { container } = render(<PromptSuggestions />);
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onSelect with the full suggestion object', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={suggestions} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Find the highest CD rates' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(suggestions[1]);
  });

  it('does not throw when clicked without an onSelect handler', async () => {
    const user = userEvent.setup();
    render(<PromptSuggestions suggestions={suggestions} />);
    await user.click(screen.getByRole('button', { name: suggestions[0].label }));
    expect(screen.getByRole('button', { name: suggestions[0].label })).toBeInTheDocument();
  });

  it('applies a custom className to the container', () => {
    const { container } = render(
      <PromptSuggestions suggestions={suggestions} className="custom-list" />
    );
    expect(container.firstElementChild).toHaveClass('custom-list');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<PromptSuggestions suggestions={suggestions} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
