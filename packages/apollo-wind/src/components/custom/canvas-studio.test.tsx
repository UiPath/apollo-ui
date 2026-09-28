import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import { StudioCanvas, StudioGrid, StudioGridItem } from './canvas-studio';

describe('StudioCanvas', () => {
  it('renders children inside a data-canvas container', () => {
    const { container } = render(
      <StudioCanvas>
        <p>Canvas content</p>
      </StudioCanvas>
    );
    expect(screen.getByText('Canvas content')).toBeInTheDocument();
    expect(container.querySelector('[data-canvas]')).toBeInTheDocument();
  });

  it('applies the background variant class', () => {
    const { container } = render(<StudioCanvas background="surface">content</StudioCanvas>);
    const canvas = container.querySelector('[data-canvas]');
    expect(canvas).toHaveClass('bg-surface');
  });

  it('centers content in a 760px column by default', () => {
    const { container } = render(<StudioCanvas>content</StudioCanvas>);
    expect(container.querySelector('.w-\\[760px\\]')).toBeInTheDocument();
  });

  it('skips the centered column when fullWidth is set', () => {
    const { container } = render(<StudioCanvas fullWidth>content</StudioCanvas>);
    expect(container.querySelector('.w-\\[760px\\]')).not.toBeInTheDocument();
  });
});

describe('StudioGrid', () => {
  it('renders a 12-column grid with md gap by default', () => {
    const { container } = render(
      <StudioGrid>
        <span>cell</span>
      </StudioGrid>
    );
    const grid = container.firstElementChild;
    expect(grid).toHaveClass('grid', 'grid-cols-12', 'gap-4');
  });

  it('applies custom cols and gap', () => {
    const { container } = render(
      <StudioGrid cols={4} gap="lg">
        <span>cell</span>
      </StudioGrid>
    );
    expect(container.firstElementChild).toHaveClass('grid-cols-4', 'gap-6');
  });
});

describe('StudioGridItem', () => {
  it('renders children with the default full span and border', () => {
    render(<StudioGridItem>Item content</StudioGridItem>);
    const item = screen.getByText('Item content');
    expect(item).toHaveClass('col-span-12', 'border', 'rounded-lg');
  });

  it('applies a custom column span', () => {
    render(<StudioGridItem cols={6}>Half</StudioGridItem>);
    expect(screen.getByText('Half')).toHaveClass('col-span-6');
  });

  it('lets an explicit col-span class in className win over the cols prop', () => {
    render(
      <StudioGridItem cols={6} className="col-span-2">
        Custom span
      </StudioGridItem>
    );
    const item = screen.getByText('Custom span');
    expect(item).toHaveClass('col-span-2');
    expect(item).not.toHaveClass('col-span-6');
  });

  it('omits the border classes when border is false', () => {
    render(<StudioGridItem border={false}>Borderless</StudioGridItem>);
    expect(screen.getByText('Borderless')).not.toHaveClass('border');
  });

  it('spans the full width when canvasResponsive and the canvas is narrow', () => {
    // jsdom reports offsetWidth 0, which falls in the < 768px bucket
    render(
      <StudioCanvas>
        <StudioGrid>
          <StudioGridItem canvasResponsive>Responsive</StudioGridItem>
        </StudioGrid>
      </StudioCanvas>
    );
    expect(screen.getByText('Responsive')).toHaveClass('col-span-12');
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <StudioCanvas>
        <StudioGrid>
          <StudioGridItem>Accessible item</StudioGridItem>
        </StudioGrid>
      </StudioCanvas>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
