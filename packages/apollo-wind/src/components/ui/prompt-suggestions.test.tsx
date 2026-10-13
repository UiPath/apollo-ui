import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Sparkles } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { type PromptSuggestionItem, PromptSuggestions } from './prompt-suggestions';

const SUGGESTIONS: PromptSuggestionItem[] = [
  { label: 'Get started', prompt: 'How do I get started with this application?' },
  { label: 'Show features', prompt: 'What features are available?' },
];

describe('PromptSuggestions', () => {
  it('calls onSelect with the picked suggestion', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Show features' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(SUGGESTIONS[1]);
  });

  it('selects with the keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} />);

    await user.tab();
    await user.keyboard('{Enter}');
    await user.tab();
    await user.keyboard(' ');
    expect(onSelect.mock.calls).toEqual([[SUGGESTIONS[0]], [SUGGESTIONS[1]]]);
  });

  it('names the group from strings', () => {
    const { rerender } = render(<PromptSuggestions suggestions={SUGGESTIONS} />);
    expect(screen.getByRole('group', { name: 'Suggestions' })).toBeInTheDocument();

    rerender(<PromptSuggestions suggestions={SUGGESTIONS} strings={{ label: 'Vorschläge' }} />);
    expect(screen.getByRole('group', { name: 'Vorschläge' })).toBeInTheDocument();
  });

  it('shows the label as a visible title with showLabel', () => {
    render(<PromptSuggestions suggestions={SUGGESTIONS} showLabel />);
    const group = screen.getByRole('group', { name: 'Suggestions' });
    expect(group).not.toHaveAttribute('aria-label');
    expect(screen.getByText('Suggestions')).toBeVisible();
  });

  it('renders nothing without suggestions', () => {
    const { container } = render(<PromptSuggestions suggestions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables every chip', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PromptSuggestions suggestions={SUGGESTIONS} onSelect={onSelect} disabled />);

    for (const chip of screen.getAllByRole('button')) expect(chip).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Get started' }));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('reflects orientation and density, and indexes the chips', () => {
    render(
      <PromptSuggestions suggestions={SUGGESTIONS} orientation="horizontal" density="compact" />
    );
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('data-orientation', 'horizontal');
    expect(group).toHaveAttribute('data-density', 'compact');
    expect(screen.getByRole('button', { name: 'Show features' })).toHaveAttribute(
      'data-index',
      '1'
    );
  });

  it('renders an icon per suggestion', () => {
    render(
      <PromptSuggestions
        suggestions={[{ label: 'Ideas', icon: <Sparkles data-testid="icon" /> }]}
      />
    );
    expect(screen.getByRole('button', { name: 'Ideas' })).toContainElement(
      screen.getByTestId('icon')
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <>
        <PromptSuggestions suggestions={SUGGESTIONS} />
        <PromptSuggestions suggestions={SUGGESTIONS} showLabel orientation="horizontal" />
      </>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
