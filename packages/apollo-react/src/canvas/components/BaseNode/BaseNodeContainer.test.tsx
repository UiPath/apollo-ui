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

describe('BaseContainer shadow opt-out', () => {
  it('renders the rest shadow by default', () => {
    render(
      <BaseContainer>
        <span>content</span>
      </BaseContainer>
    );

    expect(screen.getByTestId('base-container')).toHaveClass('shadow-(--canvas-node-shadow-rest)');
  });

  it('omits every shadow utility class when shadow is disabled', () => {
    render(
      <BaseContainer shadow={false} isHovered interactionState="drag">
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    // None of the rest/hover/drag elevation classes should be present, even
    // though both the hover and drag states that normally add a shadow are active.
    expect(container).not.toHaveClass('shadow-(--canvas-node-shadow-rest)');
    expect(container).not.toHaveClass('shadow-(--canvas-node-shadow-hover)');
    expect(container).not.toHaveClass('shadow-(--canvas-node-shadow-lifted)');
    // Non-shadow drag styling still applies.
    expect(container).toHaveClass('cursor-grabbing');
  });
});
