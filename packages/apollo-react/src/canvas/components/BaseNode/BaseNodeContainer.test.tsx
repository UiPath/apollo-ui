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

describe('DMN shapes', () => {
  it('rounds a stadium fully, rather than by the node radius', () => {
    render(
      <BaseContainer shape="stadium">
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    expect(container).toHaveClass('rounded-full');
    expect(container).not.toHaveClass('rounded-(--node-radius)');
    expect(screen.queryByTestId('base-node-silhouette')).not.toBeInTheDocument();
  });

  it.each([
    'clipped',
    'document',
  ] as const)('draws %s as a silhouette instead of a bordered box', (shape) => {
    render(
      <BaseContainer shape={shape}>
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    // The silhouette carries the fill and outline, so the container must not draw a second one.
    expect(container).toHaveClass('border-0');
    expect(container).not.toHaveClass('border-border');
    expect(screen.getByTestId('base-node-silhouette')).toBeInTheDocument();
  });

  it.each([
    'stadium',
    'clipped',
    'document',
  ] as const)('lays %s out as a wide card, like a rectangle', (shape) => {
    render(
      <BaseContainer shape={shape}>
        <span>content</span>
      </BaseContainer>
    );

    expect(screen.getByTestId('base-container')).toHaveClass('flex-row');
  });

  it('leaves the existing shapes alone', () => {
    render(
      <BaseContainer shape="rectangle">
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    expect(container).toHaveClass('rounded-(--node-radius)');
    expect(container).toHaveClass('border-border');
    expect(screen.queryByTestId('base-node-silhouette')).not.toBeInTheDocument();
  });
});
