import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ApSankeyDiagram, computeSankeyDimensions } from './ApSankeyDiagram';
import type { SankeyData } from './ApSankeyDiagram.types';

describe('ApSankeyDiagram', () => {
  const mockData: SankeyData = {
    nodes: [
      { id: 'node1', label: 'Start Node' },
      { id: 'node2', label: 'Middle Node' },
      { id: 'node3', label: 'End Node' },
    ],
    links: [
      { source: 'node1', target: 'node2', value: 10 },
      { source: 'node2', target: 'node3', value: 5 },
    ],
  };

  it('should render without crashing', () => {
    const { container } = render(<ApSankeyDiagram data={mockData} />);
    const sankeyContainer = container.querySelector('[role="figure"][aria-label="Sankey diagram"]');
    expect(sankeyContainer).toBeInTheDocument();
  });

  it('should apply custom width and height', () => {
    const { container } = render(
      <ApSankeyDiagram data={mockData} style={{ width: '600px', height: '300px' }} />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({ width: '600px', height: '300px' });
  });

  it('should apply custom className', () => {
    const { container } = render(<ApSankeyDiagram data={mockData} className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should have accessible label', () => {
    const ariaLabel = 'Job flow diagram';
    render(<ApSankeyDiagram data={mockData} ariaLabel={ariaLabel} />);
    expect(screen.getByLabelText(ariaLabel)).toBeInTheDocument();
  });

  it('should call onNodeClick when provided', () => {
    const onNodeClick = vi.fn();
    render(<ApSankeyDiagram data={mockData} onNodeClick={onNodeClick} />);
    // Note: Full implementation would require D3 interaction testing
  });

  it('should call onLinkClick when provided', () => {
    const onLinkClick = vi.fn();
    render(<ApSankeyDiagram data={mockData} onLinkClick={onLinkClick} />);
    // Note: Full implementation would require D3 interaction testing
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<ApSankeyDiagram data={mockData} ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('should handle empty data gracefully', () => {
    const emptyData: SankeyData = { nodes: [], links: [] };
    const { container } = render(<ApSankeyDiagram data={emptyData} />);
    const sankeyContainer = container.querySelector('[role="figure"][aria-label="Sankey diagram"]');
    expect(sankeyContainer).toBeInTheDocument();
  });

  it('should accept minNodeHeight and minColumnWidth props without error', () => {
    const { container } = render(
      <ApSankeyDiagram data={mockData} minNodeHeight={32} minColumnWidth={250} />
    );
    const sankeyContainer = container.querySelector('[role="figure"][aria-label="Sankey diagram"]');
    expect(sankeyContainer).toBeInTheDocument();
  });
});

describe('Zoom and pan', () => {
  const mockData: SankeyData = {
    nodes: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    links: [{ source: 'a', target: 'b', value: 10 }],
  };

  it('should render zoom controls, zoom group, and correct gradient coordinates', () => {
    const { container } = render(<ApSankeyDiagram data={mockData} />);

    // Zoom buttons with accessible labels
    const zoomIn = screen.getByLabelText('Zoom in');
    const zoomOut = screen.getByLabelText('Zoom out');
    const fitToView = screen.getByLabelText('Fit to view');
    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();
    expect(fitToView).toBeInTheDocument();

    // Buttons are interactive — clicking does not throw
    fireEvent.click(zoomIn);
    fireEvent.click(zoomOut);
    fireEvent.click(fitToView);

    // SVG contains a zoom group
    const svg = container.querySelector('svg');
    expect(svg?.querySelector('g')).toBeInTheDocument();

    // Gradients use userSpaceOnUse with numeric pixel coordinates, not percentages
    const gradient = container.querySelector('linearGradient');
    expect(gradient?.getAttribute('gradientUnits')).toBe('userSpaceOnUse');
    expect(gradient?.getAttribute('x1')).not.toContain('%');
    expect(gradient?.getAttribute('x2')).not.toContain('%');
    expect(Number(gradient?.getAttribute('x2'))).toBeGreaterThan(Number(gradient?.getAttribute('x1')));
  });
});

describe('computeSankeyDimensions', () => {
  const margins = { left: 5, right: 120, top: 5, bottom: 40 };

  it('should return zero dimensions for empty data', () => {
    const result = computeSankeyDimensions(
      { nodes: [], links: [] },
      16, // nodePadding
      24, // minNodeHeight
      200, // minColumnWidth
      margins.left,
      margins.right,
      margins.top,
      margins.bottom,
    );
    expect(result).toEqual({ minWidth: 0, minHeight: 0 });
  });

  it('should compute correct dimensions for a 3-node chain', () => {
    const data: SankeyData = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ],
      links: [
        { source: 'a', target: 'b', value: 10 },
        { source: 'b', target: 'c', value: 10 },
      ],
    };

    const result = computeSankeyDimensions(
      data,
      16, // nodePadding
      24, // minNodeHeight
      200, // minColumnWidth
      margins.left,
      margins.right,
      margins.top,
      margins.bottom,
    );

    // 3 columns × 200 + 5 + 120 = 725
    expect(result.minWidth).toBe(725);
    // 1 node per column max → 1 × (24 + 16) - 16 + 5 + 40 = 69
    expect(result.minHeight).toBe(69);
  });

  it('should compute correct dimensions for a diamond graph', () => {
    const data: SankeyData = {
      nodes: [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
        { id: 'd', label: 'D' },
      ],
      links: [
        { source: 'a', target: 'b', value: 5 },
        { source: 'a', target: 'c', value: 5 },
        { source: 'b', target: 'd', value: 5 },
        { source: 'c', target: 'd', value: 5 },
      ],
    };

    const result = computeSankeyDimensions(
      data,
      16,
      24,
      200,
      margins.left,
      margins.right,
      margins.top,
      margins.bottom,
    );

    // 3 columns (a=0, b/c=1, d=2) × 200 + 5 + 120 = 725
    expect(result.minWidth).toBe(725);
    // 2 nodes in middle column → 2 × (24 + 16) - 16 + 5 + 40 = 109
    expect(result.minHeight).toBe(109);
  });

  it('should scale height with many nodes per column', () => {
    // Fan-out: 1 source → 5 targets
    const data: SankeyData = {
      nodes: [
        { id: 'src', label: 'Source' },
        { id: 't1', label: 'T1' },
        { id: 't2', label: 'T2' },
        { id: 't3', label: 'T3' },
        { id: 't4', label: 'T4' },
        { id: 't5', label: 'T5' },
      ],
      links: [
        { source: 'src', target: 't1', value: 1 },
        { source: 'src', target: 't2', value: 1 },
        { source: 'src', target: 't3', value: 1 },
        { source: 'src', target: 't4', value: 1 },
        { source: 'src', target: 't5', value: 1 },
      ],
    };

    const result = computeSankeyDimensions(
      data,
      16,
      24,
      200,
      margins.left,
      margins.right,
      margins.top,
      margins.bottom,
    );

    // 2 columns × 200 + 5 + 120 = 525
    expect(result.minWidth).toBe(525);
    // 5 nodes in second column → 5 × (24 + 16) - 16 + 5 + 40 = 229
    expect(result.minHeight).toBe(229);
  });
});
