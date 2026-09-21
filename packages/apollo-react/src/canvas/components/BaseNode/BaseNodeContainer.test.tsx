import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BaseContainer } from './BaseNodeContainer';
import { pathFor } from './BaseNodeOutline';

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
    expect(screen.queryByTestId('base-node-outline')).not.toBeInTheDocument();
  });

  it.each([
    'clipped',
    'document',
  ] as const)('draws %s as a outline instead of a bordered box', (shape) => {
    render(
      <BaseContainer shape={shape}>
        <span>content</span>
      </BaseContainer>
    );

    const container = screen.getByTestId('base-container');

    // The outline carries the fill and outline, so the container must not draw a second one.
    expect(container).toHaveClass('border-0');
    expect(container).not.toHaveClass('border-border');
    expect(screen.getByTestId('base-node-outline')).toBeInTheDocument();
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
    expect(screen.queryByTestId('base-node-outline')).not.toBeInTheDocument();
  });
});

describe('outline shapes carry their own state', () => {
  const outline = () => screen.getByTestId('base-node-outline').querySelector('path');

  it('does not draw a rectangular selection ring around a non-rectangular shape', () => {
    render(
      <BaseContainer shape="document" isSelected>
        <span>content</span>
      </BaseContainer>
    );

    expect(screen.getByTestId('base-container')).not.toHaveClass('outline-2');
    expect(outline()).toHaveClass('stroke-foreground-accent-muted');
  });

  it('shows hover on the outline, since a borderless container cannot', () => {
    render(
      <BaseContainer shape="clipped" isHovered>
        <span>content</span>
      </BaseContainer>
    );

    expect(outline()).toHaveClass('stroke-border-hover');
  });

  it('paints status on the outline rather than a border that is not there', () => {
    render(
      <BaseContainer shape="clipped" executionStatus="Failed">
        <span>content</span>
      </BaseContainer>
    );

    expect(screen.getByTestId('base-container')).not.toHaveClass('border-error');
    expect(outline()).toHaveClass('stroke-error');
  });

  it('still draws the rectangular ring for shapes that have a border', () => {
    render(
      <BaseContainer shape="stadium" isSelected>
        <span>content</span>
      </BaseContainer>
    );

    // tailwind-merge folds the bare `outline` utility into `outline-2`.
    expect(screen.getByTestId('base-container')).toHaveClass('outline-2');
  });
});

describe('outline geometry stays inside the node box', () => {
  // A control point below `bottom` put the curve outside the SVG, where it was clipped and its
  // drop-shadow rendered as a dark lobe under the node.
  it.each(['clipped', 'document'] as const)('keeps every %s coordinate within the box', (shape) => {
    const [width, height] = [288, 96];

    const numbers =
      pathFor(shape, width, height)
        .match(/-?\d+(\.\d+)?/g)
        ?.map(Number) ?? [];
    // Coordinates alternate x, y after each command letter; check both bounds generously.
    expect(numbers.length).toBeGreaterThan(0);
    expect(Math.min(...numbers)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...numbers)).toBeLessThanOrEqual(width);
  });

  it('keeps the document wave above the bottom edge', () => {
    const height = 96;
    const ys = pathFor('document', 288, height)
      .split(/[A-Z]/)
      .flatMap((segment) => segment.trim().split(/\s+/).filter(Boolean).map(Number))
      .filter((_, index) => index % 2 === 1);

    expect(Math.max(...ys)).toBeLessThanOrEqual(height);
  });
});
