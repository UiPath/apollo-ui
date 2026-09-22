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
  it('rounds a pill fully, rather than by the node radius', () => {
    render(
      <BaseContainer shape="pill">
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
    'pill',
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
      <BaseContainer shape="pill" isSelected>
        <span>content</span>
      </BaseContainer>
    );

    // tailwind-merge folds the bare `outline` utility into `outline-2`.
    expect(screen.getByTestId('base-container')).toHaveClass('outline-2');
  });
});

describe('an outlined node is lifted like every other node', () => {
  const outline = () => screen.getByTestId('base-node-outline');

  it.each([
    ['rest', {}, 'rest'],
    ['hover', { isHovered: true }, 'hover'],
    ['drag', { interactionState: 'drag' as const }, 'lifted'],
  ])('uses the canvas elevation token on %s', (_name, props, token) => {
    render(
      <BaseContainer shape="document" {...props}>
        <span>content</span>
      </BaseContainer>
    );

    // The canvas tokens, not tailwind's generic drop-shadows: those are a few percent black and
    // are invisible against a dark canvas, while every other node is lifted by these.
    expect(outline()).toHaveClass(`[filter:var(--canvas-node-filter-${token})]`);
  });

  it('casts nothing when the node is asked not to', () => {
    render(
      <BaseContainer shape="document" shadow={false}>
        <span>content</span>
      </BaseContainer>
    );

    expect(outline().className).not.toMatch(/canvas-node-filter/);
  });
});

describe('outline geometry stays inside the node box', () => {
  const [WIDTH, HEIGHT] = [288, 96];

  /**
   * Coordinate pairs from a path, read by each command's own arity.
   *
   * A flat number list cannot be split into x/y pairs: `H` carries one x, `V` one y, and `C`
   * three pairs. Assuming alternation checks the wrong axis and lets an out-of-bounds y through.
   */
  const pointsOf = (path: string) => {
    const points: { x?: number; y?: number }[] = [];
    for (const [, command, rawArgs] of path.matchAll(/([MLHVC])([^A-Za-z]*)/g)) {
      const args = rawArgs
        .trim()
        .split(/[\s,]+/)
        .filter(Boolean)
        .map(Number);
      if (command === 'H') points.push(...args.map((x) => ({ x })));
      else if (command === 'V') points.push(...args.map((y) => ({ y })));
      else for (let i = 0; i + 1 < args.length; i += 2) points.push({ x: args[i], y: args[i + 1] });
    }
    return points;
  };

  it('reads H, V and C coordinates by their own arity', () => {
    expect(pointsOf('M1 2 H10 V20 C3 4 5 6 7 8')).toEqual([
      { x: 1, y: 2 },
      { x: 10 },
      { y: 20 },
      { x: 3, y: 4 },
      { x: 5, y: 6 },
      { x: 7, y: 8 },
    ]);
  });

  it.each(['clipped', 'document'] as const)('keeps every %s coordinate within the box', (shape) => {
    const points = pointsOf(pathFor(shape, WIDTH, HEIGHT));

    expect(points.length).toBeGreaterThan(0);
    for (const { x, y } of points) {
      if (x !== undefined) expect(x).toBeGreaterThanOrEqual(0);
      if (x !== undefined) expect(x).toBeLessThanOrEqual(WIDTH);
      if (y !== undefined) expect(y).toBeGreaterThanOrEqual(0);
      // The wave once reached past `bottom`, where it was clipped and cast a lobe of shadow.
      if (y !== undefined) expect(y).toBeLessThanOrEqual(HEIGHT);
    }
  });

  it('catches a y that escapes the bottom edge', () => {
    const escaping = pointsOf('M0 0 H288 V84 C216 108 72 72 0 84 Z');

    expect(Math.max(...escaping.flatMap(({ y }) => (y === undefined ? [] : [y])))).toBeGreaterThan(
      HEIGHT
    );
  });
});

it('paints the outline behind the node content, not over it', () => {
  render(
    <BaseContainer shape="document">
      <span>content</span>
    </BaseContainer>
  );

  // An absolutely positioned element paints above in-flow content whatever the DOM order, so
  // without a negative z-index the fill hides the icon and label underneath it.
  expect(screen.getByTestId('base-node-outline')).toHaveClass('-z-10');
});
