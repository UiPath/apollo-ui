import { render, screen } from '@testing-library/react';
import { DragIndicator } from './DragIndicator';

describe('DragIndicator', () => {
  it.each([
    ['column', 'Drag to reorder whole column', 'group-hover/header:opacity-100!'],
    ['row', 'Drag to reorder whole row', 'group-hover/gutter:opacity-100!'],
  ] as const)("is a hidden %s pill titled in the table's own words", (axis, title, reveal) => {
    render(<DragIndicator axis={axis} testId="indicator" />);

    const indicator = screen.getByTestId('indicator');
    expect(indicator).toHaveAttribute('title', title);
    expect(indicator).toHaveAttribute('aria-hidden', 'true');
    expect(indicator).toHaveClass(reveal);
  });
});
