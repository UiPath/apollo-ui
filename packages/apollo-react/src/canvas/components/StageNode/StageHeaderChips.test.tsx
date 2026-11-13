import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../utils/testing';
import { StageHeaderChips } from './StageHeaderChips';
import { StageHeaderChipType } from './StageNode.types';

describe('StageHeaderChips', () => {
  it('renders nothing when there are no chips', () => {
    render(<StageHeaderChips id="case" chips={[]} />);

    expect(screen.queryByTestId('stage-header-chips-case')).not.toBeInTheDocument();
  });

  it('renders each chip with its icon and count under the given id', () => {
    render(
      <StageHeaderChips
        id="case"
        chips={[
          { type: StageHeaderChipType.Entry, count: 2, tooltip: '2 entry rules' },
          { type: StageHeaderChipType.Completion, tooltip: '1 completion rule' },
          { type: StageHeaderChipType.Milestone, count: 0, tooltip: '0 milestones' },
        ]}
      />
    );

    const entry = screen.getByTestId('stage-entry-chip-case');
    expect(entry.querySelector('svg')).toBeInTheDocument();
    expect(entry).toHaveTextContent('2');
    expect(screen.getByTestId('stage-completion-chip-case')).not.toHaveTextContent(/\d/);
    expect(screen.getByTestId('stage-milestone-chip-case')).toHaveTextContent('0');
  });

  it('adds the consumer class to the chip row', () => {
    render(
      <StageHeaderChips
        id="case"
        chips={[{ type: StageHeaderChipType.Entry }]}
        className="ml-auto"
      />
    );

    expect(screen.getByTestId('stage-header-chips-case')).toHaveClass('ml-auto', 'flex');
  });

  it('calls the chip onClick without letting the click bubble further', async () => {
    const onClick = vi.fn();
    const onDocumentClick = vi.fn();
    render(
      <StageHeaderChips
        id="case"
        chips={[{ type: StageHeaderChipType.Completion, tooltip: 'Completion', onClick }]}
      />
    );
    document.addEventListener('click', onDocumentClick);

    await userEvent.click(screen.getByRole('button', { name: 'Completion' }));
    document.removeEventListener('click', onDocumentClick);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDocumentClick).not.toHaveBeenCalled();
  });

  it('renders status chips as labelled pills', () => {
    render(<StageHeaderChips id="case" chips={[{ type: StageHeaderChipType.EndsCase }]} />);

    expect(screen.getByTestId('stage-ends-case-badge-case')).toHaveTextContent('Ends case');
  });

  it('makes a status pill with a tooltip a tab stop described by its tooltip', async () => {
    render(
      <StageHeaderChips
        id="case"
        chips={[
          { type: StageHeaderChipType.Optional, tooltip: 'Not required for case completion' },
          { type: StageHeaderChipType.EndsCase },
        ]}
      />
    );

    await userEvent.tab();
    const optional = screen.getByRole('img', { name: 'Optional' });
    expect(optional).toHaveFocus();
    expect(optional).toHaveAccessibleDescription('Not required for case completion');

    await userEvent.tab();
    expect(document.body).toHaveFocus();
  });

  it('describes a clickable status pill by its tooltip', () => {
    render(
      <StageHeaderChips
        id="case"
        chips={[
          {
            type: StageHeaderChipType.EndsCase,
            tooltip: 'Entering this stage ends the case',
            onClick: vi.fn(),
          },
        ]}
      />
    );

    expect(screen.getByRole('button', { name: 'Ends case' })).toHaveAccessibleDescription(
      'Entering this stage ends the case'
    );
  });
});
