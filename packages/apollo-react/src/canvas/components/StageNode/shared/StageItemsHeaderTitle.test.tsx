import { describe, expect, it } from 'vitest';
import { render, screen } from '../../../utils/testing';
import { StageItemsHeaderTitle } from './StageItemsHeaderTitle';

describe('StageItemsHeaderTitle', () => {
  it('renders the title text under the provided test id', () => {
    render(<StageItemsHeaderTitle title="Entry rules" testId="entry-rules-header-stage-1" />);

    const header = screen.getByTestId('entry-rules-header-stage-1');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Entry rules');
  });

  it('applies the muted heading styling classes', () => {
    render(<StageItemsHeaderTitle title="Tasks" testId="tasks-header-stage-1" />);

    const header = screen.getByTestId('tasks-header-stage-1');
    expect(header).toHaveClass('text-xs', 'font-bold', 'text-foreground-muted');
  });
});
