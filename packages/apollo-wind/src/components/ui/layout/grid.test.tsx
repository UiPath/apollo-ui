import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { Grid } from './grid';

describe('Grid', () => {
  it('renders children', () => {
    render(
      <Grid cols={3}>
        <span>One</span>
        <span>Two</span>
        <span>Three</span>
      </Grid>
    );
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
    expect(screen.getByText('Three')).toBeInTheDocument();
  });

  it('always applies the grid class', () => {
    render(<Grid data-testid="grid">Content</Grid>);
    expect(screen.getByTestId('grid')).toHaveClass('grid');
  });

  it('maps numeric cols and rows to Tailwind classes', () => {
    render(
      <Grid data-testid="grid" cols={3} rows={2}>
        Content
      </Grid>
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('grid-cols-3');
    expect(grid).toHaveClass('grid-rows-2');
  });

  it('uses inline styles for string grid templates', () => {
    render(
      <Grid data-testid="grid" cols="1fr 2fr" rows="auto 1fr">
        Content
      </Grid>
    );
    expect(screen.getByTestId('grid')).toHaveStyle({
      gridTemplateColumns: '1fr 2fr',
      gridTemplateRows: 'auto 1fr',
    });
  });

  it('maps gap to both a class and an inline rem fallback', () => {
    render(
      <Grid data-testid="grid" gap={4}>
        Content
      </Grid>
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('gap-4');
    expect(grid).toHaveStyle({ gap: '1rem' });
  });

  it('maps gapX and gapY to inline column and row gaps', () => {
    render(
      <Grid data-testid="grid" gapX={2} gapY={8}>
        Content
      </Grid>
    );
    expect(screen.getByTestId('grid')).toHaveStyle({
      columnGap: '0.5rem',
      rowGap: '2rem',
    });
  });

  it('maps auto flow, auto cols, and auto rows to classes', () => {
    render(
      <Grid data-testid="grid" autoFlow="column" autoCols="min" autoRows="max">
        Content
      </Grid>
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('grid-flow-column');
    expect(grid).toHaveClass('auto-cols-min');
    expect(grid).toHaveClass('auto-rows-max');
  });

  it('maps spacing and size props to classes', () => {
    render(
      <Grid data-testid="grid" p={4} w="full">
        Content
      </Grid>
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('p-4');
    expect(grid).toHaveClass('w-full');
  });

  it('merges custom className with generated classes', () => {
    render(
      <Grid data-testid="grid" cols={2} className="custom-grid">
        Content
      </Grid>
    );
    const grid = screen.getByTestId('grid');
    expect(grid).toHaveClass('custom-grid');
    expect(grid).toHaveClass('grid-cols-2');
  });

  it('preserves user-provided style entries', () => {
    render(
      <Grid data-testid="grid" style={{ backgroundColor: 'rgb(1, 2, 3)' }}>
        Content
      </Grid>
    );
    expect(screen.getByTestId('grid')).toHaveStyle({ backgroundColor: 'rgb(1, 2, 3)' });
  });

  it('forwards its ref to the rendered div', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Grid ref={ref} data-testid="grid">
        Content
      </Grid>
    );
    expect(ref.current).toBe(screen.getByTestId('grid'));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Grid cols={2} gap={2}>
        <button type="button">Action</button>
        <span>Label</span>
      </Grid>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
