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
    expect(label.getAttribute('style')).toContain('var(--canvas-primary)');
  });
});
