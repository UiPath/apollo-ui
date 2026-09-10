import { render, screen } from '@testing-library/react';
import { ReactFlowProvider } from '@uipath/apollo-react/canvas/xyflow/react';
import { describe, expect, it, vi } from 'vitest';
import type { AgentFlowSuggestionGroup } from '../../../types';
import { SuggestionGroupPanel } from './SuggestionGroupPanel';

const suggestionGroup: AgentFlowSuggestionGroup = {
  id: 'group-1',
  suggestions: [
    { id: 'suggestion-1', type: 'add' },
    { id: 'suggestion-2', type: 'add' },
  ],
};

const renderWithProvider = (ui: React.ReactElement) =>
  render(<ReactFlowProvider>{ui}</ReactFlowProvider>);

describe('SuggestionGroupPanel', () => {
  it('renders nothing when there is no suggestion group', () => {
    renderWithProvider(<SuggestionGroupPanel suggestionGroup={null} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('exposes accessible names for the previous/next navigator buttons', () => {
    renderWithProvider(
      <SuggestionGroupPanel
        suggestionGroup={suggestionGroup}
        currentIndex={0}
        onNavigateNext={vi.fn()}
        onNavigatePrevious={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Previous suggestion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next suggestion' })).toBeInTheDocument();
  });

  it('calls onNavigatePrevious/onNavigateNext when the navigator buttons are clicked', async () => {
    const onNavigatePrevious = vi.fn();
    const onNavigateNext = vi.fn();

    renderWithProvider(
      <SuggestionGroupPanel
        suggestionGroup={suggestionGroup}
        currentIndex={0}
        onNavigateNext={onNavigateNext}
        onNavigatePrevious={onNavigatePrevious}
      />
    );

    screen.getByRole('button', { name: 'Previous suggestion' }).click();
    expect(onNavigatePrevious).toHaveBeenCalledTimes(1);

    screen.getByRole('button', { name: 'Next suggestion' }).click();
    expect(onNavigateNext).toHaveBeenCalledTimes(1);
  });

  it('shows the current position among the suggestions', () => {
    renderWithProvider(<SuggestionGroupPanel suggestionGroup={suggestionGroup} currentIndex={0} />);

    expect(
      screen.getByText(
        (_, element) => element?.tagName === 'SPAN' && element.textContent === '1 of 2'
      )
    ).toBeInTheDocument();
  });
});
