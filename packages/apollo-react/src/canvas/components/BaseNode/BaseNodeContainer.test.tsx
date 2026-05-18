import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BaseContainer } from './BaseNodeContainer';

describe('BaseContainer status border hover treatment', () => {
  it('preserves a resolved status border while hovered', () => {
    render(
      <BaseContainer isHovered executionStatus="Completed">
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    expect(container).toHaveClass('border-success');
    expect(container).toHaveClass('shadow-(--canvas-node-shadow-hover)');
    expect(container).not.toHaveClass('border-border-hover');
  });

  it('keeps the hover border for neutral statuses without a resolved status border', () => {
    render(
      <BaseContainer isHovered executionStatus="NotExecuted">
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    expect(container).toHaveClass('border-border-hover');
    expect(container).toHaveClass('shadow-(--canvas-node-shadow-hover)');
  });
});
