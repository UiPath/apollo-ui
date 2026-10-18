import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SequentialBranchHeader } from './SequentialBranchHeader';

describe('SequentialBranchHeader', () => {
  it('aligns an edge-styled label immediately above the branch target', () => {
    render(<SequentialBranchHeader x={128} targetTopY={240} label="False" selected />);

    const header = screen.getByTestId('sequential-branch-header');
    expect(header).toHaveStyle({ transform: 'translate(128px, 238px) translateY(-100%)' });
    const label = screen.getByText('False');
    expect(label).toHaveClass('react-flow__edge-label');
    expect(label.className).toContain('border-[var(--canvas-primary');
  });

  it('truncates a long label like EdgeLabel and lets the pill take hover for its tooltip', () => {
    render(
      <SequentialBranchHeader
        x={0}
        targetTopY={0}
        label="A branch label long enough that it would otherwise run into the next row"
      />
    );

    const label = screen.getByText(/A branch label long enough/);
    expect(label).toHaveClass('max-w-48', 'overflow-hidden', 'text-ellipsis');
    // The wrapper stays click-through; only the pill opts into pointer events.
    expect(label).toHaveClass('pointer-events-auto');
    expect(screen.getByTestId('sequential-branch-header')).toHaveClass('pointer-events-none');
  });
});
