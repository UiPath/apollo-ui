import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { describe, expect, it, vi } from 'vitest';
import { ChatFirstExperience } from './chat-first-experience';

describe('ChatFirstExperience', () => {
  it('renders the default greeting and subtitle', () => {
    render(<ChatFirstExperience />);
    expect(screen.getByRole('heading', { name: 'Hello David' })).toBeInTheDocument();
    expect(screen.getByText('What should we work on today?')).toBeInTheDocument();
  });

  it('renders a custom user name and subtitle', () => {
    render(<ChatFirstExperience userName="Priya" subtitle="Ready when you are" />);
    expect(screen.getByRole('heading', { name: 'Hello Priya' })).toBeInTheDocument();
    expect(screen.getByText('Ready when you are')).toBeInTheDocument();
  });

  it('renders the composer with the provided placeholder', () => {
    render(<ChatFirstExperience composerPlaceholder="Describe your automation" />);
    expect(screen.getByPlaceholderText('Describe your automation')).toBeInTheDocument();
  });

  it('renders default prompt suggestions', () => {
    render(<ChatFirstExperience />);
    expect(
      screen.getByRole('button', { name: 'Make a list of affordable apartments in NYC' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find the highest CD rates' })).toBeInTheDocument();
  });

  it('calls onSuggestionClick with the clicked suggestion', async () => {
    const user = userEvent.setup();
    const onSuggestionClick = vi.fn();
    const suggestions = [
      { id: 'a', label: 'Summarize my inbox' },
      { id: 'b', label: 'Build an expense report' },
    ];
    render(<ChatFirstExperience suggestions={suggestions} onSuggestionClick={onSuggestionClick} />);

    await user.click(screen.getByRole('button', { name: 'Build an expense report' }));
    expect(onSuggestionClick).toHaveBeenCalledTimes(1);
    expect(onSuggestionClick).toHaveBeenCalledWith(suggestions[1]);
  });

  it('calls onSubmit when a message is submitted from the composer', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ChatFirstExperience onSubmit={onSubmit} />);

    await user.type(screen.getByRole('textbox'), 'Automate onboarding');
    await user.click(screen.getByRole('button', { name: 'Submit message' }));
    expect(onSubmit).toHaveBeenCalledWith('Automate onboarding');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ChatFirstExperience />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
