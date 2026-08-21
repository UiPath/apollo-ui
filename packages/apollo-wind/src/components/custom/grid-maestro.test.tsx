import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { Canvas, Grid, GridItem } from './grid-maestro';

describe('Canvas', () => {
  it('renders children inside a main landmark', () => {
    render(<Canvas>Canvas content</Canvas>);
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent('Canvas content');
  });

  it('merges a custom className', () => {
    render(<Canvas className="custom-canvas">content</Canvas>);
    expect(screen.getByRole('main')).toHaveClass('custom-canvas', 'flex-1');
  });
});

describe('Grid', () => {
  it('applies the responsive column classes', () => {
    const { container } = render(
      <Grid>
        <span>cell</span>
      </Grid>
    );
    expect(container.firstElementChild).toHaveClass(
      'grid',
      'grid-cols-1',
      'md:grid-cols-2',
      'lg:grid-cols-4'
    );
  });

  it('merges a custom className', () => {
    const { container } = render(
      <Grid className="custom-grid">
        <span>cell</span>
      </Grid>
    );
    expect(container.firstElementChild).toHaveClass('custom-grid');
  });
});

describe('GridItem', () => {
  it('renders children with the given className', () => {
    render(<GridItem className="col-span-2">Item content</GridItem>);
    const item = screen.getByText('Item content');
    expect(item).toHaveClass('col-span-2');
  });

  it('composes into a full layout without accessibility violations', async () => {
    const { container } = render(
      <Canvas>
        <Grid>
          <GridItem>First</GridItem>
          <GridItem>Second</GridItem>
        </Grid>
      </Canvas>
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
